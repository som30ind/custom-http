import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { flatMap, map } from 'rxjs/operators';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit  {
  name = 'Angular';
  data: any;

  constructor(
    private http: Http
  ) { }

  ngOnInit() {
    this.http.get('https://reqres.in/api/users?page=2')
      .pipe(
        map(resp => {
          console.log(resp.json());
          return resp.json();
        })
      )
      .subscribe(data => this.data = data);
  }
}
