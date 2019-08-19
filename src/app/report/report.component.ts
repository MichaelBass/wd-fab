import { Component, OnInit, Inject } from '@angular/core';

import { ChartDataSets, ChartType, RadialChartOptions } from 'chart.js';
import { Label } from 'ng2-charts';

import {ActivatedRoute} from "@angular/router";
import { MongoDbService } from '../mongo-db.service';
import { User } from '../user';

import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';


@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})

export class ReportComponent implements OnInit {

	user: User;
	oid:string;
  sponsor_code:string;

  public radarChartOptions: RadialChartOptions = {
    responsive: true,
  };

  public radarChartLabels: Label[];


  public radarChartData: ChartDataSets[] = [
    { data: [50, 50, 50, 50, 50, 50, 50, 50, 50], label: 'Mean' },
    { data: [50, 50, 50, 50, 50, 50, 50, 50, 50], label: 'Series B' }
  ];


  public radarChartType: ChartType = 'radar';

  constructor(@Inject(AppStore) private store: Store<AppState>, private mongodbService: MongoDbService, private route: ActivatedRoute) {
    store.subscribe(() => this.readState()); 
  }

  readState() {
    const state: AppState = this.store.getState() as AppState;
    this.user = state.user;
  }

  ngOnInit() {
  	this.readState();

    this.route.params.subscribe(params => {


      this.oid = params['oid'];
      this.sponsor_code = params['sponsor_code'];

		this.mongodbService.findUser(this.oid, this.sponsor_code).subscribe(  
		  fields => {
      var user = fields;
      this.user = fields;
			var myLabels = new Array();
			var myData = new Array();

		    for (let assessment of user.assessments) {

		    	myLabels.push(assessment.Domain);

          let filtered_results = user.results.filter((a) => a.oid === assessment.Domain);
          let _result = filtered_results[filtered_results.length -1];
          let score = "N/A";
					score = (50 + Math.round(_result.score * 10)/10 * 10 ).toString();

				  myData.push(score);	
		    }

			this.radarChartLabels = myLabels;

			let start:any = new Date(user.assessments[0].Started);	

			this.radarChartData[1].data = myData;
			this.radarChartData[1].label = "Assessment date: " + start.toLocaleDateString();


		 }, err => {console.log("Error finding person");}
		 
		 );

    });
  }

  public chartClicked({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event: MouseEvent, active: {}[] }): void {
    console.log(event, active);
  }


}

