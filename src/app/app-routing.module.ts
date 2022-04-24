import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { DemographicsComponent } from './demographics/demographics.component';
import { AssessmentComponent } from './assessment/assessment.component';
import { IntroComponent } from './intro/intro.component';
import { PortalComponent } from './portal/portal.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FinishComponent } from './finish/finish.component';
import { ReportComponent } from './report/report.component';
import { UtilityComponent } from './utility/utility.component';
import { QualtricsComponent } from './qualtrics/qualtrics.component';

import { FormsComponent } from './forms/forms.component';

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
  { path: 'finish', component: FinishComponent },
  { path: 'finish/:message', component: FinishComponent },
  { path: 'report/:oid/:sponsor_code', component: ReportComponent },
  { path: 'utility', component: UtilityComponent },
  { path: 'qualtrics', component: QualtricsComponent },

  { path: 'forms', component: FormsComponent }  
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})

export class AppRoutingModule { }
