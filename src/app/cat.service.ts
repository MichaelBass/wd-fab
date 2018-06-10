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
import { MongoDbService } from './mongo-db.service';
import { User } from './user';
import { Store } from 'redux';
import { AppStore } from './app.store';
import { AppState } from './app.state';
import * as CounterActions from './counter.actions';

@Injectable()
export class CatService {

	constructor(@Inject(AppStore) private store: Store<AppState>, private mongodbService: MongoDbService) {}

	setAssessments(user:User): Array<Assessment>{

		let assessment = user.assessments.filter((a) => a.Active === true); // array of current assessment

		if(assessment.length == 0){ // No current assessment found
			assessment[0] = user.assessments[0];		
		}

		let filtered_results = user.results.filter((a) => a.oid === assessment[0].Domain);

		// determine if need to get the next assessment
		if ( (filtered_results.length > 5 && filtered_results[ filtered_results.length -1 ].error < 0.3873) || filtered_results.length > 10 ) { 
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
  		// var informationSet2 = new Array();

  		for(var i=0; i < form.Items.length; i++){
  			
			let Calibrations = form.Items[i].Maps.filter((a) => a.Calibration).sort((a,b) => parseFloat(a.Calibration) - parseFloat(b.Calibration) );

			cumulativeP = this.calculateCumulativeProbability(parseFloat(form.Items[i].Slope), initialTheta, Calibrations);

  			if(!form.Items[i].Administered){
  				informationSet.push({'id':i, 'information': this.information2 (parseFloat(form.Items[i].Slope),cumulativeP)});
  				// informationSet2.push({'id':i, 'information': this.information (parseFloat(form.Items[i].Slope),cumulativeP)});
  			}

		}
		
		if(informationSet.length == 0){
			return null;
		}

		informationSet.sort((a,b) => parseFloat(b.information) - parseFloat(a.information) );
		// informationSet2.sort((a,b) => parseFloat(b.information) - parseFloat(a.information) );

		var user = this.store.getState().user;

		var formID = 0;
		var itemID = 0;
		for(var x=0; x < user.forms.length; x++ ){
			if( user.forms[x].Domain == form.Domain ){
				user.forms[x].Items[informationSet[0].id].Administered = true;
			}
		}

		form.Items[informationSet[0].id].Administered = true;
		return form.Items[informationSet[0].id];
		
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
						responseProperties.push(item[0]);
					}
				}
				
