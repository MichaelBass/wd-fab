import {
  Action,
  ActionCreator
} from 'redux';

import { User } from './user';
import { Admin } from './admin';

export interface SetCurrentUserAction extends Action {
  user: User;
}

export interface SetCurrentAdminAction extends Action {
  admin: Admin;
}

export const CREATE_ADMIN: string = 'CREATE_ADMIN';
export const create_admin: ActionCreator<SetCurrentAdminAction>  = (currentadmin) => ({
  type: CREATE_ADMIN,
  admin: currentadmin
});


export const CREATE_USER: string = 'CREATE_USER';
export const create_user: ActionCreator<SetCurrentUserAction>  = (currentuser) => ({
  type: CREATE_USER,
  user: currentuser
});

export const CLEAR_STATE: string = 'CLEAR_STATE';
export const clear_state: ActionCreator<SetCurrentUserAction>  = (currentuser) => ({
  type: CLEAR_STATE,
  user: currentuser
});