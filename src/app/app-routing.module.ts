import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { DemographicsComponent } from './demographics/demographics.component';
import { AssessmentComponent } from './assessment/assessment.component';
import { IntroComponent } from './intro/intro.component';
import { PortalComponent } from './portal/portal.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/portal', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboard/:message', component: DashboardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'login/:message', component: LoginComponent },
  { path: 'portal', component: PortalComponent },
  { path: 'portal/:message', component: PortalComponent },
  { path: 'intro', component: IntroComponent },
  { path: 'intro/:id', component: IntroComponent },
  { path: 'demographics', component: DemographicsComponent },
  { path: 'assessment', component: AssessmentComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})

export class AppRoutingModule { }