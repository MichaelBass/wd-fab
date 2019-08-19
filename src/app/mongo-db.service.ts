import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { User } from './user';
import { ProxyUser } from './proxy_user';
import { Demographic } from './demographic';
import { Response } from './response';
import { Result } from './result';
import { Assessment } from './assessment';
import { Form } from './form';
import { Item } from './item';

import { Admin } from './admin';


import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/fromPromise';
import { from } from 'rxjs';


import { Stitch, UserApiKeyCredential } from 'mongodb-stitch-browser-sdk';
import { environment } from '../environments/environment';


@Injectable()
export class MongoDbService {

  API:String;

  stitch_application:string; 
  stitch_apiKey:string;
  client;

  constructor(private http: HttpClient, @Inject('Window') window: Window) {
    this.API = window.location.protocol + '//' +  window.location.hostname + ":3000";
    this.initializeAndLogin();
   }

  initializeAndLogin() {
  
    this.stitch_application = environment.stitch_application;
    this.stitch_apiKey = environment.stitch_apiKey;
    this.client = Stitch.initializeDefaultAppClient(this.stitch_application);

    this.client.auth.loginWithCredential(new UserApiKeyCredential(this.stitch_apiKey)).then(user => {
      //console.log("Logged in as Credential user with id" , user); 
    });

  }

  getForms() : Observable<Form[]>{
    return Observable.fromPromise( this.client.callFunction("getForms", []).then(result => {
    return result;}) );
  }

  loginAdmin(username:string, password:string): Observable<Admin[]> {
    return Observable.fromPromise( this.client.callFunction("loginAdmin", [encodeURI(username), encodeURI(password) ]).then(result => {
    return result;}) );
    //return this.http.post<Admin[]>(`${this.API}/login`, {username, password}).catch((err) =>{return Observable.throw(err)});
  }

  // log a person in the API
  loginPerson(study_code: string, password:string): Observable<User[]> {
    return Observable.fromPromise( this.client.callFunction("loginPerson", [encodeURI(study_code), encodeURI(password) ]).then(result => {
    return result;}) );
   // return this.http.get<User[]>(`${this.API}/users/` + encodeURI(study_code) + `/` + encodeURI(password)).catch((err) =>{return Observable.throw(err)});
  }

  // find a people in the API by sponsor-code
  searchProxyPerson(sponsor_code: string): Observable<ProxyUser[]> {  
    return Observable.fromPromise( this.client.callFunction("searchProxyUsers", [sponsor_code]).then(result => {
    return result;}) );
    //return this.http.get<ProxyUser[]>(`${this.API}/search_proxyusers/` + sponsor_code).catch((err) =>{return Observable.throw(err)});
  }

  // delete a person in the API
  deletePerson(user:User): Observable<any> {
    return Observable.fromPromise( this.client.callFunction("deleteUser", [user.oid, user.sponsor_code]).then(result => {
    return result;}) );
    //return this.http.delete<User>(`${this.API}/users/`+ _id).catch((err) =>{return Observable.throw(err)});
  }

  // update a person in the API
  updatePerson(oid: string, study_code: string, password:string, sponsor_code:string): Observable<User>{
    return Observable.fromPromise( this.client.callFunction("updateUser", [oid, study_code, password, sponsor_code]).then(result => {
    return result;}) );
    //return this.http.put<User>(`${this.API}/users/`+ _id, {oid, study_code, password}).catch((err) =>{return Observable.throw(err)});
  }

	// Add one person to the API
	addPerson(oid: string, study_code:string, password:string, sponsor_code:string): Observable<User> {
    return Observable.fromPromise( this.client.callFunction("saveUser", [oid, study_code, password, sponsor_code]).then(result => {
    return result;}) );
		//return this.http.post<User>(`${this.API}/users`, {oid, study_code, password, sponsor_code}).catch((err) =>{return Observable.throw(err)});
	}

  saveDemo(oid: string,sponsor_code:string, dem: Demographic): Observable<User> {
      return Observable.fromPromise( this.client.callFunction("saveDemo", [oid, sponsor_code, dem]).then(result => {
      return result;}) );
  }

  updateDemo(oid: string,sponsor_code:string, dem: Demographic): Observable<User> {
      return Observable.fromPromise( this.client.callFunction("updateDemo", [oid, sponsor_code, dem]).then(result => {
      return result;}) );
     //return this.http.put<User>(`${this.API}/demo/`+ _id, dem).catch((err) =>{return Observable.throw(err)});
  }

  loadForms(oid: string,sponsor_code:string,forms: Array<Form>): Observable<User> {
      return Observable.fromPromise( this.client.callFunction("loadForms", [oid, sponsor_code, forms]).then(result => {
      return result;}) );
    // return this.http.put<User>(`${this.API}/forms/`+ _id, forms).catch((err) =>{return Observable.throw(err)});
  }

