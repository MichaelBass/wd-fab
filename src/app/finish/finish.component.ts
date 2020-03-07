import { Component, OnInit, Inject } from '@angular/core';

import {ActivatedRoute} from "@angular/router";
import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';
import * as CounterActions from '../counter.actions';
import { MongoDbService } from '../mongo-db.service';
import { User } from '../user';

@Component({
  selector: 'app-finish',
  templateUrl: './finish.component.html',
  styleUrls: ['./finish.component.css']
})
export class FinishComponent implements OnInit {
 
 	message: string;
  user: User;

  constructor(@Inject(AppStore) private store: Store<AppState>, private route: ActivatedRoute, private mongodbService: MongoDbService) { }

  ngOnInit() {

    this.user = this.store.getState().user;
    this.route.params.subscribe(params => {
      this.message = params['message'];
    });


    this.mongodbService.notifyAdmin(this.user).subscribe(
      data => { 
        console.log(data);
        if(this.user.params.length > 1){
          this.parseScores();
        }
      }
    ); 



    ;
  	this.store.dispatch(CounterActions.clear_state());
  }

  parseScores(){
    
      let myLabels = new Array();
      let myData = new Array();
      let myError = new Array();
      let myTime = new Array();
      let myLength = new Array();

      let myLabels2 = new Array();
      let myData2 = new Array();
      let myError2 = new Array();
      let myTime2 = new Array();
      let myLength2 = new Array();


      for (let assessment of this.user.assessments) {
          if(assessment.Domain === "Cognition & Communication" || assessment.Domain === "Resilience & Sociability" || assessment.Domain === "Self-Regulation" || assessment.Domain === "Mood & Emotions"){
            myLabels.push(assessment.Domain);
          }

          if(assessment.Domain === "Basic Mobility" || assessment.Domain === "Upper Body Function" || assessment.Domain === "Fine Motor Function" || assessment.Domain === "Community Mobility" || assessment.Domain === "Wheelchair"){
            myLabels2.push(assessment.Domain);
          }

          let filtered_results = this.user.results.filter((a) => a.oid === assessment.Domain);
          let item_count = filtered_results.length.toString()
          let _result = filtered_results[filtered_results.length -1];

          let score = "N/A";
          let error = "N/A";

          let start:any = new Date(assessment.Started);
          let end:any = new Date(assessment.Finished);
          var time = Math.round((end - start)/1000);

          let time_display = "N/A"
          if(time != 0){
            time_display = time.toString();
          }


          if (typeof _result === "undefined"){
          }else{

            switch(assessment.Domain) {
              case "Cognition & Communication":
                score = (50 + Math.round( (_result.score - 0.114)/3.817 * 10)/10 * 10 ).toString();
                error = (Math.round(_result.error/3.817 * 10)/10 * 10).toString();
                break;
              case "Resilience & Sociability":
                score = (50 + Math.round( (_result.score - 2.12)/2.33 * 10)/10 * 10 ).toString();
                error = (Math.round(_result.error/2.33 * 10)/10 * 10).toString();
                break;
              case "Self-Regulation":
                score = (50 + Math.round( (_result.score - 0.556)/1.854 * 10)/10 * 10 ).toString();
                error = (Math.round(_result.error/1.854 * 10)/10 * 10).toString();
                break;                            
              case "Mood & Emotions":
                score = (50 + Math.round( (_result.score)/1.58 * 10)/10 * 10 ).toString();
                error = (Math.round(_result.error/1.58 * 10)/10 * 10).toString();
                break;
              case "Basic Mobility":
                score = (50 + Math.round( (_result.score - 0.338)/0.968 * 10)/10 * 10 ).toString();
                error = (Math.round(_result.error/0.968 * 10)/10 * 10).toString();
                break;
              case "Upper Body Function":
                score = (50 + Math.round( (_result.score - 0.788)/2.293 * 10)/10 * 10 ).toString();
                error = (Math.round(_result.error/2.293 * 10)/10 * 10).toString();
                break;
              case "Fine Motor Function":
                score = (50 + Math.round( (_result.score - 0.113)/0.788 * 10)/10 * 10 ).toString();
                error = (Math.round(_result.error/0.788 * 10)/10 * 10).toString();
                break;
              case "Community Mobility":
                score = (50 + Math.round( (_result.score - 0.329)/1.535 * 10)/10 * 10 ).toString();
                error = (Math.round(_result.error/1.535 * 10)/10 * 10).toString();
                break;
              case "Wheelchair":
                score = (50 + Math.round( (_result.score - 0.329)/1.535 * 10)/10 * 10 ).toString();
                error = (Math.round(_result.error/1.535 * 10)/10 * 10).toString();
                break;              
              default:
                score = "N/A";
                error = "N/A";
            }
          }
          if(assessment.Domain === "Cognition & Communication" || assessment.Domain === "Resilience & Sociability" || assessment.Domain === "Self-Regulation" || assessment.Domain === "Mood & Emotions"){
            myData.push(score);
            myError.push(error);
            myTime.push(time_display);
            myLength.push(item_count);
            
          }

          if(assessment.Domain === "Basic Mobility" || assessment.Domain === "Upper Body Function" || assessment.Domain === "Fine Motor Function" || assessment.Domain === "Community Mobility" || assessment.Domain === "Wheelchair"){
            myData2.push(score);
            myError2.push(error);
            myTime2.push(time_display);
            myLength2.push(item_count);
          }
      }

      let scoresparam ="";

      this.user.params.forEach(function (arrayItem) {
          scoresparam += "&"+ arrayItem.key + "=" + arrayItem.value;
      });


      for (var i = 0; i < myData.length; i++) {
        if(myLabels[i] == "Cognition & Communication"){
          scoresparam += "&CC="+ myData[i] + "&CCE="+ myError[i] + "&CCT="+ myTime[i] + "&CCL="+ myLength[i];
        }
        if(myLabels[i] == "Resilience & Sociability"){
          scoresparam += "&RS="+ myData[i] + "&RSE="+ myError[i] + "&RST="+ myTime[i] + "&RSL="+ myLength[i];
        }
        if(myLabels[i] == "Self-Regulation"){
          scoresparam += "&SR="+ myData[i] + "&SRE="+ myError[i] + "&SRT="+ myTime[i] + "&SRL="+ myLength[i];
        }
        if(myLabels[i] == "Mood & Emotions"){
          scoresparam += "&ME="+ myData[i] + "&MEE="+ myError[i] + "&MET="+ myTime[i] + "&MEL="+ myLength[i];
        }
      }

      for (var i = 0; i < myData2.length; i++) { 
        if(myLabels2[i] == "Basic Mobility"){
          scoresparam += "&BM="+ myData2[i] + "&BME="+ myError2[i] + "&BMT="+ myTime2[i] + "&BML="+ myLength2[i];
        }
        if(myLabels2[i] == "Upper Body Function"){
          scoresparam += "&UBF="+ myData2[i] + "&UBFE="+ myError2[i] + "&UBFT="+ myTime2[i] + "&UBFL="+ myLength2[i];
        }
        if(myLabels2[i] == "Fine Motor Function"){
          scoresparam += "&FMF="+ myData2[i] + "&FMFE="+ myError2[i] + "&FMFT="+ myTime2[i]+ "&FMFL="+ myLength2[i];
        }
        if(myLabels2[i] == "Community Mobility"){
          scoresparam += "&CM="+ myData2[i] + "&CME="+ myError2[i] + "&CMT="+ myTime2[i]+ "&CML="+ myLength2[i];
        }
        if(myLabels2[i] == "Wheelchair"){
          scoresparam += "&WCS="+ myData2[i] + "&WCSE="+ myError2[i] + "&WCST="+ myTime2[i]+ "&WCSL="+ myLength2[i];
        }
      }

      scoresparam += "&G="+ this.user.demo.gender;
      scoresparam += "&R="+ this.user.demo.race;
      if(this.user.demo.other.length > 0) {scoresparam += "&O="+ encodeURI(this.user.demo.other)};
      scoresparam += "&A="+ this.user.demo.age;
      scoresparam += "&W="+ this.user.demo.walking;
      scoresparam += "&WC="+ this.user.demo.wc;
      scoresparam += "&D="+ this.user.demo.drive;
      scoresparam += "&PT="+ this.user.demo.public_transportation;



      //console.log('https://survey.qualtrics.com/jfe/form/SV_0JJU7SWP7sToGrP?' + scoresparam.substring(1));
      window.location.href = 'https://survey.qualtrics.com/jfe/form/SV_0JJU7SWP7sToGrP?' + scoresparam.substring(1);
  }

}
