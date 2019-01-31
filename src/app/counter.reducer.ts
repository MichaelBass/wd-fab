/**
 * Counter Reducer
 */
import { Reducer, Action } from 'redux';
import { AppState } from './app.state';
import { User } from './user';
import { Admin } from './admin';
import { Demographic } from './demographic';

import {
  CREATE_USER,
  CREATE_ADMIN,
  CLEAR_STATE,
  SetCurrentUserAction,
  SetCurrentAdminAction
} from './counter.actions';

const initialDemo: Demographic = {gender: -1,race: 0,other:'',age:null,walking:-1,wc:-1,drive:-1,public_transportation:-1};
const initialState: AppState = { user: {oid: '0',study_code: '', password: '', sponsor_code:'', demo:initialDemo, forms:[],exlusion_code: -1, assessments:[], results:[], responses:[], message: ''}, admin:{"_id":"0","username":"","password":"","sponsor_code":"","message":""}};

// Create our reducer that will handle changes to the state
export const counterReducer: Reducer<AppState> =
  (state: AppState = initialState, action: Action): AppState => {
    switch (action.type) {

    case CREATE_ADMIN:
      const currentAdmin: Admin = (<SetCurrentAdminAction>action).admin;
      return {user: initialState.user, admin: currentAdmin};

    case CREATE_USER:
      const currentUser: User = (<SetCurrentUserAction>action).user;
      return {user: currentUser, admin:initialState.admin};

    case CLEAR_STATE:
      return initialState;

    default:
      return state;
    }
  };