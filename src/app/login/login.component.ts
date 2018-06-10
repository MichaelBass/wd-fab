import { Component, OnInit, Inject} from '@angular/core';
import { MongoDbService } from '../mongo-db.service';
import { Admin } from '../admin';
import {ActivatedRoute} from "@angular/router";
import {Router} from "@angular/router";

import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';
import * as CounterActions from '../counter.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  admin: Admin;

  _id: string;
  username: string;
  password: string;
  message: string;

  constructor(@Inject(AppStore) private store: Store<AppState>, private mongodbService: MongoDbService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
      this.route.params.subscribe(params => {
      this.message = params['message'];
    });
  }


  login() {

    var fields = this.mongodbService.loginAdmin(this.username, this.password);

    if(fields.length == 1){

      this.admin = fields[0];
      this.store.dispatch(CounterActions.create_admin(this.admin));
      if(this.admin._id != "0"){
        this.router.navigate(['/dashboard']); 
      } else {
        this.store.dispatch(CounterActions.clear_state());
        this.message = 'Invalid credentials.';          
      }
    } else{
      this.store.dispatch(CounterActions.clear_state());
      this.message = 'Invalid credentials.';
    }


  }
}
