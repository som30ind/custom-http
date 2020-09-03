import { NgModule, Injectable } from "@angular/core";
import {
  ConnectionBackend,
  XSRFStrategy,
  ResponseOptions,
  Request,
  CookieXSRFStrategy,
  XHRBackend,
  RequestOptions,
  Http,
  BrowserXhr,
  BaseRequestOptions,
  BaseResponseOptions
} from "@angular/http";
import { CordovaHttpConnection } from "./cordova-http.connection";
import { CordovaHttpClientOptions } from "./types";
import { CordovaHttpClient } from "./cordova-http-client.service";
import { CordovaHttpBackend } from "./cordova-http-backend.service";

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
    CordovaHttpClientOptions,
    BrowserXhr,
    { provide: RequestOptions, useClass: BaseRequestOptions },
    { provide: ResponseOptions, useClass: BaseResponseOptions },
    CordovaHttpBackend,
    XHRBackend,
    { provide: XSRFStrategy, useFactory: createDefaultCookieXSRFStrategy }
  ]
})
export class CustomHttpModule {}
