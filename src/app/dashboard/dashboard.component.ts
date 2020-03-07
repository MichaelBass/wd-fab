import { Component, OnInit, Inject } from '@angular/core';
import { MongoDbService } from '../mongo-db.service';
import { User } from '../user';
import { ProxyUser } from '../proxy_user';
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

	people:ProxyUser[];
  person:User;

  admin: Admin;
  _id:string;
  oid:string;
  study_code:string;
  password:string;
  sponsor_code:string;
  message:string;

  ngOnInit() {


    this.admin = this.store.getState().admin;
    if(this.admin._id == "0"){
       this.router.navigate(['/login','Please login first']);
    } else {
      this.searchProxyUsers();
    }

    this.route.params.subscribe(params => {
      this.message = params['message'];
    });
		//this.getUsers();
    
  }
/*
  getUsers(){
    this.mongodbService.getAllPeople().subscribe(  
        fields => {
        this.message = "returning " + fields.length + " users.";
        this.people = fields; 
      }, err => {console.log("Error getting all people");}
    );
  }
*/

  searchProxyUsers(){
    this.mongodbService.searchProxyPerson(this.admin.sponsor_code).subscribe(  
        fields => {
        this.message = "returning " + fields.length + " users.";
        this.people = fields; 
      }, err => {console.log("Error getting all people");}
    );
  }
