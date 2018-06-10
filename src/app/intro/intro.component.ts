import { Component, OnInit, Inject } from '@angular/core';
import { User } from '../user';

import { Store } from 'redux';
import { AppStore } from '../app.store';
import { AppState } from '../app.state';


@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['../app.component.css','./intro.component.css']
})
export class IntroComponent implements OnInit {

	user: User;

  constructor(@Inject(AppStore) private store: Store<AppState>) {
    store.subscribe(() => this.readState()); 
  }

  readState() {
    const state: AppState = this.store.getState() as AppState;
    this.user = state.user;
  }

  ngOnInit() {
  	this.readState();
  }

}
