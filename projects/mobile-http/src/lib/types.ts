export interface KeyValuePair<T> {
  [key: string]: T;
}

export interface CordovaHttpClientResponse {
  status: number;
  url: string;
  headers: KeyValuePair<string>;
}

export interface CordovaHttpClientSuccessResponse
  extends CordovaHttpClientResponse {
  data: string;
}

export interface CordovaHttpClientErrorResponse
  extends CordovaHttpClientResponse {
  error: string;
}

export class CordovaHttpClientOptions {
  method: string = 'GET';
  headers: KeyValuePair<string> = {};
  responseType: string = 'json';
  data: any;
}

export interface CordovaHttpPlugin {
  sendRequest(
    url: string,
    options: CordovaHttpClientOptions,
    sCb: (r: CordovaHttpClientSuccessResponse) => void,
    eCb: (r: CordovaHttpClientErrorResponse) => void
  ): void;
}

export interface CordovaPlugin {
  http: CordovaHttpPlugin;
}

export interface Cordova {
  plugin: CordovaPlugin;
}

export enum ContentType {
  NONE,
  JSON,
  FORM,
  FORM_DATA,
  TEXT,
  BLOB,
  ARRAY_BUFFER
}
