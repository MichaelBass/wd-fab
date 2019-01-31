import { Component, OnInit, Inject } from '@angular/core';

import {ActivatedRoute} from "@angular/router";
import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';
import * as CounterActions from '../counter.actions';


@Component({
  selector: 'app-finish',
  templateUrl: './finish.component.html',
  styleUrls: ['./finish.component.css']
})
export class FinishComponent implements OnInit {
 
 	message: string;

  constructor(@Inject(AppStore) private store: Store<AppState>, private route: ActivatedRoute) { }

  ngOnInit() {

    this.route.params.subscribe(params => {
      this.message = params['message'];
    });

  	this.store.dispatch(CounterActions.clear_state());
  }

}
