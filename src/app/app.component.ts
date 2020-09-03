import { Component, OnInit } from "@angular/core";
import { Http } from "@angular/http";
import { flatMap, map } from "rxjs/operators";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  name = "Angular";
  data: any;

  constructor(private http: Http) {}

  ngOnInit() {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("deviceReady"));
    }, 1000);
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
