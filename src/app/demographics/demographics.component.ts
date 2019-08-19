import { Component, OnInit, Inject} from '@angular/core';
import { FormControl, FormGroup, Validators} from '@angular/forms';
import { MongoDbService } from '../mongo-db.service';
import { CatService } from '../cat.service';
import { Demographic } from '../demographic';
import { User } from '../user';

import {Router} from "@angular/router";

import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';
import * as CounterActions from '../counter.actions';

@Component({
  selector: 'app-demographics',
  templateUrl: './demographics.component.html',
  styleUrls: ['./demographics.component.css']
})

export class DemographicsComponent implements OnInit {

  isValidFormSubmitted: boolean = null;
  isRaceMissing: boolean = false;
  isAgeValid: boolean = true;
  form : FormGroup;
  user: User;
  message:String;
  payLoad = '';
  races: any;

  race_selected_1 = false;
  race_selected_2 = false;
  race_selected_4 = false;
  race_selected_8 = false;
  race_selected_16 = false;
  race_selected_32 = false;
  race_selected_64 = false;
  race_selected_128 = false;
  race_selected_256 = false;

  demo: Demographic = {
    gender: -1,
    race: 0,
    age: null,
    walking: -1,
    wc: -1,
    drive: -1,
    public_transportation: -1,
    other:''
  };

  constructor(@Inject(AppStore) private store: Store<AppState>, private mongodbService: MongoDbService, private catService: CatService, private router: Router) {}

  ngOnInit() {

    this.user = this.store.getState().user;

    if(this.user.demo){
      this.demo = this.user.demo; 
    }

    let group: any = {};
    group['demo_gender'] = new FormControl('demo_gender', [Validators.required,Validators.min(0)] );
    //group['demo_age'] = new FormControl('demo_age', [Validators.required,Validators.min(0)]);
    group['demo_age'] = new FormControl('demo_age');
    group['demo_walking'] = new FormControl('demo_walking', [Validators.required,Validators.min(0)]);
    group['demo_wc'] = new FormControl('demo_wc', [Validators.required,Validators.min(0)]);
    group['demo_other'] = new FormControl('demo_other');
    group['demo_drive'] = new FormControl('demo_drive', [Validators.required,Validators.min(0)]);
    group['demo_public_transportation'] = new FormControl('demo_public_transportation', [Validators.required,Validators.min(0)]);
 
    group['demo_1'] = new FormControl('demo_1');
    this.race_selected_1 = (this.demo.race & 1) == 1;
    group['demo_1'].setValue(this.race_selected_1);

    group['demo_2'] = new FormControl('demo_2');
    this.race_selected_2 = (this.demo.race & 2) == 2;
    group['demo_2'].setValue(this.race_selected_2);

    group['demo_4'] = new FormControl('demo_4');
    this.race_selected_4 = (this.demo.race & 4) == 4;
    group['demo_4'].setValue(this.race_selected_4);

    group['demo_8'] = new FormControl('demo_8');
    this.race_selected_8 = (this.demo.race & 8) == 8;
    group['demo_8'].setValue(this.race_selected_8);

    group['demo_16'] = new FormControl('demo_16');
    this.race_selected_16 = (this.demo.race & 16) == 16;
    group['demo_16'].setValue(this.race_selected_16);

    group['demo_32'] = new FormControl('demo_32');
    this.race_selected_32 = (this.demo.race & 32) == 32;
    group['demo_32'].setValue(this.race_selected_32);

    group['demo_64'] = new FormControl('demo_64');
    this.race_selected_64 = (this.demo.race & 64) == 64;
    group['demo_64'].setValue(this.race_selected_64);

    group['demo_128'] = new FormControl('demo_128');
    this.race_selected_128 = (this.demo.race & 128) == 128;
    group['demo_128'].setValue(this.race_selected_128);

    group['demo_256'] = new FormControl('demo_256');
    this.race_selected_256 = (this.demo.race & 256) == 256;
    group['demo_256'].setValue(this.race_selected_256);

    this.form = new FormGroup(group);

  }

