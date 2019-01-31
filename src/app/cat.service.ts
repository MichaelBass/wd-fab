import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { EmptyObservable } from "rxjs/observable/EmptyObservable"
import { Item } from './item';
import { Map } from './map';
import { FORMS } from './forms';
import { Form } from './form';
import { Assessment } from './assessment';
import { Response } from './response';
import { Result } from './result';
import { IRTService } from './irt.service';
import { MongoDbService } from './mongo-db.service';
import { User } from './user';
import { Store } from 'redux';
import { AppStore } from './app.store';
import { AppState } from './app.state';
import * as CounterActions from './counter.actions';

@Injectable()
export class CatService {


	//private _item_index = -1;

	constructor(@Inject(AppStore) private store: Store<AppState>, private mongodbService: MongoDbService, private irt: IRTService) {}
	
	setAssessments(user:User): Array<Assessment>{

		let assessment = user.assessments.filter((a) => a.Active === true); // array of current assessment

		if(assessment.length == 0){ // No current assessment found
			assessment[0] = user.assessments[0];		
		}

		let filtered_results = user.results.filter((a) => a.oid === assessment[0].Domain);

		// determine if need to get the next assessment
		if ( (filtered_results.length > 5 && filtered_results[ filtered_results.length -1 ].error < 0.3873) || filtered_results.length >= 10 ) { 
			for(var i = 0; i < user.assessments.length; i++){
				if(user.assessments[i].Active == true){

					user.assessments[i].Active = false;
					user.assessments[i].Finished = Date.now();

					if( (i+1) == user.assessments.length){
						assessment = null;
					}else{
						assessment[0] = user.assessments[i + 1];
					}
					break;
				}
			}
		}

		return assessment;

	}

	getNextItem(): Observable<any> {

		var user = this.store.getState().user;
		let assessment = this.setAssessments(user);

		if(assessment == null){
	    	return this.mongodbService.startAssessment(user._id, user.assessments).map(
	      		data=>{
	      			this.store.dispatch(CounterActions.create_user(data));
	      			return new EmptyObservable<Item>();
	      		}
	    	)
		}

		if(assessment[0].Started == null){
			assessment[0].Started = Date.now();
			//this._item_index = -1;
		}

		assessment[0].Active = true;

    	return this.mongodbService.startAssessment(user._id, user.assessments).map(
      		data=>{
      			this.store.dispatch(CounterActions.create_user(data));
      			let forms = user.forms.filter( (e) => e.Domain === assessment[0].Domain);

      			if(forms.length == 0){
      				return new EmptyObservable<Item>();
      			}else{
					var _item = this.calculateNextItem(forms[0]);
					if(_item == null){

						// clear assessment  TODO:  need to replace these assessment with the User.
						assessment[0].Active = false;
						assessment[0].Finished = Date.now();


						let assessment2 = user.assessments.filter( (a) => a.Started == null );
						assessment2[0].Active = true;


            			user.assessments = user.assessments.map(obj => assessment.find(o => o.Domain === obj.Domain) || obj);
            			user.assessments = user.assessments.map(obj => assessment2.find(o => o.Domain === obj.Domain) || obj);
            			this.store.dispatch(CounterActions.create_user(user));

						return new EmptyObservable<Item>();

					}else{
						return _item;
					}
					
				}	
      		}
    	)

  	}

  	calculateNextItem(form: Form) : Item {

  		var initialTheta = 0.0;
  		var information = 0.0;

  		var cumulativeP = new Array();
  		var informationSet = new Array();

  		for(var i=0; i < form.Items.length; i++){
  			
			let Calibrations = form.Items[i].Maps.filter((a) => a.Calibration).sort((a,b) => parseFloat(a.Calibration) - parseFloat(b.Calibration) );

			cumulativeP = this.irt.calculateCumulativeProbability(parseFloat(form.Items[i].Slope), initialTheta, Calibrations);

  			if(!form.Items[i].Administered){
  				informationSet.push({'id':i, 'information': this.irt.information2 (parseFloat(form.Items[i].Slope),cumulativeP)});
  			}

		}
		
		if(informationSet.length == 0){
			return null;
		}

		informationSet.sort((a,b) => parseFloat(b.information) - parseFloat(a.information) );

		var user = this.store.getState().user;

		var formID = 0;
		var itemID = 0;
		for(var x=0; x < user.forms.length; x++ ){
			if( user.forms[x].Domain == form.Domain ){
				user.forms[x].Items[informationSet[0].id].Administered = true;
			}
		}

		var randomIndex = Math.floor(Math.random() * 4);
		if(informationSet.length < 6){
			randomIndex = 0;
		}


		form.Items[informationSet[randomIndex].id].Administered = true;
		//this._item_index = this._item_index + 1;
		//return form.Items[this._item_index];
		return form.Items[informationSet[randomIndex].id];
		//return form.Items[informationSet[0].id];
		
  	}

