import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { appStoreProviders } from './app.store';

import { ChartsModule } from 'ng2-charts';

import { LoginComponent } from './login/login.component';
import { DemographicsComponent } from './demographics/demographics.component';
import { AssessmentComponent } from './assessment/assessment.component';
import { IntroComponent } from './intro/intro.component';
import { PortalComponent } from './portal/portal.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CatService } from './cat.service';
import { IRTService } from './irt.service';
import { MongoDbService } from './mongo-db.service';
import { AppRoutingModule } from './/app-routing.module';
import { FinishComponent } from './finish/finish.component';
import { ReportComponent } from './report/report.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DemographicsComponent,
    AssessmentComponent,
    IntroComponent,
    PortalComponent,
    DashboardComponent,
    FinishComponent,
    ReportComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ChartsModule,
    AppRoutingModule
    
  ],
  providers: [CatService,IRTService,MongoDbService, appStoreProviders, { provide: 'Window',  useValue: window }],
  bootstrap: [AppComponent]
})
export class AppModule { }