  updateDemo(dem:Demographic) {

    this.mongodbService.saveDemo(this.user.oid,this.user.sponsor_code, dem).subscribe(
      data => {
        this.user = data;
        this.store.dispatch(CounterActions.create_user(data));

        this.message = data.message;
        this.router.navigate(['/intro']);
      },
      err => {
        this.message = "Error saving demographics";
      }

    )


/*
    this.mongodbService.updateDemo(this.user.oid,this.user.sponsor_code, dem).subscribe(
      user => {
        this.user = user;
        this.updateAssessments();
        this.message = user.message;
        this.router.navigate(['/intro']);
      },
      err => {
        this.message = "Error saving demographics";
      }

    )
*/    
  }
/*
  updateAssessments(){

    this.mongodbService.updateAssessments(this.user).subscribe(
      data => {
        this.user = data;
        this.calculate_exlusion_code();
        this.loadForms();
      },
      err => {
        this.message = "Error updateAssessments";
      }
    )
  }

  loadForms(){
    this.catService.loadForms(this.user).subscribe(
      data => {
        this.user = data;
        this.store.dispatch(CounterActions.create_user(data));
      }
    )
  }
*/
  calculate_exlusion_code(){

    var bitsum = 0;

    if (this.user.demo.wc == 1){
      //WheelChair = All the time; I never walk
      bitsum = bitsum + 2;
      //console.log("wheelchair");
    }
    if (this.user.demo.walking == 2){
      //Walking Aid = Never
      bitsum = bitsum + 4;
      //console.log("walking");
    }
    if (this.user.demo.gender == 0){
      //Gender = Female
      bitsum = bitsum + 16;
      //console.log("female");
    }
    if (this.user.demo.gender == 1){
      //Gender = Male
      bitsum = bitsum + 32;
      //console.log("male");
    }
    if (this.user.demo.gender == 2){
      //Gender = Refused
      bitsum = bitsum + 64;
      //console.log("gender:refused");
    }

    /*
    if (this.user.demo.age >= 55){
      //Age >= 55
      bitsum = bitsum + 128;
      //console.log("over 55");
    }
    if (this.user.demo.age < 55  && this.user.demo.age > 0){
      //Age < 55
      bitsum = bitsum + 256;
      //console.log("under 55");
    }
    if (this.user.demo.age < 0){
      //Age is not provided
      bitsum = bitsum + 512;
      //console.log("no age");
    }
    */

    if ((this.user.demo.race & 1) != 1){
      //Race <> White
      bitsum = bitsum + 1024;
      //console.log("Race <> White");
    }
    if ((this.user.demo.race & 1) == 1){
      //Race == White
      bitsum = bitsum + 2048;
      //console.log("Race == White");
    }
    if ((this.user.demo.race & 64) == 64){
      //Race is not provided
      bitsum = bitsum + 4096;
      //console.log("Race not provided");
    }

    if(this.user.demo.drive == 0){
      bitsum = bitsum + 8192;
    }
    if(this.user.demo.public_transportation == 0){
      bitsum = bitsum + 16384;
    }

    this.user.exlusion_code = bitsum;
  }

  onClear() {
  
    this.demo = {
      gender: -1,
      race: -1,
      age: -1,
      walking: -1,
      wc: -1,
      drive: -1,
      public_transportation: -1,
      other:''
    };

    this.race_selected_1 = false;
    this.race_selected_2 = false;
    this.race_selected_4 = false;
    this.race_selected_8 = false;
    this.race_selected_16 = false;
    this.race_selected_32 = false;
    this.race_selected_64 = false;
    this.race_selected_128 = false;
    this.race_selected_256 = false;

  }

  onSubmit() {


     this.isValidFormSubmitted = false;
     if(this.form.invalid){
        return; 
     } 
    this.isValidFormSubmitted = true;


      this.payLoad = JSON.stringify(this.form.value);
      var payLoad = JSON.parse(this.payLoad);

      var race = 0;

      if(payLoad.demo_1 ){
        race = race + 1;
      }
      if(payLoad.demo_2 ){
        race = race + 2;
      }
      if(payLoad.demo_4 ){
        race = race + 4;
      }
      if(payLoad.demo_8 ){
        race = race + 8;
      }
      if(payLoad.demo_16 ){
        race = race + 16;
      }
      if(payLoad.demo_32 ){
        race = race + 32;
      }
      if(payLoad.demo_64 ){
        race = race + 64;
      }
      if(payLoad.demo_128 ){
        race = race + 128;
      }
      if(payLoad.demo_256 ){
        race = race + 256;
      }

      if(race == 0){
        this.isRaceMissing = true;
        return;
      }

      if (isNaN(payLoad.demo_age)) {
        this.isAgeValid = false;
        return;
      }
            
      var dem = new Demographic();
      dem.age = payLoad.demo_age;
      dem.drive = payLoad.demo_drive;
      dem.gender = payLoad.demo_gender;
      dem.other = payLoad.demo_other;
      dem.public_transportation = payLoad.demo_public_transportation ;
      dem.race = race;
      dem.walking = payLoad.demo_walking;
      dem.wc = payLoad.demo_wc;
      this.updateDemo(dem); 

    }

}
