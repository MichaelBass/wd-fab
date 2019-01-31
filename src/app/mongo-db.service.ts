import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

import { User } from './user';
import { Demographic } from './demographic';
import { Response } from './response';
import { Result } from './result';
import { Assessment } from './assessment';
import { Form } from './form';
import { Item } from './item';

import { Admin } from './admin';

// Import rxjs map operator
import 'rxjs/add/operator/map';

import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class MongoDbService {

  API:String;

  constructor(private http: HttpClient, @Inject('Window') window: Window) {
    this.API = window.location.protocol + '//' +  window.location.hostname + ":3000";
    //console.log(this.API);
   }

  loginAdmin(username:string, password:string): Observable<Admin[]> {
    return this.http.post<Admin[]>(`${this.API}/login`, {username, password}).catch((err) =>{return Observable.throw(err)});
  }


	// Add one person to the API
	addPerson(oid: string, study_code:string, password:string, sponsor_code:string): Observable<User> {
		return this.http.post<User>(`${this.API}/users`, {oid, study_code, password, sponsor_code}).catch((err) =>{return Observable.throw(err)});
	}

	// Get all users from the API
	getAllPeople(): Observable<User[]> {
		return this.http.get<User[]>(`${this.API}/users`).catch((err) =>{return Observable.throw(err)});
	}

  // find a people in the API
  findPerson(id: string): Observable<User> {
    return this.http.get<User>(`${this.API}/search_users/` + id).catch((err) =>{return Observable.throw(err)});
  }

	// find a people in the API by sponsor-code
	searchPerson(sponsor_code: string): Observable<User[]> {
		return this.http.get<User[]>(`${this.API}/search_users/` + sponsor_code).catch((err) =>{return Observable.throw(err)});
	}

  // log a person in the API
  loginPerson(study_code: string, password:string): Observable<User[]> {
    return this.http.get<User[]>(`${this.API}/users/` + encodeURI(study_code) + `/` + encodeURI(password)).catch((err) =>{return Observable.throw(err)});
  }

	// update a person in the API
	updatePerson(_id: String, oid: String, study_code: String, password:String): Observable<User>{
		return this.http.put<User>(`${this.API}/users/`+ _id, {oid, study_code, password}).catch((err) =>{return Observable.throw(err)});
	}

	// delete a person in the API
	deletePerson(_id): Observable<any> {
		return this.http.delete<User>(`${this.API}/users/`+ _id).catch((err) =>{return Observable.throw(err)});
	}

	updateDemo(_id: String, dem: Demographic): Observable<User> {
      return this.http.put<User>(`${this.API}/demo/`+ _id, dem).catch((err) =>{return Observable.throw(err)});
	}

  loadForms(_id: String, forms: Array<Form>): Observable<User> {
    return this.http.put<User>(`${this.API}/forms/`+ _id, forms).catch((err) =>{return Observable.throw(err)});
  }

	updateAssessments(user: User): Observable<User> {
		
		
    var startDomain = Math.floor(Math.random() * Math.floor(2));
    // startDomain = 1; // Hard-code to start physical function 

    	var behavior : Array<Assessment> = [];
    	behavior.push({"ID":0,"Domain":"Cognition and Communication","Active":false, "Started":null, "Finished":null});
      behavior.push({"ID":1,"Domain":"Resilience/Sociability","Active":false, "Started":null, "Finished":null});
      behavior.push({"ID":2,"Domain":"Self-Regulation","Active":false, "Started":null, "Finished":null});
      behavior.push({"ID":3,"Domain":"Mood and Emotions","Active":false, "Started":null, "Finished":null});     

      behavior = this.shuffle(behavior);

    	var phy : Array<Assessment> = [];
    	phy.push({"ID":4,"Domain":"Basic Mobility","Active":false, "Started":null, "Finished":null});
    	phy.push({"ID":5,"Domain":"Upper Body Function","Active":false, "Started":null, "Finished":null});
    	phy.push({"ID":6,"Domain":"Fine Motor Function","Active":false, "Started":null, "Finished":null});
    	phy.push({"ID":7,"Domain":"Community Mobility (Driving)","Active":false, "Started":null, "Finished":null});
    	phy.push({"ID":8,"Domain":"Community Mobility (Public Transportation)","Active":false, "Started":null, "Finished":null});
    	phy.push({"ID":9,"Domain":"Wheelchair","Active":false, "Started":null, "Finished":null});



    	if(user.demo.wc == 2){
    		phy.splice(5,1);
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

		return this.http.put<User>(`${this.API}/assessments/`+ user._id, assessments).catch((err) =>{return Observable.throw(err)});
	}

  startAssessment(_id: String, assessments: Array<Assessment>): Observable<User> {
    
    return this.http.put<User>(`${this.API}/assessments/`+ _id, assessments).catch((err) =>{return Observable.throw(err)});
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

  addResponse(_id: String, response: Response): Observable<any> {
    return this.http.put<User>(`${this.API}/responses/`+ _id, response).catch((err) =>{return Observable.throw(err)});
  }

  getResponses(_id: String): Observable<Response[]> {
    return this.http.get<Response[]>(`${this.API}/responses/`+ _id).catch((err) =>{return Observable.throw(err)});
  }

  addResult(_id: String, result: Result): Observable<any> {
    return this.http.put<User>(`${this.API}/results/`+ _id, result).catch((err) =>{return Observable.throw(err)});
  }

  
}
