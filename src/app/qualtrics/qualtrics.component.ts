import { Component, OnInit, Inject } from '@angular/core';
import { MongoDbService } from '../mongo-db.service';
import { User } from '../user';

import { KVObject } from '../kvobject';

import {ActivatedRoute, ParamMap} from "@angular/router";
import {Router} from "@angular/router";

import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';
import * as CounterActions from '../counter.actions';

@Component({
  selector: 'app-qualtrics',
  templateUrl: './qualtrics.component.html',
  styleUrls: ['../app.component.css','./qualtrics.component.css']
})
export class QualtricsComponent implements OnInit {

  user: User;

  _id: string;
  study_code: string;
  password: string;
  nextPage: string;
  message: string;
  _params: Array<KVObject> = [];

  constructor(@Inject(AppStore) private store: Store<AppState>, private mongodbService: MongoDbService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {

    this.message = "You will be directed to your survey shortly. Please refresh your browser if you are not redirected";
    
    this.route.queryParamMap.subscribe(
      (params: ParamMap) => {


        if( params.get('P') != null ){
            let objP = new KVObject();
            objP.key = "P";
            objP.value = params.get('P');
            this._params.push(objP);
        }

        if( params.get('VID') != null ){
            let objVID = new KVObject();
            objVID.key = "VID";
            objVID.value = params.get('VID');
            this._params.push(objVID);
        }

        if( params.get('ID1') != null ){
            let objID1 = new KVObject();
            objID1.key = "ID1";
            objID1.value = params.get('ID1');
            this._params.push(objID1);
        }

        if( params.get('ID2') != null ){
            let objID2 = new KVObject();
            objID2.key = "ID2";
            objID2.value = params.get('ID2');
            this._params.push(objID2);
        }

        if( params.get('ID3') != null ){
            let objID3 = new KVObject();
            objID3.key = "ID3";
            objID3.value = params.get('ID3');
            this._params.push(objID3);
        }

        if( params.get('Q1') != null ){
            let objQ1 = new KVObject();
            objQ1.key = "Q1";
            objQ1.value = params.get('Q1');
            this._params.push(objQ1);
        }
        /*
        if( params.get('Q2') != null ){
            let objQ2 = new KVObject();
            objQ2.key = "Q2";
            objQ2.value = params.get('Q2');
            this._params.push(objQ2);
        }
        */
        if( params.get('PWID') != null ){

            // let combinedID = params.get('PWID').split('-');

            // this.study_code = combinedID[0];
            // this.password = combinedID[1];

            this.study_code = params.get('PWID');
            this.password = params.get('PWID');

            //2020-12-4  added login on the fly setting OID and study code to first param of PWID.
            //this.mongodbService.addPerson(combinedID[0], combinedID[0], combinedID[1], "Group 1").subscribe(
            this.mongodbService.addPerson(params.get('PWID'), params.get('PWID'), params.get('PWID'), "Q2304").subscribe(
            data => { 
                this.mongodbService.addUserParams(this.study_code,this.password, this._params).subscribe(
                  fields => {
                    this.addUser();
                }, err => {console.log("Error updating person with parameters");});
            }, err => {console.log("Error adding person to system");});  
        }
    });
  }

  addUser() {

  this.mongodbService.loginPerson(this.study_code, this.password).subscribe(  
    fields => {
    
        if(fields.length == 1){

          this.user = fields[0];
          this.user.params = this._params;
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

