# Mobile HTTP Module for Angular
This module will help to switch between `Cordova` & `XHR`. For now this module is created to work with `@angular/http`.

[![Build Status](https://travis-ci.org/som30ind/mobile-http.svg?branch=master)](https://travis-ci.org/som30ind/mobile-http)

## Usage
Below variable need to switch to `true` / `false` to toggle use between `Cordova` & `XHR` usage.

### Installation
`npm install @som30ind/mobile-http`

### To switch to use Browser XHR
```javascript
var isMobile = false;
```

### To switch to use Cordova HTTP
```javascript
var isMobile = true;
```

### Angular Integration
Just use `MobileHttpModule` in your module files. Rest of the application (Components / Services) will continue using `Http` from `@angular/http`.
```typescript
import { MobileHttpModule } from '@som30ind/mobile-http';

@NgModule({
  imports: [BrowserModule, MobileHttpModule],
  declarations: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule {}
```
## Browser support
This plugin supports a very restricted set of functions on the browser platform. It's meant for testing purposes, not for production grade usage.

Following features are not supported with Cordova as `cordova-plugin-advanced-http` does not support it:

* Manipulating Cookies
* Uploading and Downloading files
* Pinning SSL certificate
* Disabling SSL certificate check
* Disabling transparently following redirects (HTTP codes 3xx)
* Circumventing CORS restrictions

## Libraries
This plugin utilizes some awesome open source libraries:

 - [Cordova Advanced HTTP](https://github.com/silkimen/cordova-plugin-advanced-http) (MIT licensed)
 - [Angular](https://v7.angular.io/) (MIT licensed)

For Cordova interaction,

## [License](LICENSE.md)
Copyright (c) 2020 Somnath Sinha