/*
  searchUsers(){
    this.mongodbService.searchPerson(this.admin.sponsor_code).subscribe(  
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
        this.person = fields; 
      }, err => {console.log("Error finding Person");}
    );  
  }
*/
  updateUser(person:ProxyUser) {

    if(person.oid== "0"){
      this.message = 'oid can not be 0.';
      return;
    }

    this.mongodbService.loginPerson(person.study_code, person.password).subscribe(  
      fields => {
        if(fields.length == 1){
            this.message = 'User name/password must be unique system-wide.'; 
        }else{
          this.mongodbService.updatePerson(person.oid, person.study_code, person.password, person.sponsor_code).subscribe(
            data => {
              //this.searchUsers(); 
              this.searchProxyUsers();
            }, err => {console.log("Error getting all people");}
          )
        }

      }, err => {console.log("Error updating a person");}
    );

  }

  deleteUser(user:User) {
    this.mongodbService.deletePerson(user).subscribe(
      fields => {
        //console.log(fields);
        this.message = fields.message;
        //this.getUsers(); 
        this.searchProxyUsers();
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
            //key => data_export = data_export + "\"" + key + "\"" + "\t"
            key => data_export = data_export + "\"" + key + "\"" + ","
          );
          header = true;
          data_export = data_export.slice(0, -1);
          data_export = data_export + "\n";
        }
        for (let key2 of Object.keys(_data)) {
          //data_export = data_export +  "\"" + _data[key2] +  "\"" + "\t";


          if(key2 == "Started" || key2 == "Finished"){
            data_export = data_export +  "\"" + new Date(_data[key2]) +  "\"" + ",";
          }else{
            data_export = data_export +  "\"" + _data[key2] +  "\"" + ",";
          }
          


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
      //data_export = data_export + "\"" + key + "\"" + "\t";
      data_export = data_export + "\"" + key + "\"" + ",";
    } 
    data_export = data_export.slice(0, -1);
    data_export = data_export + "\n";



    for (let key of Object.keys(obj) ) {  
      //data_export = data_export + "\"" + obj[key] + "\"" + "\t";
      data_export = data_export + "\"" + obj[key] + "\"" + ",";
    } 
    data_export = data_export.slice(0, -1);
    data_export = data_export + "\n";



    return data_export;

  }

 exportSummaryData(user: User) {

    this.mongodbService.getUser(user).subscribe(  
      fields => {
        var user = fields;
  
       //var data_export = " \"" + "Scale" + " \" \t \""  + "Administration Time"  + " \" \t \""  + "Number of Items"  + " \" \t \"" + "Score"  + " \" \t \""  + "Standard Error"  + " \" \n";
       //var data_export = "Scale" + "\t"  + "Administration Time"  + "\t"  + "Number of Items"  + "\t" + "Score"  + "\t"  + "Standard Error"  + "\n";
       
        var data_export = "Scale" + ","  + "Administration Time"  + ","  + "Number of Items"  + "," + "Score"  + ","  + "Standard Error" + "," + "Normed Score"  + ","  + "Normed SE"  + "\n";
       
        for (let assessment of user.assessments) {

          let start:any = new Date(assessment.Started);
          let end:any = new Date(assessment.Finished);
          var time = Math.round((end - start)/1000);

          let time_display:string = "N/A"
          if(time != 0){
            time_display = time.toString();
          }

          let filtered_results = user.results.filter((a) => a.oid === assessment.Domain);
          let _result = filtered_results[filtered_results.length -1];
          let score = "N/A";
          let se = "N/A";
          let normed_score = "N/A";
          let normed_se = "N/A";
          if(_result != undefined){

            switch(assessment.Domain) {
              case "Cognition & Communication":
                normed_score = (50 + Math.round( (_result.score - 0.114)/3.817 * 10)/10 * 10 ).toString();
                normed_se = (Math.round(_result.error/3.817 * 10)/10 * 10).toString();
                break;
              case "Resilience & Sociability":
                normed_score = (50 + Math.round( (_result.score - 2.12)/2.33 * 10)/10 * 10 ).toString();
                normed_se = (Math.round(_result.error/2.33 * 10)/10 * 10).toString();
                break;
              case "Self-Regulation":
                normed_score = (50 + Math.round( (_result.score - 0.556)/1.854 * 10)/10 * 10 ).toString();
                normed_se = (Math.round(_result.error/1.854 * 10)/10 * 10).toString();
                break;                            
              case "Mood & Emotions":
                normed_score = (50 + Math.round( (_result.score)/1.58 * 10)/10 * 10 ).toString();
                normed_se = (Math.round(_result.error/1.58 * 10)/10 * 10).toString();
                break;
              case "Basic Mobility":
                normed_score = (50 + Math.round( (_result.score - 0.338)/0.968 * 10)/10 * 10 ).toString();
                normed_se = (Math.round(_result.error/0.968 * 10)/10 * 10).toString();
                break;
              case "Upper Body Function":
                normed_score = (50 + Math.round( (_result.score - 0.788)/2.293 * 10)/10 * 10 ).toString();
                normed_se = (Math.round(_result.error/2.293 * 10)/10 * 10).toString();
                break;
              case "Fine Motor Function":
                normed_score = (50 + Math.round( (_result.score - 0.113)/0.788 * 10)/10 * 10 ).toString();
                normed_se = (Math.round(_result.error/0.788 * 10)/10 * 10).toString();
                break;
              case "Community Mobility":
                normed_score = (50 + Math.round( (_result.score - 0.329)/1.535 * 10)/10 * 10 ).toString();
                normed_se = (Math.round(_result.error/1.535 * 10)/10 * 10).toString();
                break;
              case "Wheelchair":
                normed_score = (50 + Math.round( (_result.score - 0.329)/1.535 * 10)/10 * 10 ).toString();
                normed_se = (Math.round(_result.error/1.535 * 10)/10 * 10).toString();
                break;              
              default:
                normed_score = "N/A";
                normed_se = "N/A";
            }

            //score = (Math.floor(_result.score * 10)/10 ).toString();
            //se = (Math.floor(_result.error * 10)/10 ).toString();
             score = (50 + Math.round(_result.score * 10)/10 * 10 ).toString();
             se = (Math.round(_result.error * 10)/10 * 10).toString();
          }


         // data_export = data_export +  " \"" + assessment.Domain + " \" \t \""  + time_display  + " \" \t \"" + filtered_results.length.toString()  + " \" \t \"" + score  + " \" \t \"" + se  + " \" \n";
         // data_export = data_export + assessment.Domain + "\t"  + time_display  + "\t" + filtered_results.length.toString()  + "\t" + score  + "\t" + se  + "\n";
          data_export = data_export + assessment.Domain + ","  + time_display  + "," + filtered_results.length.toString()  + "," + score  + "," + se + "," + normed_score  + "," + normed_se  + "\n";

        }

        //https://www.oodlestechnologies.com/blogs/Create-CSV-file-in-Angular2
        let blob = new Blob(['\ufeff' + data_export], { type: 'text/csv;charset=utf-8;' });

        let dwldLink = document.createElement("a");
        let url = URL.createObjectURL(blob);
        //let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
        //if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
         //   dwldLink.setAttribute("target", "_blank");
        //}
          
        dwldLink.setAttribute("href", url);
        dwldLink.setAttribute("download", user._id + "Summary.csv");
        dwldLink.style.visibility = "hidden";
        document.body.appendChild(dwldLink);
        dwldLink.click();
        document.body.removeChild(dwldLink);

      } , err => {console.log("Error finding person");}
    );
  }



  exportData(user: User) {

    
    this.mongodbService.getUser(user).subscribe(  
      fields => {
        var user = fields;

        var data_export="\n";
        data_export = data_export + this.csvObject2(user.demo);
        data_export=data_export + "\n";
        data_export=data_export + "\n";
        data_export = data_export + this.csvObject(user.assessments);
        data_export=data_export + "\n";
        data_export=data_export + "\n";
        data_export = data_export + this.csvObject(user.responses);
        data_export=data_export + "\n";
        data_export=data_export + "\n";
        data_export = data_export + this.csvObject(user.results);

        //https://www.oodlestechnologies.com/blogs/Create-CSV-file-in-Angular2
        let blob = new Blob(['\ufeff' + data_export], { type: 'text/csv;charset=utf-8;' });

        let dwldLink = document.createElement("a");
        let url = URL.createObjectURL(blob);

        //let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
        //if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
        //    dwldLink.setAttribute("target", "_blank");
        //}
          
        dwldLink.setAttribute("href", url);
        dwldLink.setAttribute("download", user._id + "Details.csv");
        dwldLink.style.visibility = "hidden";
        document.body.appendChild(dwldLink);
        dwldLink.click();
        document.body.removeChild(dwldLink);

      } , err => {console.log("Error finding person");}
    );

  }

  addUser() {

    if(this.oid == "0"){
      this.message = 'oid can not be 0.';
      return;
    }

    this.mongodbService.loginPerson(this.study_code, this.password).subscribe(  
      fields => {
          if(fields.length == 1){
            this.message = 'User name/password must be unique system-wide.'; 
          }else{
            this.mongodbService.addPerson(this.oid, this.study_code, this.password, this.admin.sponsor_code).subscribe(
              data => { 
                this.searchProxyUsers(); 
                this.oid ='';
                this.study_code='';
                this.password='';
                this.sponsor_code='';
                this.message = data.message;
              }, err => {console.log("Error adding person");}
            ) 
          }
      }, err => {console.log("Error adding person");}
    );
  }

  gotoUtility(){
    this.router.navigate(['/utility']);
  }

  logOff(){
    this.router.navigate(['/login']);
  }

  gotoLogin(){
    this.router.navigate(['/portal','Login to begin assessment']);
  }

  gotoReport(user:User){
    this.router.navigate(['/report',user.oid, user.sponsor_code]);
  }

  selectUser(user: User) {

    this.mongodbService.getUser(user).subscribe(  
      fields => {
        this.person = new User(); 
        this.person.oid = fields.oid;
        this.person._id = fields._id;
        this.person.__v = fields.__v;
        this.person.study_code = fields.study_code;
        this.person.password = fields.password;
        this.person.sponsor_code = fields.sponsor_code;
        this.person.demo = fields.demo;

        this.store.dispatch(CounterActions.create_user(this.person));
        this.router.navigate(['/assessment']);
      } , err => {console.log("Error finding person");}
    );
  }

}
