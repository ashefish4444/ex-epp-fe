import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpClient } from '@angular/common/http';
import {
  IPublicClientApplication,
  PublicClientApplication,
} from '@azure/msal-browser';
import { MSAL_INSTANCE, MsalService } from '@azure/msal-angular';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';

import { AddressViewComponent } from '../Features/Components/employee/address-view/address-view.component';

import { AppComponent } from '../app.component';
import { AuthGuard } from '../../../../../libs/common-services/auth.guard';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { DemoNgZorroAntdModule } from '../ng-zorro-antd.module';
import { EmergencycontactViewComponent } from '../Features/Components/employee/emergencycontact-view/emergencycontact-view.component';
import { EmployeeDetailComponent } from '../Features/Components/employee/employee-detail/employee-detail.component';
import { EmployeeModule } from '../Features/Components/employee/employee.module';
import { EmployeeRoutingModule } from '../Features/Components/employee/employee-routing.module';
import { FamilyDetailViewComponent } from '../Features/Components/employee/family-detail-view/family-detail-view.component';
import { NgModule } from '@angular/core';
import { OrganizationDetailComponent } from '../Features/Components/employee/organization-detail/organization-detail.component';
import { PersonalInfoComponent } from '../Features/Components/employee/personal-info/personal-info.component';
import { RemoteEntryComponent } from './entry.component';
import { RouterModule } from '@angular/router';
import { httpJWTInterceptor } from './../Features/interceptors/httpJWTInterceptor';
import { EmployeeComponent } from '../Features/Components/employee/employee.component';
import { EmployeeApiService } from '@exec-epp/core-services/employees-services';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '5330d43a-fef4-402e-82cc-39fb061f9b97',
      // redirectUri: 'https://www.epp-excellerentsolutions.com/',
      redirectUri: 'http://localhost:4200/',
    },
  });
}
@NgModule({
  declarations: [RemoteEntryComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    DemoNgZorroAntdModule,
    FormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    CommonModule,
    EmployeeRoutingModule,

    RouterModule.forChild([
      {
        path: '',
        component: AppComponent,

        children: [
          {
            path: '',
            component: EmployeeDetailComponent,
          },
          {
            path: 'profile',
            component: EmployeeComponent,
          },

          {
            path: 'employee/add-employee/personal-info',
            component: PersonalInfoComponent,
          },

          {
            path: 'employee/add-employee/personal-address',
            component: AddressViewComponent,
          },

          {
            path: 'employee/add-employee/Organization-Detail',
            component: OrganizationDetailComponent,
          },

          {
            path: 'employee/add-employee/address-view',
            component: AddressViewComponent,
          },
          
          {
            path: 'employee/add-employee/family-detail-view',
            component: FamilyDetailViewComponent,
          },

          {
            path: 'employee/add-employee/emergencycontacts-view',
            component: EmergencycontactViewComponent,
          },

          
         
        ],
      },
    ]),
  ],
  providers: [
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    { provide: NZ_I18N, useValue: en_US },
    { provide: HTTP_INTERCEPTORS, useClass: httpJWTInterceptor, multi: true },
    MsalService,
        { provide: EmployeeApiService, useClass: EmployeeApiService, multi: false }
  ],
})
export class RemoteEntryModule {}
