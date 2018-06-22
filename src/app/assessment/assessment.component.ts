import { Component, OnInit, Inject } from '@angular/core';
import {Router} from "@angular/router";
import { Observable } from 'rxjs/Observable';
import { MongoDbService } from '../mongo-db.service';
import { CatService } from '../cat.service';
import { Item } from '../item';
import { Map } from '../map';
import { Response } from '../response';
import { User } from '../user';
import { Result } from '../result';
import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';
import * as CounterActions from '../counter.actions';

@Component({
  selector: 'app-assessment',
  templateUrl: './assessment.component.html',
  styleUrls: ['./assessment.component.css']
})
export class AssessmentComponent implements OnInit {

	item: Item;
	selectedMap: Map;
	
	response: Response;
	user: User;
	message: string;
	isDisabled: boolean;

	constructor(@Inject(AppStore) private store: Store<AppState>, private catService: CatService, private router: Router, private mongodbService: MongoDbService) { }

	ngOnInit() {

		this.user = this.store.getState().user;
		this.message = this.user.study_code + ' is logged in';
		this.isDisabled = true;
		if(this.user.oid == "0"){
			 this.router.navigate(['/dashboard','Please select an user first']);
		}

		this.getItem();
	
	}

	getItem(): void {

		this.catService.getNextItem().subscribe(
			data => { 
			
				this.item = data;
				if(this.item  == null){
					this.router.navigate(['/dashboard','Test is complete.']);
				}
			
			}
		);
	}

	onSelect(map: Map): void {
		this.selectedMap = map;
		this.isDisabled = false;
	}

	onSubmit(): void {
		this.isDisabled = true;
		this.getResponse();
	}
	
	getNextItem(){
		this.catService.getNextItem().subscribe(
			data => { 
				this.item = data;
				if( this.item.ID == undefined ){
					this.router.navigate(['/dashboard','Test is complete.']);
				}
			}
		)
	}

	calculateEstimate(): void{
		this.catService.calculateEstimate().subscribe(
			data => { 

				var _result = data;
				this.mongodbService.addResult(this.user._id, _result).subscribe(
					data2=> {
						this.user.results.push(_result);
						this.store.dispatch(CounterActions.create_user(this.user));
						this.getNextItem();
					},
      				err => {console.log("Error adding Results");}
				)
				
			}
		)
	}
	
	getResponse(): void {
		this.response = new Response();
		this.response.oid = this.user.oid;
		this.response.ID = this.item.ID;
		this.response.Prompt = this.item.Prompt;
		this.response.ItemResponseOID = this.selectedMap.ItemResponseOID;
		this.response.Value = this.selectedMap.Value;
		//console.log(this.response);

		this.selectedMap = null;

    	this.mongodbService.addResponse(this.user._id, this.response).subscribe(
      		result=> {
      			this.calculateEstimate();
      		},
      		err => {console.log("Error adding Responses");}
    	)	
	}

}
