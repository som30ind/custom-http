import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MobileHttpModule } from '@som30ind/mobile-http';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MobileHttpModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
