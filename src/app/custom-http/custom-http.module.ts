import { NgModule, Injectable } from "@angular/core";
import {
  Http,
  RequestOptions,
  BaseRequestOptions,
  ResponseOptions,
  BaseResponseOptions,
  XSRFStrategy,
  CookieXSRFStrategy,
  ConnectionBackend,
  Connection,
  Request,
  Response,
  ReadyState,
  RequestMethod,
  Headers,
  ResponseType,
  ResponseContentType
} from "@angular/http";
import { Observable, Observer, fromEvent, throwError } from "rxjs";
import { map, flatMap, catchError } from "rxjs/operators";
// import { isSuccess } from "@angular/http/src/http_utils";
// import { ContentType } from "@angular/http/src/enums";

interface KeyValuePair<T> {
  [key: string]: T;
}

interface MobileHttpClientResponse {
  status: number;
  url: string;
  headers: KeyValuePair<string>;
}

interface MobileHttpClientSuccessResponse extends MobileHttpClientResponse {
  data: string;
}

interface MobileHttpClientErrorResponse extends MobileHttpClientResponse {
  error: string;
}

class MobileHttpClientOptions {
  method: string = "GET";
  headers: KeyValuePair<string> = {};
  responseType: string = "json";
  data: any;
}

interface HttpPlugin {
  sendRequest(
    url: string,
    options: MobileHttpClientOptions,
    sCb: (r: MobileHttpClientSuccessResponse) => void,
    eCb: (r: MobileHttpClientErrorResponse) => void
  ): void;
}

interface CordovaHttpPlugin extends HttpPlugin {}

interface CordovaPlugin {
  http: CordovaHttpPlugin;
}

interface Cordova {
  plugin: CordovaPlugin;
}

declare const cordova: Cordova;
const XSSI_PREFIX = /^\)\]\}',?\n/;

@Injectable()
export class MobileHttpClient {
  sendRequest(
    url: string,
    options: MobileHttpClientOptions
  ): Observable<MobileHttpClientSuccessResponse> {
    return fromEvent(window, "deviceReady").pipe(
      flatMap(() => {
        return this.sendCordovaRequestAsObservable(url, options);
      })
    );
  }

