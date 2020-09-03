import { Injectable } from '@angular/core';
import {
  ConnectionBackend,
  ResponseOptions,
  XSRFStrategy,
  Request
} from '@angular/http';
import { CordovaHttpClient } from './cordova-http-client.service';
import { CordovaHttpConnection } from '../connections/cordova-http.connection';

@Injectable()
export class CordovaHttpBackend implements ConnectionBackend {
  constructor(
    private cordovaHttpClient: CordovaHttpClient,
    private baseResponseOptions: ResponseOptions,
    private xsrfStrategy: XSRFStrategy
  ) { }

  createConnection(request: Request): CordovaHttpConnection {
    this.xsrfStrategy.configureRequest(request);
    return new CordovaHttpConnection(
      request,
      this.cordovaHttpClient,
      this.baseResponseOptions
    );
  }
}
