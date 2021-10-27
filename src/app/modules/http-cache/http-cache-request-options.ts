export interface HttpCacheRequestOptions {
    doNotUseCachedResponse?: boolean;
    doNotCacheResponse?: boolean;
}

export interface HttpCacheRequestOptionArgs {
    doNotUseCachedResponse?: boolean;
    doNotCacheResponse?: boolean;
    method?: HttpCacheRequestMethod;
    body?: any;
}

export enum HttpCacheRequestMethod {
    Get = 0,
    Post = 1,
    Put = 2,
    Delete = 3,
    Options = 4,
    Head = 5,
    Patch = 6,
}