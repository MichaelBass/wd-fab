import { Component, OnInit, Inject } from '@angular/core';
import { MongoDbService } from '../mongo-db.service';
import { User } from '../user';

import {ActivatedRoute} from "@angular/router";
import {Router} from "@angular/router";

import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';
import * as CounterActions from '../counter.actions';

@Component({
  selector: 'app-portal',
  templateUrl: './portal.component.html',
  styleUrls: ['../app.component.css','./portal.component.css']
})
export class PortalComponent implements OnInit {

  user: User;

  _id: string;
  study_code: string;
  sponsor_code: string;
  message: string;

  constructor(@Inject(AppStore) private store: Store<AppState>, private mongodbService: MongoDbService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.message = params['message'];
    });
  }
 
  addUser() {

  this.mongodbService.loginPerson(this.study_code, this.sponsor_code).subscribe(  
    fields => {

        if(fields.length == 1){

          this.user = fields[0];
          this.store.dispatch(CounterActions.create_user(this.user));
          if(this.user.oid != "0"){
            this.router.navigate(['/demographics']); 
          } else {
            this.store.dispatch(CounterActions.clear_state());
            this.message = 'Invalid credentials.';          
          }
        } else{
          this.store.dispatch(CounterActions.clear_state());
          this.message = 'Invalid credentials.';
        }
    }
    );

  }

}
