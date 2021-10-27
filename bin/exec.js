'use strict';
const childProcess = require('child_process');

exports.executeOsCommandSync = function(command, commandLine) {
    const results = childProcess.spawnSync(command, commandLine);
    console.log(results.stdout.toString());
    console.error(results.stderr.toString());
    if (results.status !== 0) {
        throw results.error;
    }    
}