  updateUserAssessment(user: User): Observable<User> {
    return Observable.fromPromise( this.client.callFunction("updateResponses", [user] ).then(result => {
    return result;}) );
    //return this.http.put<User>(`${this.API}/userAssessment/`+ _id, user).catch((err) =>{return Observable.throw(err)});
  }

  getUser(user: User): Observable<User> {
      return Observable.fromPromise( this.client.callFunction("getUser", [user.oid, user.sponsor_code]).then(result => {
      return result;}) );
  }

  findUser(oid:string, sponsor_code:string): Observable<User> {
      return Observable.fromPromise( this.client.callFunction("getUser", [oid, sponsor_code]).then(result => {
      return result;}) );
  }

  // Get all users from the API
  getAllProxyPeople(): Observable<ProxyUser[]> {
    return this.http.get<ProxyUser[]>(`${this.API}/proxyusers`).catch((err) =>{return Observable.throw(err)});
  }

	updateAssessments(user: User): Observable<User> {

    /*
      4 Cognition & Communication CC
      5 Resilience & Sociability  RS
      6 Self-Regulation SR
      7 Mood & Emotions ME

      0 Basic Mobility  BM
      1 Upper Body Function UBF
      2 Fine Motor Function FMF
      3 Community Mobility  CM
      8 Wheelchair  WC
    */
		
    var startDomain = Math.floor(Math.random() * Math.floor(2));
    // startDomain = 1; // Hard-code to start physical function 

    	var behavior : Array<Assessment> = [];
      behavior.push({"ID":4,"Domain":"Cognition & Communication","Active":false, "Started":null, "Finished":null});
      behavior.push({"ID":5,"Domain":"Resilience & Sociability","Active":false, "Started":null, "Finished":null});
      behavior.push({"ID":6,"Domain":"Self-Regulation","Active":false, "Started":null, "Finished":null});
      behavior.push({"ID":7,"Domain":"Mood & Emotions","Active":false, "Started":null, "Finished":null});     
      behavior = this.shuffle(behavior);

    	var phy : Array<Assessment> = [];  
      phy.push({"ID":0,"Domain":"Basic Mobility","Active":false, "Started":null, "Finished":null});
      phy.push({"ID":1,"Domain":"Upper Body Function","Active":false, "Started":null, "Finished":null});
      phy.push({"ID":2,"Domain":"Fine Motor Function","Active":false, "Started":null, "Finished":null});
      phy.push({"ID":3,"Domain":"Community Mobility","Active":false, "Started":null, "Finished":null});
      phy.push({"ID":8,"Domain":"Wheelchair","Active":false, "Started":null, "Finished":null});

    	if(user.demo.wc == 2){
    		// phy.splice(5,1);
        phy.splice(4,1);
    	}

    	if(user.demo.public_transportation == 0){
    		phy.splice(4,1);
    	}

    	if(user.demo.drive == 0){
    		phy.splice(3,1);
    	}

    	phy = this.shuffle(phy);


    	var assessments = [];

    	if( startDomain == 0 ){

    		for (var i = 0; i < behavior.length; i++) {
  				assessments.push(behavior[i]);
			   }
    		for (var i = 0; i < phy.length; i++) {
  				assessments.push(phy[i]);
			   }

    	}else{

    	   for (var i = 0;i < phy.length; i++) {
  				assessments.push(phy[i]);
			   }

    		for (var i = 0; i < behavior.length; i++) {
  				assessments.push(behavior[i]);
			  }

    	}

      return Observable.fromPromise( this.client.callFunction("updateAssessments", [user.oid, user.sponsor_code, assessments] ).then(result => {
      return result;}) );
		  //return this.http.put<User>(`${this.API}/assessments/`+ user._id, assessments).catch((err) =>{return Observable.throw(err)});
	}

  startAssessment(user: User): Observable<User> {
    return Observable.fromPromise( this.client.callFunction("updateAssessments", [user.oid, user.sponsor_code, user.assessments] ).then(result => {
    return result;}) );
    //return this.http.put<User>(`${this.API}/assessments/`+ _id, assessments).catch((err) =>{return Observable.throw(err)});
  }

	shuffle(array) {
		var currentIndex = array.length, temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {

  		// Pick a remaining element...
  		randomIndex = Math.floor(Math.random() * currentIndex);
  		currentIndex -= 1;

  		// And swap it with the current element.
  		temporaryValue = array[currentIndex];
  		array[currentIndex] = array[randomIndex];
  		array[randomIndex] = temporaryValue;
		}

		return array;
	}

  getResponses(oid: string,sponsor_code:string): Observable<Response[]> {
    return Observable.fromPromise( this.client.callFunction("getResponses", [oid, sponsor_code] ).then(result => {
    return result;}) );
    //return this.http.get<Response[]>(`${this.API}/responses/`+ _id).catch((err) =>{return Observable.throw(err)});
  }

}