  	calculateEstimate() : Observable<Result> {

  		var user = this.store.getState().user;

		return this.mongodbService.getResponses(user._id).map(
			data=>{

				let assessment = user.assessments.filter((a) => a.Active === true);
				let forms = user.forms.filter( (e) => e.Domain === assessment[0].Domain);
				let responseProperties = new Array<Item>();

				for(var i = 0 ; i < data.length; i++){
					let item = forms[0].Items.filter((a) => a.ID === data[i].ID)
					if(item.length > 0){
						item[0].AnsweredItemResponseOID = data[i].ItemResponseOID;

						if( !this.skipScoring(item[0]) ){
							responseProperties.push(item[0]);
						}
					}
				}

				var ItemID = data[data.length -1].ID;
				
				return this.calculateGRM(responseProperties, forms[0].Domain, ItemID);
			}
		);

  	}

  	skipScoring(item: Item): boolean {

  		var rtn = false;
		let map = item.Maps.filter((a) => a.ItemResponseOID === item.AnsweredItemResponseOID);

  		if(map.length > 0  && map[0].Value == '8'){
  			rtn = true;
  		}
  		return rtn;

  	}

  	calculateGRM(items: Array<Item>, FormID: string, ItemID: string): Result {


  		if(items.length == 0){
  			return new Result();
  		}

		var user = this.store.getState().user;
		
		var bisect_bias = this.bisectionMethod_bias(items, FormID);
		var newton_rhapson = this.newton_rhapson(items, bisect_bias);
		var SE = this.irt.L2_sum(items, newton_rhapson[0]);

		var _result = new Result();
		_result.oid = FormID;
		_result.ItemID = ItemID;
		_result.score = newton_rhapson[0];
		_result.error = 1.0/Math.sqrt(-1.0*SE);

		_result.fit = this.person_fit(items, newton_rhapson[0]);

  		return _result;

  	}


  	bisectionMethod_bias(items: Array<Item>, FormID: string): number {

  	  	var theta_lower = -6.0;
  		var theta_upper = 6.0;
  		var rtn = (theta_lower + theta_upper)/2.0;
  		var rtn = theta_lower;
		var theta_estimate = -6.0;
		var bias = 0.0;
		var _bias = 0.0;

  		for(var loop = 0; loop < 1000; loop++){
			var LikelyhoodSlope = this.irt.L1_sum(items, rtn);

			_bias = this.calculateBias(items, rtn, LikelyhoodSlope);

			if( _bias == NaN ){
				_bias = 0.0;
				console.log(" bias is NaN ");
			}

			//if( (LikelyhoodSlope + _bias) > 0.0){
			if( _bias > 0.0){
	  			theta_lower = rtn;
	  		}else{
	  			theta_upper = rtn;
	  		}
	  		rtn = (theta_lower + theta_upper)/2.0;


		  	if(Math.abs(theta_estimate - rtn) < .0001){
    			break;
	  		}else{
	  			theta_estimate = rtn;
	  		}
  		}

		return rtn;
  	}

  	calculateBias(items: Array<Item>, est: number, likelyhood: number) : number {

  		var sum = 0.0;
  		var information = 0.0;

		for(var i = 0 ; i < items.length; i++){

			var item_sum = 0.0;
			var cumulativeP = this.irt.calculateCumulativeProbability(parseFloat(items[i].Slope), est, items[i].Maps);
	
			var adjustCategory = this.irt.getAdjustedCategory(items[i].Maps, items[i].AnsweredItemResponseOID);
			var itemSlope = parseFloat(items[i].Slope);

			var first = this.irt.firstDerivative( cumulativeP );
			var second = this.irt.secondDerivative( itemSlope, cumulativeP );
			information = information + this.irt.information2(itemSlope,cumulativeP);

	  		var array00 = new Array();
	  		for(var k =1; k < cumulativeP.length; k++){
	  			array00.push((cumulativeP[k-1] + cumulativeP[k])); 
	  		}
	  		var array21 = new Array();
	  		for(var k =1; k < cumulativeP.length; k++){
	  			array21.push( (this.irt.secondDerivative2(cumulativeP)[k-1] - 1.0 * this.irt.secondDerivative2(cumulativeP)[k]) ); 
	  		}

        	// p1 = np.dot((self.slope ** 3),np.diagonal(np.dot(1. - mats[0][0], mats[2][1].T)))
        	for(k=0; k < array00.length;k++){
        		item_sum = item_sum  + (1.0 - array00[k]) * array21[k] 
        	}

			item_sum = item_sum * Math.pow(itemSlope ,3);
			sum = sum + item_sum;

		}
		//console.log("est: " + (likelyhood + sum/(2.0 * information)) + " trait: " + est + " term1: " + likelyhood + " term2: " + sum/(2.0 * information));
		return likelyhood + sum/(2.0 * information);
  	}

