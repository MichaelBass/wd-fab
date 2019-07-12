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
  password: string;
  message: string;
  nextPage: string;

  constructor(@Inject(AppStore) private store: Store<AppState>, private mongodbService: MongoDbService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.message = params['message'];
    });
  }

  onKeydown(event) {
    if (event.key === "Enter") {
      this.addUser();
    }
  }
  
  addUser() {

  this.mongodbService.loginPerson(this.study_code, this.password).subscribe(  
    fields => {

        if(fields.length == 1){

          this.user = fields[0];
          this.store.dispatch(CounterActions.create_user(this.user));
          if(this.user.oid != "0"){

            if(this.verifyAssessments()){
              this.router.navigate([this.nextPage]);
            }

          } else {
            this.store.dispatch(CounterActions.clear_state());
            this.message = 'Invalid credentials.';          
          }
        } else{
          this.store.dispatch(CounterActions.clear_state());
          this.message = 'Invalid credentials.';
        }
    }, err => {console.log("Error logging in person");}
    );

}

verifyAssessments():boolean{
  

    if(this.user.assessments.length == 0){
      this.message = 'new User.';
      this.nextPage = '/demographics';
      return true;
    }

    let assessment = this.user.assessments.filter((a) => a.Active === true); // array of current assessment
    if(assessment.length > 0){
      this.message = 'returning user starting';
      this.nextPage = '/assessment';
      return true;
    } 

    let assessment2 = this.user.assessments.filter( (a) => (a.Finished == null && a.Started == null) ); // array of current assessment
    if(assessment2.length > 0){


      assessment2[0].Active = true;
      this.store.dispatch(CounterActions.create_user(this.user));

      this.message = 'returning user not started yet.';
      //this.nextPage = '/intro';
      this.nextPage = '/assessment';
      return true;
    } 

    if(assessment2.length == 0){
      this.message = 'You have already finished your scheduled assessment.';
      return false;
    } 

      this.message = 'Error returning your assessment. Please contact the administrator';
      return false;


}  

}