  private sendCordovaRequestAsObservable(
    url: string,
    options: MobileHttpClientOptions
  ): Observable<MobileHttpClientSuccessResponse> {
    return Observable.create(
      (obs: Observer<MobileHttpClientSuccessResponse>) => {
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

  private sendHttpRequestAsObservable(
    url: string,
    options: MobileHttpClientOptions
  ): Observable<any> {
    return Observable.create((obs: Observer<any>) => {
      obs.next({});
    });
  }
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

export const isSuccess = (status: number): boolean =>
  status >= 200 && status < 300;

export function getResponseURL(xhr: any): string | null {
  if ("responseURL" in xhr) {
    return xhr.responseURL;
  }
  if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
    return xhr.getResponseHeader("X-Request-URL");
  }
  return null;
}

export class MobileHttpConnection implements Connection {
  request: Request;
  response: Observable<Response>;
  // TODO(issue/24571): remove '!'.
  readyState!: ReadyState;

  constructor(
    req: Request,
    mobileHttpClient: MobileHttpClient,
    baseResponseOptions?: ResponseOptions
  ) {
    this.request = req;

    const options = new MobileHttpClientOptions();
    const url = req.url;
    options.method = RequestMethod[req.method].toUpperCase();

    // if (req.withCredentials != null) {
    //   _xhr.withCredentials = req.withCredentials;
    // }

    this.setDetectedContentType(req, options.headers);

    if (req.headers == null) {
      req.headers = new Headers();
    }
    if (!req.headers.has("Accept")) {
      req.headers.append("Accept", "application/json, text/plain, */*");
    }
    req.headers.forEach(
      (values, name) => (options.headers[name!] = values.join(","))
    );

    // Select the correct buffer type to store the response
    if (req.responseType != null && options.responseType != null) {
      switch (req.responseType) {
        case ResponseContentType.ArrayBuffer:
          options.responseType = "arraybuffer";
          break;

        case ResponseContentType.Json:
          options.responseType = "json";
          break;

        case ResponseContentType.Text:
          options.responseType = "text";
          break;

        case ResponseContentType.Blob:
          options.responseType = "blob";
          break;

        default:
          throw new Error("The selected responseType is not supported");
      }
    }

    options.data = this.request.getBody();
    this.response = mobileHttpClient.sendRequest(url, options).pipe(
      catchError((resp: MobileHttpClientErrorResponse) => {
        let responseOptions = new ResponseOptions({
          body: resp.error,
          type: ResponseType.Error,
          status: resp.status,
          statusText: "Error"
        });
        if (baseResponseOptions != null) {
          responseOptions = baseResponseOptions.merge(responseOptions);
        }
        return throwError(new Response(responseOptions));
      }),
      map(resp => {
        // normalize IE9 bug (http://bugs.jquery.com/ticket/1450)
        let status: number = resp.status === 1223 ? 204 : resp.status;

        let body: any = null;

        // HTTP 204 means no content
        if (status !== 204) {
          // responseText is the old-school way of retrieving response (supported by IE8 & 9)
          // response/responseType properties were introduced in ResourceLoader Level2 spec
          // (supported by IE10)
          body = resp.data;

          // Implicitly strip a potential XSSI prefix.
          if (typeof body === "string") {
            body = body.replace(XSSI_PREFIX, "");
          }
        }

        // fix status code when it is 0 (0 status is undocumented).
        // Occurs when accessing file resources or on Android 4.1 stock browser
        // while retrieving files from application cache.
        if (status === 0) {
          status = body ? 200 : 0;
        }

        const headers: Headers = new Headers(resp.headers);
        // IE 9 does not provide the way to get URL of response
        const url = resp.url || req.url;
        const statusText: string = "OK";

        let responseOptions = new ResponseOptions({
          body,
          status,
          headers,
          statusText,
          url
        });
        if (baseResponseOptions != null) {
          responseOptions = baseResponseOptions.merge(responseOptions);
        }
        const response = new Response(responseOptions);
        response.ok = isSuccess(status);
        if (response.ok) {
          return response;
        }

        throw response;
      })
    );
  }

  setDetectedContentType(
    req: any /** TODO Request */,
    headers: any /** XMLHttpRequest */
  ) {
    // Skip if a custom Content-Type header is provided
    if (req.headers != null && req.headers.get("Content-Type") != null) {
      return;
    }

    // Set the detected content type
    switch (req.contentType) {
      case ContentType.NONE:
        break;

      case ContentType.JSON:
        headers["content-type"] = "application/json";
        break;

      case ContentType.FORM:
        headers["content-type"] =
          "application/x-www-form-urlencoded;charset=UTF-8";
        break;

      case ContentType.TEXT:
        headers["content-type"] = "text/plain";
        break;

      case ContentType.BLOB:
        const blob = req.blob();
        if (blob.type) {
          headers["content-type"] = blob.type;
        }
        break;
    }
  }
}

@Injectable()
export class MobileHttpBackend implements ConnectionBackend {
  constructor(
    private mobileHttpClient: MobileHttpClient,
    private _baseResponseOptions: ResponseOptions,
    private _xsrfStrategy: XSRFStrategy
  ) {}

  createConnection(request: Request): MobileHttpConnection {
    this._xsrfStrategy.configureRequest(request);
    return new MobileHttpConnection(
      request,
      this.mobileHttpClient,
      this._baseResponseOptions
    );
  }
}

export function _createDefaultCookieXSRFStrategy() {
  return new CookieXSRFStrategy();
}

export function httpFactory(
  mobileBackend: MobileHttpBackend,
  requestOptions: RequestOptions
): Http {
  return new Http(mobileBackend, requestOptions);
}

@NgModule({
  providers: [
    {
      provide: Http,
      useFactory: httpFactory,
      deps: [MobileHttpBackend, RequestOptions]
    },
    MobileHttpClient,
    { provide: RequestOptions, useClass: BaseRequestOptions },
    { provide: ResponseOptions, useClass: BaseResponseOptions },
    MobileHttpBackend,
    { provide: XSRFStrategy, useFactory: _createDefaultCookieXSRFStrategy }
  ]
})
export class CustomHttpModule {}
