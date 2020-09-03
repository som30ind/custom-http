import { NgModule } from '@angular/core';
import {
  Http,
  CookieXSRFStrategy,
  RequestOptions,
  XHRBackend,
  BrowserXhr,
  BaseRequestOptions,
  ResponseOptions,
  BaseResponseOptions,
  XSRFStrategy
} from '@angular/http';
import { CordovaHttpClient } from './services/cordova-http-client.service';
import { CordovaHttpBackend } from './services/cordova-http-backend.service';

declare const isMobile: boolean;

export function createDefaultCookieXSRFStrategy() {
  return new CookieXSRFStrategy();
}

export function httpFactory(
  cordovaBackend: CordovaHttpBackend,
  requestOptions: RequestOptions,
  xhrBackend: XHRBackend
): Http {
  if (isMobile) {
    return new Http(cordovaBackend, requestOptions);
  }
  return new Http(xhrBackend, requestOptions);
}

@NgModule({
  providers: [
    {
      provide: Http,
      useFactory: httpFactory,
      deps: [CordovaHttpBackend, RequestOptions, XHRBackend]
    },
    CordovaHttpClient,
    BrowserXhr,
    { provide: RequestOptions, useClass: BaseRequestOptions },
    { provide: ResponseOptions, useClass: BaseResponseOptions },
    CordovaHttpBackend,
    XHRBackend,
    { provide: XSRFStrategy, useFactory: createDefaultCookieXSRFStrategy }
  ]
})
export class MobileHttpModule { }
