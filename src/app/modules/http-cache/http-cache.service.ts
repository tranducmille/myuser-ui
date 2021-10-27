import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpParams, HttpHeaders  } from '@angular/common/http';
import { HttpCacheRequestMethod, HttpCacheRequestOptionArgs } from './http-cache-request-options';

export interface HttpCacheConfig {
    ttl: number;
    ttlCheckInterval: number;
}

interface HttpCacheEntry {
    created: number;
    response: HttpResponse<any>;
}

const ALL_DOTS_REGEX = new RegExp('\\.', 'g');
const isIe: boolean = /MSIE|Trident\/|Edge\//.test(window.navigator.userAgent);

export const HTTP_CACHE_CONFIG_KEY = 'com.xtivia.http.cache.config';
export const HTTP_CACHE_ENTRY_KEY = 'com.xtivia.http.cache.entry.';
export const HTTP_CACHE_SERVICE_KEY = 'com.xtivia.http.cache.service.';
export const HTTP_CACHE_ENTRY_REGEX = new RegExp(HTTP_CACHE_ENTRY_KEY.replace(ALL_DOTS_REGEX, '\\.'));
export const HTTP_CACHE_SERVICE_REGEX = new RegExp(HTTP_CACHE_SERVICE_KEY.replace(ALL_DOTS_REGEX, '\\.'));

const config: HttpCacheConfig = getConfig() || {
    ttl: 360000,
    ttlCheckInterval: 5000
};

let ttlTimer = startTtlCheckTimer();

export function startTtlCheckTimer(): any {
    return setInterval(function walkTtls() {
        Object.keys(sessionStorage).forEach(function findEntries(key) {
            if (HTTP_CACHE_ENTRY_REGEX.test(key)) {
                const entry = JSON.parse(sessionStorage.getItem(key)) as HttpCacheEntry;
                if (entry && entry.created + config.ttl < Date.now()) {
                    sessionStorage.removeItem(key);
                }
            }
        });
    }, config.ttlCheckInterval);
}

export function getConfig(): HttpCacheConfig {
    const conf = sessionStorage.getItem(HTTP_CACHE_CONFIG_KEY);
    if (conf) {
        return JSON.parse(conf);
    }
    return null;
}

export function setTtl(ttl: number) {
    config.ttl = ttl;
}

export function setTtlCheckInterval(ttlCheckInterval: number) {
    config.ttlCheckInterval = ttlCheckInterval;
    if (ttlTimer) {
        clearInterval(ttlTimer);
    }
    ttlTimer = startTtlCheckTimer();
}

export function flush() {
    Object.keys(sessionStorage)
        .forEach(function findEntries(key) {
            if (HTTP_CACHE_ENTRY_REGEX.test(key)) {
                sessionStorage.removeItem(key);
            }
        });
}

export function flushServices() {
    Object.keys(sessionStorage)
        .forEach(function findServices(key) {
            if (HTTP_CACHE_SERVICE_REGEX.test(key)) {
                sessionStorage.removeItem(key);
            }
        });
}

@Injectable()
export class HttpCache {

    public lookup(url: string, options: HttpCacheRequestOptionArgs): HttpResponse<any> {
        if (!(options && options.doNotUseCachedResponse)) {
            const cacheKey = this.createCacheKey(url, options);
            if (cacheKey) {
                const entry = sessionStorage.getItem(cacheKey.toString());
                if (entry) {
                    const results = JSON.parse(entry) as HttpCacheEntry;
                    if (Date.now() < results.created + config.ttl) {
                        return this.createResponseFromJson(results.response);
                    }
                }
            }
        }
        return null;
    }

    public addInterestedService(url: string, methods?: Array<string>) {
        const entry = this.getCacheServicesEntry(url, methods);
        if (methods) {
            for ( let i = 0; i < methods.length; i++) {
                const method = this.getMethodForString(methods[i]);
                if (method) {
                    const index = method.valueOf();
                    entry[index] = true;
                }
            }
        } else {
            for ( let i = 0; i < entry.length; i++) {
                entry[i] = true;
            }
        }
        sessionStorage.setItem(HTTP_CACHE_SERVICE_KEY + url.toString(), JSON.stringify(entry));
    }

    public isServiceCacheable(url: string, options?: HttpCacheRequestOptionArgs): boolean {
        const urlKey = typeof url === 'string' ? url.toString()  : null;
        const serviceEntry = sessionStorage.getItem(HTTP_CACHE_SERVICE_KEY + urlKey);
        const service = serviceEntry ? JSON.parse(serviceEntry) : null;
        const methodValue = this.getMethodForString(options.method);
        return  !this.isNullOrUndefined(methodValue) && service && service[methodValue.valueOf()];
    }

