import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from '../app.component';

import { RemoteEntryComponent } from './entry.component';

@NgModule({
  declarations: [RemoteEntryComponent],
  imports: [
    BrowserModule,
    RouterModule.forChild([
      {
        path: '',
        component: AppComponent,
      },
    ]),
  ],
  providers: [],
})
export class RemoteEntryModule {}
