import { Injectable } from '@angular/core';
import { Observable, Observer, fromEvent } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import {
  CordovaHttpClientOptions,
  CordovaHttpClientSuccessResponse,
  Cordova
} from '../types';

declare const cordova: Cordova;

@Injectable()
export class CordovaHttpClient {
  sendRequest(
    url: string,
    options: CordovaHttpClientOptions
  ): Observable<CordovaHttpClientSuccessResponse> {
    return fromEvent(document, 'deviceReady').pipe(
      flatMap(() => {
        return this.sendCordovaRequestAsObservable(url, options);
      })
    );
  }

  private sendCordovaRequestAsObservable(
    url: string,
    options: CordovaHttpClientOptions
  ): Observable<CordovaHttpClientSuccessResponse> {
    return Observable.create(
      (obs: Observer<CordovaHttpClientSuccessResponse>) => {
        cordova.plugin.http.sendRequest(
          url,
          options,
          response => {
            obs.next(response);
            obs.complete();
          },
          response => {
            obs.error(response);
          }
        );
      }
    );
  }
}
