import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';  
import { AppRoutingModule } from './app-routing.module';
import { UserModule } from './modules/user/user.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpCacheModule } from './modules/http-cache/http-cache.module';

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		RouterModule.forRoot([]),
		UserModule,
		HttpCacheModule,
		BrowserAnimationsModule,
		AppRoutingModule
	],
	declarations: [AppComponent],
	entryComponents: [AppComponent],
	bootstrap: [], // Don't bootstrap any component statically (see ngDoBootstrap() below)
	providers: [{provide: APP_BASE_HREF, useValue : '/' }],
})
export class AppModule {
	// Avoid bootstraping any component statically because we need to attach to
	// the portlet's DOM, which is different for each portlet instance and,
	// thus, cannot be determined until the page is rendered (during runtime).
	ngDoBootstrap() {}
}
