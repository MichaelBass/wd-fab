import { Demographic } from './demographic';
import { Assessment } from './assessment';
import { Form } from './form';
import { Result } from './result';
import { Response } from './response';
import { KVObject } from './kvobject';

export class User {
	_id?:string;
  	oid: string;
  	study_code: string;
    password: string;
  	sponsor_code: string;
  	__v?: number;
  	demo?: Demographic;
  	assessments?:Array<Assessment>;
  	exlusion_code?: number;
  	forms?:Array<Form>;
    results:Array<Result>;
    responses:Array<Response>;    
  	message:string;
    params?:Array<KVObject>;
}