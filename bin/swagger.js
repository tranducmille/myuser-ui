/* eslint-disable no-console */
'use strict';
const childProcess = require('child_process');
const fs = require('fs');
const fse = require('fs-extra');
const yaml = require('node-yaml');
const util = require('util');
const path = require('path');
const configuration = require('../package.json');
const exec = require('./exec.js');

const starterYaml = 'services.yaml';
const generatedDir = path.normalize('./src/generated');
const outputFile = generatedDir + '/services.json';

function generate(yaml, output, callback) {
    if (fs.existsSync(yaml)) {
        var codegen = childProcess.spawn('java', [
            '-jar', __dirname + '/swagger-codegen-cli.jar', 'generate', '-i', yaml, '-l',
            'typescript-angular', '-o', output, '--additional-properties', 'ngVersion=9.0.0'
        ]);

        codegen.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        codegen.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        codegen.on('close', (code) => {
            if (callback) {
                if (code && code === 0) {
                    return callback();
                }
                return callback(code);
            }
        });
    } else {
        console.error('Unable to find file', yaml);
    }
}

function copyStarterFile() {
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir);
    }
    if (!fs.existsSync(outputFile)) {
        let schema = yaml.readSync('../'+starterYaml);
        fs.writeFileSync(outputFile, JSON.stringify(schema));
    }
}

function walkReferences(schema) {
    for(let node in schema) {
        let nodeValue = schema[node];
        if (node === '$ref' && typeof(nodeValue) === 'string') {
            schema[node] = nodeValue.replace(/^.*(?=#)/,'');
        } else if (typeof(nodeValue) === 'object') {
            schema[node] = walkReferences(nodeValue);
        }
    }
    return schema;
}

function concatenateDefinitionForSchema(schemaName) {
    try {
        let schema = walkReferences(yaml.readSync('../'+schemaName));
        let services = JSON.parse(fs.readFileSync(outputFile));
        for(var definition in schema.components) {
            if (services.components == null || services.components == undefined) {
                services.components = {};
            }
            if (services.components[definition]) {
                throw new Error("Duplicate definition: " + definition);
            }
            services.components[definition] = schema.components[definition];
        }
        fs.writeFileSync(outputFile, JSON.stringify(services));
    } catch (err) {
        console.error('Failed to parse', schemaName, 'with the error', err.stack);
        throw err;
    }
}

function concatenateRoutes() {
    for (var i in configuration.serviceDefinitions["service-routes"]) {
        try {
            let schema = walkReferences(yaml.readSync('../'+configuration.serviceDefinitions["service-routes"][i]));
            let services = JSON.parse(fs.readFileSync(outputFile));
            let servicesBasePath = schema.servers[0].variables.basePath;
            let basePath  = schema.servers[0].url.substring(servicesBasePath.length);
            for(var path in schema.paths) {

                if (services.paths == null || services.paths == undefined) {
                    services.paths = {};
                }
                if (services.paths[basePath + path]) {
                    throw new Error("Duplicate route: " + basePath + path);
                }
                
                services.paths[basePath + path] = schema.paths[path];
            }
          
            fs.writeFileSync(outputFile, JSON.stringify(services));
        } catch (err) {
            console.error('Failed to parse routes for ', configuration.serviceDefinitions["service-routes"][i], 'with the error', err.stack);
            throw err;
        }
    }
}

function concatenateDefinitions() {
    for (var i in configuration.serviceDefinitions["service-routes"]) {
        concatenateDefinitionForSchema(configuration.serviceDefinitions["service-routes"][i]);
    }
    for (var i in configuration.serviceDefinitions["service-definitions"]) {
        concatenateDefinitionForSchema(configuration.serviceDefinitions["service-definitions"][i]);
    }
}

fse.removeSync(generatedDir);
copyStarterFile();
concatenateRoutes();
concatenateDefinitions();
generate(outputFile, generatedDir);
