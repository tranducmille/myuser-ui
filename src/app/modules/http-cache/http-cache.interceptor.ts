import { HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpEvent, HTTP_INTERCEPTORS} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { HttpCache } from './http-cache.service';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { HttpCacheRequestOptionArgs } from './http-cache-request-options';

@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {

    constructor(
        private httpCache: HttpCache
    ) { }

    getHttpCacheRequestOptions(method: any, body: any) { 
        return {
            doNotUseCachedResponse: false,
            doNotCacheResponse: false,
            method: method,
            body: body
        } as HttpCacheRequestOptionArgs;
    }

    intercept(request: HttpRequest<any>, next: HttpHandler) {

        if (this.httpCache.isCachable(request)) {

            this.httpCache.addInterestedService(request.url);
        }

        const options = this.getHttpCacheRequestOptions(request.method, request.body);

        const results = this.httpCache.lookup(request.url, options);

        if (results) {
            return new Observable<HttpResponse<any>>((observer) => {
                observer.next(results);
            });
        }

        return next.handle(this.httpCache.addIeOptions(request))
                   .pipe(
                        tap<HttpEvent<any>>((response: HttpEvent<any>) => {
                            if (response instanceof HttpResponse) {
                                this.httpCache.cacheServiceResponse(request.url, response, options);
                                return response;
                            }
                    })
                );

    }
}

export const HttpInterceptorProviders = [
    { provide: HTTP_INTERCEPTORS, useClass: HttpCacheInterceptor, multi: true }
  ]; 