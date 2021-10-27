import { NgModule } from '@angular/core';
import { HttpCache } from './http-cache.service';
import { HttpInterceptorProviders } from './http-cache.interceptor';

@NgModule({
    imports: [],
    declarations: [],
    providers: [
      HttpCache,
      HttpInterceptorProviders
    ]
  })
export class HttpCacheModule {
}
