import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';

import { map } from "rxjs/operators";

import { environment } from 'apps/timesheet/src/environments/environment';
import { TimeEntry, Timesheet } from '../../models/timesheetModels';
import { data } from 'autoprefixer';
import { Project } from '../../models/project';
import { Client } from '../../models/client';
import { ThrowStmt } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient,) {
  }

  getTimeSheet(userId: string, date?: Date) {
    let fromDate = new Date();

    if (date) {
      date.setDate(date.getDate() - date.getDay() + 1);
      fromDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0);
    }
    else {
      fromDate.setDate(fromDate.getDate() - fromDate.getDay() + 1);
      fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 3, 0, 0, 0);
    }

    let params = new HttpParams();

    params = params.append("employeeId", userId);
    params = params.append("fromDate", fromDate.toISOString());

    let response = this.http.get<Timesheet[]>(this.baseUrl + "timesheets", { observe: "response", params: params });

    return response.pipe(map(r => r.body));
  }

  addTimesheet(timesheet: any) {
    return this.http.post<any>(this.baseUrl + 'timesheets', timesheet).subscribe({
      next: data => {
        //this.postId = data.id;
        console.log('response---------------');
        console.log(data);
      },
      error: error => {
        //this.errorMessage = error.message;
        console.error('There was an error!', error);
      }
    })
  }

  getTimeEntry(timesheetId: number, date?: Date) {
    let params = new HttpParams();

    params = params.append("timesheetId", timesheetId);

    if (date){
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0);
      params = params.append("date", date.toISOString());
    }

    let response = this.http.get<TimeEntry[]>(this.baseUrl + "timeentrys", { observe: "response", params: params })

    return response.pipe(map(r => r.body));
  }

  addTimeEntry(timeEntry: TimeEntry){
    const headers = {"content-type": "application/json"};

    return this.http.post<any>(this.baseUrl + "timeentrys", timeEntry, {"headers": headers});
  }

  updateTimeEntry(timeEntry: TimeEntry) {
    const headers = {"content-type": "application/json"};

    return this.http.put<any>(this.baseUrl + "timeentrys", timeEntry, {"headers": headers});
  }

  //#region client and poject from mock server

  getClients(clientIds?: number[]){
    if(clientIds){
      let params = new HttpParams();

      for(const index in clientIds){
        params = params.append("id", clientIds[index]);
      }

      let response = this.http.get<Client[]>(this.baseUrl + "clients", { observe: "response", params: params});

      return response.pipe(map(r => r.body));
    }
    else {
      return this.http.get<Client[]>(this.baseUrl + "clients");
    }
  }
  
  getClient(clientId: number){
    let params = new HttpParams();

    params = params.append("id", clientId);

    let response = this.http.get<Client[]>(this.baseUrl + "clients", { observe: "response", params: params});

    return response.pipe(map(r => r.body));
  }

  getProjects(userId: string) {
    let params = new HttpParams();

    params = params.append("employeeId", userId);

    let response = this.http.get<Project[]>(this.baseUrl + "projects", { observe: "response", params: params});
    
    return response.pipe(map(r => r.body));
  }

  getProject(projectId: number) {
    let params = new HttpParams();
    
    params = params.append("id", projectId);

    let response = this.http.get<Project[]>(this.baseUrl + "projects", { observe: "response", params: params});

    return response.pipe(map(r => r.body));
  }

  //#endregion

}
