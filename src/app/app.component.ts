import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'mobile-http-client';

  data: any;

  constructor(private http: Http) {}

  ngOnInit() {
    this.http
      .get("https://reqres.in/api/users", {
        params: {
          delay: "3",
          cnt: "5"
        }
      })
      .pipe(
        map(resp => {
          return resp.json();
        })
      )
      .subscribe(
        data => (this.data = data),
        error => console.error("HANDLED:", error)
      );
  }
}
