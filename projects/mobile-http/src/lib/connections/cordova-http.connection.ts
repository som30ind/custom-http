import {
  Connection,
  Request,
  Response,
  ResponseOptions,
  ResponseType,
  Headers,
  ReadyState,
  RequestMethod,
  ResponseContentType
} from '@angular/http';
import { Observable, throwError, Observer } from 'rxjs';
import { flatMap, catchError, map } from 'rxjs/operators';
import { CordovaHttpClient } from '../services/cordova-http-client.service';
import {
  CordovaHttpClientErrorResponse,
  CordovaHttpClientOptions,
  KeyValuePair,
  ContentType
} from '../types';
import { isSuccess } from '../utils';

const XSSI_PREFIX = /^\)\]\}',?\n/;

export class CordovaHttpConnection implements Connection {
  request: Request;
  response: Observable<Response>;
  // TODO(issue/24571): remove '!'.
  readyState!: ReadyState;

  constructor(
    req: Request,
    cordovaHttpClient: CordovaHttpClient,
    baseResponseOptions?: ResponseOptions
  ) {
    this.request = req;
    const url = req.url;

    this.response = this.prepareOptions(req).pipe(
      flatMap(options => cordovaHttpClient.sendRequest(url, options)),
      catchError((resp: CordovaHttpClientErrorResponse) => {
        let responseOptions = new ResponseOptions({
          body: resp.error,
          type: ResponseType.Error,
          status: resp.status | 0,
          statusText: 'Error'
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
          if (typeof body === 'string') {
            body = body.replace(XSSI_PREFIX, '');
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
        const statusText: string = 'OK';

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

  private prepareOptions(req: Request): Observable<CordovaHttpClientOptions> {
    return Observable.create((obs: Observer<CordovaHttpClientOptions>) => {
      const options = new CordovaHttpClientOptions();
      options.method = RequestMethod[req.method].toUpperCase();

      // if (req.withCredentials != null) {
      //   _xhr.withCredentials = req.withCredentials;
      // }

      this.setDetectedContentType(req, options.headers);

      if (req.headers == null) {
        req.headers = new Headers();
      }
      if (!req.headers.has('Accept')) {
        req.headers.append('Accept', 'application/json, text/plain, */*');
      }
      req.headers.forEach(
        (values, name) => (options.headers[name!] = values.join(','))
      );

      // Select the correct buffer type to store the response
      if (req.responseType != null && options.responseType != null) {
        switch (req.responseType) {
          case ResponseContentType.ArrayBuffer:
            options.responseType = 'arraybuffer';
            break;

          case ResponseContentType.Json:
            options.responseType = 'json';
            break;

          case ResponseContentType.Text:
            options.responseType = 'text';
            break;

          case ResponseContentType.Blob:
            options.responseType = 'blob';
            break;

          default:
            throw new Error('The selected responseType is not supported');
        }
      }

      options.data = this.request.getBody();

      obs.next(options);
      obs.complete();
    });
  }

  setDetectedContentType(req: any, headers: KeyValuePair<string>) {
    // Skip if a custom Content-Type header is provided
    if (req.headers != null && req.headers.get('Content-Type') != null) {
      return;
    }

    // Set the detected content type
    switch (req.contentType) {
      case ContentType.NONE:
        break;

      case ContentType.JSON:
        headers['content-type'] = 'application/json';
        break;

      case ContentType.FORM:
        headers['content-type'] =
          'application/x-www-form-urlencoded;charset=UTF-8';
        break;

      case ContentType.TEXT:
        headers['content-type'] = 'text/plain';
        break;

      case ContentType.BLOB:
        const blob = req.blob();
        if (blob.type) {
          headers['content-type'] = blob.type;
        }
        break;
    }
  }
}
