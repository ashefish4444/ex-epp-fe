import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { DemoNgZorroAntdModule } from './../../../../libs/ng-zoro/ng-zorro-antd.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './components/header/header.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { RemoteEntryModule } from './remote-entry/entry.module';
import { SiderComponent } from './components/application/sider/sider.component';
import { PermissionComponent } from './features/components/permission/permission.component';
import { GroupsetComponent } from './features/components/groupset/groupset.component';
import { GroupDetailComponent } from './features/components/group-detail/group-detail.component';
import { AddUserComponent } from './features/components/user/add-user/add-user.component';
import { UserToGroupComponent } from './features/components/user/user-to-group/user-to-group.component';
import en from '@angular/common/locales/en';
import { registerLocaleData } from '@angular/common';
import { UserdetailsComponent } from './features/components/userdetails/userdetails.component';
import { httpJWTInterceptor } from './services/interceptors/httpJWTInterceptor';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { environment } from './../environments/environment';
import { SharedModule } from './shared/modules/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChangepasswordComponent } from './features/Account/changepassword/changepassword.component';
import { RouterModule } from '@angular/router';
import { CustomFormModule } from './shared/modules/forms/custom-form.module';
import { ForgotPasswordComponent } from './features/Account/forgotpassword/forgotpassword.component';
import { ResetpasswordComponent } from './features/Account/resetpassword/resetpassword.component';

registerLocaleData(en);

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: `${environment.clientId}`,
      redirectUri:`${environment.redirectUri}`
    },
  });
}
@NgModule({
  declarations: [
    AppComponent,
    //EppdashboardComponent,
    HeaderComponent,
    SiderComponent,
    //SigninComponent,
    PermissionComponent,
    //UserDashboardComponent,
    GroupsetComponent,
    GroupDetailComponent,
    AddUserComponent,
    UserToGroupComponent,
    UserdetailsComponent,
    //LoginComponent,
    ChangepasswordComponent,
    ForgotPasswordComponent,
    ResetpasswordComponent
  ],
  imports: [
    BrowserModule,
    CustomFormModule,
    FormsModule,
    HttpClientModule,
    //BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    DemoNgZorroAntdModule,
    RemoteEntryModule, 
    SharedModule,
    //MsalModule,
    BrowserAnimationsModule,
    //UserManagementModule,
    RouterModule.forRoot([

    ], { initialNavigation: 'enabledBlocking' }),
  ],
  providers   : [
    { provide: NZ_I18N, useValue: en_US }, 
    { provide: HTTP_INTERCEPTORS, useClass: httpJWTInterceptor, multi: true },
    //{provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory},
     
  ],
 
  bootstrap: [AppComponent],
})
export class AppModule {}