    private isNullOrUndefined(input: any): boolean {
        return input === null || input === undefined;
    }

    public cacheServiceResponse(url: string, response: HttpResponse<any>, options?: HttpCacheRequestOptionArgs) {
        if (!(options && options.doNotCacheResponse) && this.isServiceCacheable(url, options)) {
            const cacheKey = this.createCacheKey(url, options);
            if (cacheKey) {
                sessionStorage.setItem(cacheKey.toString(), JSON.stringify({
                    created: Date.now(),
                    response: response
                }));
            }
        }
    }

    private hashString(value: string): number {
        let hash = 0;
        if (value === null || value === undefined || value.length === 0) {
            return hash;
        }
        for (let i = 0; i < value.length; i++) {
            hash  = hash * 31 + value.charCodeAt(i);
            hash  = hash & hash;
        }
        return hash;
    }

    public isCachable(req: HttpRequest<any>): boolean{

        return (req && req.method.toUpperCase() === 'GET') ;
    }

    public getMethodForString(method: string | HttpCacheRequestMethod): HttpCacheRequestMethod {
        if (typeof method === 'string') {
            switch (method.toUpperCase()) {
                case 'GET':
                    return HttpCacheRequestMethod.Get;
                case 'PUT':
                    return HttpCacheRequestMethod.Put;
                case 'POST':
                    return HttpCacheRequestMethod.Post;
                case 'DELETE':
                    return HttpCacheRequestMethod.Delete;
                case 'PATCH':
                    return HttpCacheRequestMethod.Patch;
                case 'HEAD':
                    return HttpCacheRequestMethod.Head;
                case 'OPTIONS':
                    return HttpCacheRequestMethod.Options;
                default:
                    return null;
            }
        }
        return method;
    }

    private createCacheKeyBody(body: any) {
        let key = '..';
        if (typeof body === 'object') {
            body = JSON.stringify(body);
        }
        if (typeof body === 'string') {
            key = '.' + body.length;
            key += '.' + this.hashString(body);
        }
        return key;
    }

    private createCacheKey(url: string | HttpRequest<any>, options: HttpCacheRequestOptionArgs): string {
        let key = HTTP_CACHE_ENTRY_KEY;
        const method = this.getMethod(url, options);
        if (this.isNullOrUndefined(method)) {
            return null;
        }
        key += method;
        key += this.createCacheKeyBody(this.getBody(url, options));
        key += '.' + this.getUrl(url);
        return key;
    }

    private getUrl(url: string | HttpRequest<any>): string {
        return typeof url === 'string' ? url : url.url;
    }

    private getMethod(url: string | HttpRequest<any>, options?: HttpCacheRequestOptionArgs): HttpCacheRequestMethod {
        if (typeof url === 'string') {
            return options ? this.getMethodForString(options.method) : null;
        }
        return this.getMethodForString(url.method);
    }

    private getBody(url: string | HttpRequest<any>, options?: HttpCacheRequestOptionArgs): string {
        if (typeof url === 'string') {
            return options ? options.body : null;
        }
        return (url as HttpRequest<any>).url.toString();
    }

    private getCacheServicesEntry(url: string, methods?: Array<string>): boolean[] {
        const serviceEntry = sessionStorage.getItem(HTTP_CACHE_SERVICE_KEY + url.toString());
        const entryMethods = serviceEntry ? JSON.parse(serviceEntry) : [false, false, false, false, false, false, false];
        if (methods) {
            methods.forEach((method) => {
                if (typeof method === 'string') {
                    const methodValue = this.getMethodForString(method);
                    if (methodValue) {
                        entryMethods[methodValue.valueOf()] = true;
                    } else {
                        return null;
                    }
                } else {
                    entryMethods[method] = true;
                }
            });
        } else {
            for (let i = 0; i < entryMethods.length; i++) {
                entryMethods[i]  = true;
            }
        }
        return entryMethods;
    }

    private createResponseFromJson(object: any): any {
        const response = object ? new HttpResponse({
            body: object.body,
            status: object.status,
            headers: object.headers,
            url: object.url
        }) : null;
        return response;
    }

    protected ieSearchOptions(params?: any): any {
        params = params ? params : new HttpParams();
        if (params) {
            params.append('ieFix', new Date().getTime().toString());
        } 
        return params;
    }

    protected ieHeadersOptions(headers: any): HttpHeaders {
        headers = headers ? headers : new HttpHeaders();
        headers.append('Pragma', 'no-cache');
        headers.append('Cache-Control', 'no-cache');
        return headers;
    }

    public addIeOptions(request: HttpRequest<any>): HttpRequest<any> {
        if (isIe) {
            this.ieHeadersOptions(request.headers);
            this.ieSearchOptions(request.params);
        }
        return request;
    }
}