				return this.calculateGRM(responseProperties, forms[0].Domain);
			}
		);

  	}

  	calculateGRM(items: Array<Item>, FormID: string): Result {


  		var trace = "";
		for(var i = 0 ; i < items.length; i++){
			trace = trace + items[i].ID + "|";
		}

		var score = this.bisectionMethod(items, FormID);

		var user = this.store.getState().user;
		var SE = this.L2_sum(items, score);
		
		//var SE = this.information_sum(items, score);
		var _result = new Result();
		_result.oid = FormID;
		_result.score = score;
		_result.score_bias = this.bisectionMethod_bias(items, FormID);

		_result.error = 1.0/Math.sqrt(-1.0*SE);

  		_result.newton_score = this.newton_rhapson(items, score)[0];
  		_result.newton_iterations = this.newton_rhapson(items, score)[1];

  		_result.newton_bias_score = this.newton_rhapson_bias(items, score)[0];
  		_result.newton_bias_iterations = this.newton_rhapson(items, score)[1];

		_result.fit = this.person_fit(items, score);
		_result.trace = trace;

  		return _result;

  	}


  	bisectionMethod(items: Array<Item>, FormID: string): number {

  	  	var theta_lower = -6.0;
  		var theta_upper = 6.0;
  		var rtn = (theta_lower + theta_upper)/2.0;
		var theta_estimate = -6.0;

  		for(var loop = 0; loop < 1000; loop++){
			var LikelyhoodSlope = this.L1_sum(items, rtn);

			if( (LikelyhoodSlope) > 0.0){
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

  	bisectionMethod_bias(items: Array<Item>, FormID: string): number {

  	  	var theta_lower = -6.0;
  		var theta_upper = 6.0;
  		var rtn = (theta_lower + theta_upper)/2.0;
		var theta_estimate = -6.0;
		var bias = 0.0;

  		for(var loop = 0; loop < 1000; loop++){
			var LikelyhoodSlope = this.L1_sum(items, rtn);

			var Bias_Numerator = this.B11_sum(items, rtn);  //B_11
			var Bias_Denomenator = this.B12_sum(items, rtn); //B_12

			bias = Bias_Numerator/Bias_Denomenator;


			if( (LikelyhoodSlope + bias) > 0.0){
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

  	person_fit(items: Array<Item>, est: number) : number {

  		var l = 0.0;
  		var e = 0.0;
  		var v = 0.0;

  		for(var i = 0 ; i < items.length; i++){
  			var e_t = 0.0;
  			var v_t = 0.0;

  			var adjustCategory = this.getAdjustedCategory(items[i].Maps, items[i].AnsweredItemResponseOID);
			var itemSlope = parseFloat(items[i].Slope);
			var cumulativeP = this.calculateCumulativeProbability(itemSlope, est, items[i].Maps);

			for(var k =1; k < items[i].Maps.length; k++){

				var t = cumulativeP[k-1] - cumulativeP[k]; // verify this is what is needed.
				if(k == adjustCategory){
					l = l + Math.log(t);				
				}
				e_t = e_t + t * Math.log(t);


				for(var j =1; j < items[i].Maps.length; j++){
					var t1 = cumulativeP[j-1] - cumulativeP[j]; // verify this is what is needed.
					v_t = v_t + t * t1 * Math.log(t) * Math.log(t/t1);
				}
			}
			e = e + e_t;
			v = v + v_t;
  		}

  		return (l - e)/Math.sqrt(v);

  	}

  	calculateCumulativeProbability(slope: number, initialTheta: number, maps: Array<Map>) : Array<number> {



		maps.sort((a,b) => parseFloat(a.Calibration) - parseFloat(b.Calibration) )


  		var cumulativeP = new Array();
		cumulativeP.push(1.0);
		for(var j=0; j < maps.length ; j++){
			if( maps[j].Calibration != ""){
				cumulativeP.push( 1/ ( 1 + Math.pow(Math.E,(slope * (parseFloat(maps[j].Calibration) - initialTheta)))) ) ;
			}
		}
		cumulativeP.push(0.0);
  		return cumulativeP;
  	}

  	firstDerivative(prob: Array<number>) : Array<number> {
  		var sum = new Array();
  		sum.push(0.0);
  		for(var i=1; i < prob.length; i++){
  			sum.push(Math.pow(prob[i-1],2) - prob[i-1]);
  		}
  		sum.push(0.0);
  		return sum;
  	}

  	secondDerivative(slope: number, prob: Array<number>) : Array<number> {
  		var sum = new Array();
  		sum.push(0.0);
  		for(var i=1; i < prob.length; i++){
  			sum.push( 2.0*Math.pow(prob[i-1],3) - 3.0*Math.pow(prob[i-1],2) + prob[i-1] );
  		}
  		sum.push(0.0);
  		return sum;
  	}

  	thirdDerivative(slope: number, prob: Array<number>) : Array<number> {
  		var sum = new Array();
  		sum.push(0.0);
  		for(var i=1; i < prob.length; i++){
  			sum.push( 6.0*Math.pow(prob[i-1],4) - 12.0*Math.pow(prob[i-1],3) + 7.0*Math.pow(prob[i-1],2) - prob[i-1] );
  		}
  		sum.push(0.0);
  		return sum;
  	}

  	information (slope: number, prob: Array<number>) : number {
   		var sum = 0.0;
  		for(var i=1; i < prob.length; i++){
  			var t1i = prob[i]*prob[i] - prob[i];
  			var t1i_1 = prob[i]*prob[i-1] - prob[i-1];
  			sum = sum + slope* slope * (t1i + t1i_1) * (prob[i] - prob[i-1]);
  		}
  		return sum; 	
  	}

  	information2 (slope: number, cumulativeP: Array<number>) : number {
   		var sum = 0.0;
		for(var k=1; k < cumulativeP.length; k++){
			var term1 = cumulativeP[k -1] * (1.0 - cumulativeP[k -1]);
			var term2 = cumulativeP[k] * (1.0 - cumulativeP[k]); 
			var num = slope * (term1 - term2);
			sum = sum + Math.pow(num,2)/(cumulativeP[k-1] - cumulativeP[k]);
		}
		return sum; 	
  	}


 	newton_rhapson_bias(items: Array<Item>, est: number) : Array<number> {

  		var max = 200;
		var L1 = 0.0;
		var L2 = 0.0;
		var B_11 = 0.0;
		var B_12 = 0.0;
		var B_22 = 0.0;
		var B_21 = 0.0;
		var B_231 = 0.0;
		var B_232 = 0.0;
		var B_24 = 0.0;
		var rtn = new Array();
		var score = 0.0;
		var new_est = est;
		var iterations = 0;

		while(max > 0.0001){
			for(var i = 0 ; i < items.length; i++){
	  			var adjustCategory = this.getAdjustedCategory(items[i].Maps, items[i].AnsweredItemResponseOID);
				var itemSlope = parseFloat(items[i].Slope);
				var cumulativeP = this.calculateCumulativeProbability(itemSlope, new_est, items[i].Maps);

				L1 = L1 + this.L1(itemSlope, cumulativeP, adjustCategory);
				L2 = L2 + this.L2(itemSlope, cumulativeP, adjustCategory);
				B_11 = B_11 + this.B_11(itemSlope, cumulativeP, adjustCategory);
				B_12 = B_12 + this.B_12(itemSlope, cumulativeP, adjustCategory);
				B_21 = B_21 + this.B_21(itemSlope, cumulativeP, adjustCategory);
				B_22 = B_22 + this.B_12(itemSlope, cumulativeP, adjustCategory); // same as B_12
				B_231 = B_231 + this.B_11(itemSlope, cumulativeP, adjustCategory); // same as B_11
				B_232 = B_232 + this.B_232(itemSlope, cumulativeP, adjustCategory); // need to multiply by -1.0
				B_24 = B_24 + this.B_24(itemSlope, cumulativeP, adjustCategory);		
			}

			B_24 = 2.0*Math.pow(B_24,2);

			var L1_sum = this.L1_sum(items, new_est);
			var B11_sum = this.B11_sum(items, new_est);
			var B12_sum = this.B12_sum(items, new_est);

			var condition = L1_sum + B11_sum/B12_sum;

			var NN = 0;
			while( NN < 6 ){
				score = new_est - Math.pow(0.5,NN) * (L1 + B_11/B_12)/(L2 + (B_21/B_22 - B_231*B_232/B_24));

				var L1_sum_new = this.L1_sum(items, score);
				var B11_sum_new = this.B11_sum(items, score);
				var B12_sum_new = this.B12_sum(items, score);

				var condition_new = L1_sum_new + B11_sum_new/B12_sum_new;

				if(B12_sum_new == 0.0){
					NN = NN + 1;
				}else if (condition > condition_new) {
					NN = 6;
				} else {
					NN = NN +1;
				}
			}
			
			max = Math.abs(new_est - score);
			new_est = score;

			iterations = iterations + 1;

			if(iterations > 100){
				max = 0.0001;
			}
		}
		rtn[0] = score;
		rtn[1] = iterations;
		return rtn;
  	}

  	newton_rhapson(items: Array<Item>, est: number) : Array<number> {

  		var max = 200;
		var L1 = 0.0;
		var L2 = 0.0;
		var B_11 = 0.0;
		var B_12 = 0.0;
		var B_22 = 0.0;
		var B_21 = 0.0;
		var B_231 = 0.0;
		var B_232 = 0.0;
		var B_24 = 0.0;
		var rtn = new Array();
		var score = 0.0;
		var new_est = est;
		var iterations = 0;

		while(max > 0.0001){
			for(var i = 0 ; i < items.length; i++){
	  			var adjustCategory = this.getAdjustedCategory(items[i].Maps, items[i].AnsweredItemResponseOID);
				var itemSlope = parseFloat(items[i].Slope);
				var cumulativeP = this.calculateCumulativeProbability(itemSlope, new_est, items[i].Maps);

				L1 = L1 + this.L1(itemSlope, cumulativeP, adjustCategory);
				L2 = L2 + this.L2(itemSlope, cumulativeP, adjustCategory);
				B_11 = B_11 + this.B_11(itemSlope, cumulativeP, adjustCategory);
				B_12 = B_12 + this.B_12(itemSlope, cumulativeP, adjustCategory);
				B_21 = B_21 + this.B_21(itemSlope, cumulativeP, adjustCategory);
				B_22 = B_22 + this.B_12(itemSlope, cumulativeP, adjustCategory); // same as B_12
				B_231 = B_231 + this.B_11(itemSlope, cumulativeP, adjustCategory); // same as B_11
				B_232 = B_232 + this.B_232(itemSlope, cumulativeP, adjustCategory); // need to multiply by -1.0
				B_24 = B_24 + this.B_24(itemSlope, cumulativeP, adjustCategory);		
			}

			B_24 = 2.0*Math.pow(B_24,2);

			var L1_sum = this.L1_sum(items, new_est);
			var B11_sum = this.B11_sum(items, new_est);
			var B12_sum = this.B12_sum(items, new_est);

			var condition = L1_sum + B11_sum/B12_sum;

			var NN = 0;
			while( NN < 6 ){
				score = new_est - Math.pow(0.5,NN) * (L1 + B_11/B_12)/(L2 + (B_21/B_22 - B_231*B_232/B_24));

				var L1_sum_new = this.L1_sum(items, score);
				var B11_sum_new = this.B11_sum(items, score);
				var B12_sum_new = this.B12_sum(items, score);

				var condition_new = L1_sum_new;

				if(B12_sum_new == 0.0){
					NN = NN + 1;
				}else if (condition > condition_new) {
					NN = 6;
				} else {
					NN = NN +1;
				}
			}
			
			max = Math.abs(new_est - score);
			new_est = score;

			iterations = iterations + 1;

			if(iterations > 100){
				max = 0.0001;
			}
		}
		rtn[0] = score;
		rtn[1] = iterations;
		return rtn;
  	}

  	B_11 (slope: number, cumulativeP: Array<number>, category: number) : number {
  		var t2 = this.secondDerivative(slope, cumulativeP);
  	 	//t = t + (itemslope(i) ^ 3 * (1 - (T0(i, j) + T0(i, j + 1))) * (t2(i, j) - t2(i, j + 1)))

  		return Math.pow(slope,3) * (1.0 - (cumulativeP[category] + cumulativeP[category +1])) * (t2[category] - t2[category +1]);
  	}

  	B11_sum(items: Array<Item>, est: number){

  		var B11 = 0.0;
		for(var i = 0 ; i < items.length; i++){
			var cumulativeP = this.calculateCumulativeProbability(parseFloat(items[i].Slope), est, items[i].Maps);
			var adjustCategory = this.getAdjustedCategory(items[i].Maps, items[i].AnsweredItemResponseOID);

			for(var j =0; j < items[i].Maps.length; j++){
		  		if(items[i].AnsweredItemResponseOID == items[i].Maps[j].ItemResponseOID){
	  				var itemSlope = parseFloat(items[i].Slope);
	  				B11 = B11 + this.B_11(itemSlope, cumulativeP, adjustCategory);
	  			}			
			}
		}

		return B11;
  	}

  	B_12 (slope: number, cumulativeP: Array<number>, category: number) : number {
  		var t1 = this.firstDerivative(cumulativeP);
  		// t = t + (-2) * (itemslope(i) ^ 2 * (T0(i, j) - T0(i, j + 1)) * (t1(i, j) + t1(i, j + 1)))
  		return -2.0 *  Math.pow(slope,2) * (cumulativeP[category] - cumulativeP[category +1]) * (t1[category] + t1[category +1]);
  	}

  	B12_sum(items: Array<Item>, est: number){

  		var B12 = 0.0;
		for(var i = 0 ; i < items.length; i++){
			var cumulativeP = this.calculateCumulativeProbability(parseFloat(items[i].Slope), est, items[i].Maps);
			var adjustCategory = this.getAdjustedCategory(items[i].Maps, items[i].AnsweredItemResponseOID);
			for(var j =0; j < items[i].Maps.length; j++){
		  		if(items[i].AnsweredItemResponseOID == items[i].Maps[j].ItemResponseOID){
	  				var itemSlope = parseFloat(items[i].Slope);
	  				B12 = B12 + this.B_12(itemSlope, cumulativeP, adjustCategory);
	  			}			
			}
		}

		return B12;
  	}

  	B_21 (slope: number, cumulativeP: Array<number>, category: number) : number {

  		var t1 = this.firstDerivative(cumulativeP);
  		var t2 = this.secondDerivative(slope, cumulativeP);
  		var t3 = this.thirdDerivative(slope, cumulativeP);

  		return Math.pow(slope,4) * (t1[category] + t1[category +1]) * (t2[category] - t2[category +1]) + (1.0 - (t1[category] + t1[category +1])) * -1.0 * (t3[category] - t3[category +1]);
  	}

  	B_22 (slope: number, cumulativeP: Array<number>, category: number) : number {
  		var t1 = this.firstDerivative(cumulativeP);
  		// t = t + (-2) * (itemslope(i) ^ 2 * (T0(i, j) - T0(i, j + 1)) * (t1(i, j) + t1(i, j + 1)))
  		return -2.0 *  Math.pow(slope,2) * (cumulativeP[category] + cumulativeP[category +1]) * (t1[category] - t1[category +1]);
  	}

  	B_232 (slope: number, cumulativeP: Array<number>, category: number) : number {
  		var t1 = this.firstDerivative(cumulativeP);
  		var t2 = this.secondDerivative(slope, cumulativeP);

  		return  Math.pow(slope,3) * ((-1.0 *(t1[category] - t1[category+1])) * (t1[category] + t1[category+1]) + (cumulativeP[category] - cumulativeP[category -1]) * -1.0 * (t2[category] + t2[category + 1]));
  	}

  	B_24 (slope: number, cumulativeP: Array<number>, category: number) : number {
  		var t1 = this.firstDerivative(cumulativeP);
  		// t = t + (itemslope(i) ^ 2 * (T0(i, j) - T0(i, j + 1)) * (t1(i, j) + t1(i, j + 1)))
  		return  Math.pow(slope,2) * (cumulativeP[category] - cumulativeP[category + 1]) * (t1[category] + t1[category+1]);
  	}

  	L1 (slope: number, cumulativeP: Array<number>, category: number) : number {
  		return slope * (1.0 - (cumulativeP[category] + cumulativeP[category +1]))
  	}

  	L1_sum(items: Array<Item>, est: number){
  		var L1 = 0.0;
		for(var i = 0 ; i < items.length; i++){
			var cumulativeP = this.calculateCumulativeProbability(parseFloat(items[i].Slope), est, items[i].Maps);
			var adjustCategory = this.getAdjustedCategory(items[i].Maps, items[i].AnsweredItemResponseOID);
			var itemSlope = parseFloat(items[i].Slope);
			L1 = L1 + this.L1(itemSlope, cumulativeP, adjustCategory);
		}
		return L1;
  	}

  	getAdjustedCategory(maps: Array<Map>, ItemResponseOID: string) : number {
		var adjustedCategory = 0;
		for(var j =0; j < maps.length; j++){
	  		if(ItemResponseOID == maps[j].ItemResponseOID){
	  			break;
			}
			if( parseFloat(maps[j].Calibration) != NaN ){
				adjustedCategory = adjustedCategory + 1;
			}
		}
		return adjustedCategory;
  	}

  	L2 (slope: number, cumulativeP: Array<number>, category: number) : number {
  		var t1 = this.firstDerivative(cumulativeP);
  		return Math.pow(slope,2) * (t1[category] + t1[category +1]);
  	}

  	L2_sum(items: Array<Item>, est: number){
  		var L2 = 0.0;
		for(var i = 0 ; i < items.length; i++){
			var itemSlope = parseFloat(items[i].Slope);
			var cumulativeP = this.calculateCumulativeProbability(itemSlope, est, items[i].Maps);
			var adjustCategory = this.getAdjustedCategory(items[i].Maps, items[i].AnsweredItemResponseOID);
			
			L2 = L2 + this.L2(itemSlope, cumulativeP, adjustCategory);
		}
		return L2;
  	}


  	information_sum (items: Array<Item>, est: number) : number {
   		var sum = 0.0;
   		for(var i = 0 ; i < items.length; i++){
   			var slope = parseFloat(items[i].Slope);
   			var cumulativeP = this.calculateCumulativeProbability(slope, est, items[i].Maps);
			for(var k=1; k < cumulativeP.length; k++){
				var term1 = cumulativeP[k -1] * (1.0 - cumulativeP[k -1]);
				var term2 = cumulativeP[k] * (1.0 - cumulativeP[k]); 
				var num = slope * (term1 - term2);
				sum = sum + Math.pow(num,2)/(cumulativeP[k-1] - cumulativeP[k]);
			}
		}
		return sum; 	
  	}


  	calculateNextItem_DEBUG(form: Form) : Item {

  		var initialTheta = 0.0;
  		var information = 0.0;

  		var cumulativeP = new Array();
  		var informationSet = new Array();

  		for(var i=0; i < form.Items.length; i++){
  			
			let Calibrations = form.Items[i].Maps.filter((a) => a.Calibration).sort((a,b) => parseFloat(a.Calibration) - parseFloat(b.Calibration) );
			cumulativeP.push(1.0);
  			for(var j=0; j < Calibrations.length ; j++){
				cumulativeP.push( 1/ ( 1 + Math.pow(Math.E,(parseFloat(form.Items[i].Slope) * (parseFloat(Calibrations[j].Calibration) - initialTheta)))) ) ;
  			}
			cumulativeP.push(0.0);
			information = 0.0;
  			
  			for(var k=1; k < cumulativeP.length; k++){
	  			var ability = parseFloat(form.Items[i].Slope);
	  			var term1 = cumulativeP[k -1] * (1.0 - cumulativeP[k -1]);
	  			var term2 = cumulativeP[k] * (1.0 - cumulativeP[k]); 
	  			var num = ability * (term1 - term2);
	  			information = information + Math.pow(num,2)/(cumulativeP[k-1] - cumulativeP[k]);
			}

  			//console.log("Final information: " + information);

  			if(!form.Items[i].Administered){
  				informationSet.push({'id':i, 'information': information});
  			} // else{ console.log("Item: " + i + " already administered.")}

  			
  			/*
			var runningTotal = 0.0;
			for(var k=0; k < cumulativeP.length; k++){
				if (k == 0){
					console.log("k=" + k + " cumulativeP:  " + cumulativeP[k]);
					//runningTotal = runningTotal + cumulativeP[k];
				} else{
		  			console.log("k=" + k + " cumulativeP:  " + cumulativeP[k] + " probability  " + (cumulativeP[k-1] - cumulativeP[k]));
		  			runningTotal = runningTotal + (cumulativeP[k-1] - cumulativeP[k]);
		  		}
			}
			console.log("Final Total: " + runningTotal);
			*/
		}
		
		informationSet.sort((a,b) => parseFloat(b.information) - parseFloat(a.information) );


		var user = this.store.getState().user;

		for(var x=0; x < user.forms.length; x++ ){
			if( user.forms[x].Domain == form.Domain ){
				user.forms[x].Items[informationSet[0].id].Administered = true;
			}
		}

		this.store.dispatch(CounterActions.create_user(user));

		/*
		for(var i=0 ; i< informationSet.length; i++){
			console.log(i + ":" + informationSet[i].information);
		}
		*/
		return form.Items[informationSet[0].id];
		//return form.Items[0];			
  	}



 	loadForms(user: User): Observable<User>{

		for(var j=0; j < FORMS.length; j++){

		for(var i=0; i < FORMS[j].Items.length; i++){

			if( parseInt(FORMS[j].Items[i].Operator) != 0 && (parseInt(FORMS[j].Items[i].Operator) & user.exlusion_code) == parseInt(FORMS[j].Items[i].Operator) ){
				//console.log(i + " removing: " + FORMS[j].Items[i].Prompt);
				FORMS[j].Items.splice(i,1);

				//console.log("how many items are left in the array:" + FORMS[j].Items.length);
			}
	
		}
		
		}

    	return this.mongodbService.loadForms(user._id, FORMS);

	}

}