  	person_fit(items: Array<Item>, est: number) : number {

  
  		var e = 0.0;
  		var v = 0.0;
		var l = this.irt.L0_sum(items,est);

  		for(var i = 0 ; i < items.length; i++){
  			var e_t = 0.0;
  			var v_t = 0.0;

  			var adjustCategory = this.irt.getAdjustedCategory(items[i].Maps, items[i].AnsweredItemResponseOID);
	
			var itemSlope = parseFloat(items[i].Slope);
			var cumulativeP = this.irt.calculateCumulativeProbability(itemSlope, est, items[i].Maps);


			//for(var k =1; k < items[i].Maps.length; k++){
			for(var k = 1; k < cumulativeP.length; k++){

				var t = cumulativeP[k-1] - cumulativeP[k]; // verify this is what is needed.


				//if(k == adjustCategory){
				//	l = l + Math.log(t);
				//}
				e_t = e_t + t * Math.log(t);

				for(var j = 1; j < cumulativeP.length; j++){
				//for(var j =1; j < items[i].Maps.length; j++){
					var t1 = cumulativeP[j-1] - cumulativeP[j]; // verify this is what is needed.
					v_t = v_t + t * t1 * Math.log(t) * Math.log(t/t1);
				}
			}
			e = e + e_t;
			v = v + v_t;
  		}
  		return (l - e)/Math.sqrt(v);

  	}


  	 newton_rhapson(items: Array<Item>, est: number) : Array<number>{

  	 	var rtn = new Array();
  	 	var diff = 1.0;
  	 	var steps = 0
  	 	var wml = est;

  	 	while (diff > 0.0001){

			var new_est = 0.0;

	  	 	var wml1 = this.irt.wml_est1 (items, est);
	  	 	var wml2 = this.irt.wml_est2 (items, est);

		  	for (var n=0; n < 6; n++){

		  		new_est = est - Math.pow(0.5, n) * (wml1 / wml2);

		  		var information_new = 0.0;
		  		for(var i =0; i < items.length; i++){
		  			var cumulativeP_new = this.irt.calculateCumulativeProbability(parseFloat(items[i].Slope), new_est, items[i].Maps);
		  			information_new = information_new + this.irt.information2(parseFloat(items[i].Slope),cumulativeP_new);
		  		}

		  		var wml1_new = this.irt.wml_est1 (items, new_est);
		  		if( (information_new != 0.0) && (wml1 > wml1_new) ){
		  			break;
		  		}
	  		}
      

            diff = Math.abs(wml - new_est) 
            //se = 1. / np.sqrt(-self.log_l(wml, 2)) 
            wml = new_est
            steps += 1;
      	}

      	rtn[0] = wml;
		rtn[1] = steps;
		return rtn;	             

  	}

 	loadForms(user: User): Observable<User>{


		let forms = Array<Form>();
		
		for(var j=0; j < FORMS.length; j++){

			let _form = new Form();
			_form.FormOID = FORMS[j].FormOID;
			_form.ID = FORMS[j].ID;
			_form.Name = FORMS[j].Name;
			_form.Domain = FORMS[j].Domain;
			_form.Items = [];

			for (var item of FORMS[j].Items) {	
				if( parseInt(item.Operator) != 0 && (parseInt(item.Operator) & user.exlusion_code) > 0 ){
					//var index = FORMS[j].Items.indexOf(item);
					//console.log("removing " + item.Name);
					//forms.splice(index,1);
				}else{
					_form.Items.push(item);
				}
			}		
			forms.push(_form);

			/*
			for (var item of FORMS[j].Items) {
				if( parseInt(item.Operator) != 0 && (parseInt(item.Operator) & user.exlusion_code) > 0 ){
					var index = FORMS[j].Items.indexOf(item);
					//console.log("removing " + item.Name);
					FORMS[j].Items.splice(index,1);
				}
			}
			
			
			for(var i=0; i < FORMS[j].Items.length; i++){
				if( parseInt(FORMS[j].Items[i].Operator) != 0 && (parseInt(FORMS[j].Items[i].Operator) & user.exlusion_code) > 0 ){
					console.log("removing " + FORMS[j].Items[i].Name);
					FORMS[j].Items.splice(i,1);
				}
			}
			*/

			//console.log(FORMS[j].FormOID + " : " + FORMS[j].Items.length);
		}

    	//return this.mongodbService.loadForms(user._id, FORMS);
    	return this.mongodbService.loadForms(user._id, forms);

	}

}
