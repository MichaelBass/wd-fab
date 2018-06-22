import { Component, OnInit, Inject } from '@angular/core';
import { MongoDbService } from '../mongo-db.service';
import { User } from '../user';
import { Admin } from '../admin';

import {ActivatedRoute} from "@angular/router";
import {Router} from "@angular/router";

import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';
import * as CounterActions from '../counter.actions';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  constructor(@Inject(AppStore) private store: Store<AppState>, private mongodbService: MongoDbService, private route: ActivatedRoute, private router: Router) {} 

	people:User[];
  person:User;

  admin: Admin;
  _id:string;
  oid:string;
  study_code:String;
  sponsor_code:String;
  message:String;

  ngOnInit() {


    this.admin = this.store.getState().admin;
    if(this.admin._id == "0"){
       this.router.navigate(['/login','Please login first']);
    }

    this.route.params.subscribe(params => {
      this.message = params['message'];
    });
		this.getUsers();
  }

  getUsers(){
    this.mongodbService.getAllPeople().subscribe(  
        fields => {
        this.message = "returning " + fields.length + " users.";
        this.people = fields; 
      }, err => {console.log("Error getting all people");}
    );
  }

  findUser() {
    this.mongodbService.findPerson(this._id).subscribe(  
        fields => {
        //console.log(fields); 
      }, err => {console.log("Error finding Person");}
    );  
  }

  updateUser(person:User) {
    this.mongodbService.updatePerson(person._id, person.oid, person.study_code, person.sponsor_code).subscribe(
      fields => {
        //console.log(fields);
        this.getUsers(); 
      }, err => {console.log("Error getting all people");}
    )
  }

  deleteUser(user_id:string) {
    this.mongodbService.deletePerson(user_id).subscribe(
      fields => {
        //console.log(fields);
        this.message = fields.message;
        this.getUsers(); 
      }, err => {console.log("Error deleting person");}
    )  
  }


  csvObject(obj:any): string{

    var data_export='';
    var header = false;

    for (let key of Object.keys(obj)) {  
      
      
      let _data = obj[key];

      if (typeof _data == 'object'){

        if(!header){
          Object.keys(_data).forEach(
            key => data_export = data_export + "\"" + key + "\"" + "\t"
          );
          header = true;
          data_export = data_export.slice(0, -1);
          data_export = data_export + "\n";
        }
        for (let key2 of Object.keys(_data)) {
          data_export = data_export +  "\"" + _data[key2] +  "\"" + "\t";
        }
        data_export = data_export.slice(0, -1);
        data_export = data_export + "\n";
      }
    } 

    return data_export;

  }

  csvObject2(obj:any): string{

    var data_export='';

    for (let key of Object.keys(obj)) {  
      data_export = data_export + "\"" + key + "\"" + "\t";
    } 
    data_export = data_export.slice(0, -1);
    data_export = data_export + "\n";



    for (let key of Object.keys(obj) ) {  
      data_export = data_export + "\"" + obj[key] + "\"" + "\t";
    } 
    data_export = data_export.slice(0, -1);
    data_export = data_export + "\n";



    return data_export;

  }


  exportData(user:User) {

    var data_export="\n";
    data_export = data_export + this.csvObject2(user.demo);
    data_export=data_export + "\n";
    data_export=data_export + "\n";
    data_export = data_export + this.csvObject(user.assessments);
    data_export=data_export + "\n";
    data_export=data_export + "\n";
    data_export = data_export + this.csvObject(user.results);

    //https://www.oodlestechnologies.com/blogs/Create-CSV-file-in-Angular2
    let blob = new Blob(['\ufeff' + data_export], { type: 'text/csv;charset=utf-8;' });

    let dwldLink = document.createElement("a");
    let url = URL.createObjectURL(blob);
    let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
    if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
        dwldLink.setAttribute("target", "_blank");
    }
      
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", "Enterprise.csv");
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
    
  }

  addUser() {
    this.mongodbService.addPerson(this.oid, this.study_code, this.sponsor_code).subscribe(
      fields => {
        console.log(fields);
        this.getUsers(); 
        this.oid ='';
        this.study_code='';
        this.sponsor_code='';
        this.message = fields.message;
      }, err => {console.log("Error adding person");}
    )  
  }

  gotoLogin(){
    this.router.navigate(['/portal','Login to begin assessment']);
  }

  selectUser(user_id:string) {

    this.mongodbService.findPerson(user_id).subscribe(  
      fields => {
        this.person = new User(); 
        this.person.oid = fields.oid;
        this.person._id = fields._id;
        this.person.__v = fields.__v;
        this.person.study_code = fields.study_code;
        this.person.sponsor_code = fields.sponsor_code;
        this.person.demo = fields.demo;

        this.store.dispatch(CounterActions.create_user(this.person));
        this.router.navigate(['/assessment']);
      } , err => {console.log("Error finding person");}
    );
  }

}
