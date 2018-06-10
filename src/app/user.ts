import { Demographic } from './demographic';
import { Assessment } from './assessment';
import { Form } from './form';
import { Result } from './result';
export class User {
	_id?:string;
  	oid: string;
  	study_code: string;
  	sponsor_code: string;
  	__v?: number;
  	demo?: Demographic;
  	assessments?:Array<Assessment>;
  	exlusion_code?: number;
  	forms?:Array<Form>;
    results:Array<Result>;
  	message:string;
}