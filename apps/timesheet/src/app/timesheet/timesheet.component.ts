import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { TimesheetService } from './services/timesheet.service';
import { DayAndDateService } from "./services/day-and-date.service";
import { ClickEventType } from '../models/clickEventType';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TimeEntry, Timesheet } from '../models/timesheetModels';
import { TimeEntryEvent } from '../models/clickEventEmitObjectType';
import { Client } from '../models/client';
import { Project } from '../models/project';
import { delay } from 'rxjs/operators';

@Component({
  selector: 'exec-epp-app-timesheet',
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.scss']
})
export class TimesheetComponent implements OnInit {
  clickEventType = ClickEventType.none;
  drawerVisible = false;
  validateForm!: FormGroup;

  timesheet: Timesheet | null = null;
  timeEntry: TimeEntry | null = null;

  clients: Client[] | null = null;
  projects: Project[] | null = null;

  formData = {
    fromDate: new Date(),
    toDate: new Date(),
    client: '',
    project: '',
    hours: '',
    note: '',
  };

  date = new Date();
  public weekDays: any[] = [];
  curr = new Date;
  firstday1: any;
  lastday1: any;
  parentCount = null;
  nextWeeks = null;
  lastWeeks = null;


  constructor(
    private fb: FormBuilder,
    private timesheetService: TimesheetService,
    private notification: NzNotificationService,
    private dayAndDateService: DayAndDateService
  ) {
  }

  ngOnInit(): void {
    let userId = localStorage.getItem("userId");

    if (userId) {
      this.timesheetService.getTimeSheet(userId).subscribe(response => {
        this.timesheet = response ? response[0] : null;
      })

      this.timesheetService.getClients().subscribe(response => this.clients = response);

      this.timesheetService.getProjects(userId).subscribe(response => this.projects = response);
    }

    this.validateForm = this.fb.group({
      fromDate: [null, [Validators.required]],
      toDate: [null],
      client: [null, [Validators.required]],
      project: [null, [Validators.required]],
      hours: [null, [Validators.required]],
      note: [null, [Validators.required]],
    });

    this.weekDays = this.dayAndDateService.weekByDate(this.curr);
  }

  selectedDate(count: any) {
    this.parentCount = count;
    if (count != null) {
      this.weekDays = this.dayAndDateService.weekByDate(count);
    } else {
      window.location.reload();
    }
  }

  selectedDateCanceled(curr: any) {
    if (curr != null) {
      this.weekDays = this.dayAndDateService.weekByDate(curr);
    } else {
      window.location.reload();
    }
  }

  nextWeek(count: any) {
    this.nextWeeks = count;
    console.log(this.nextWeeks);
    let ss = this.dayAndDateService.getWeekend();
    this.weekDays = this.dayAndDateService.nextWeekDates(ss, count);
  }

  lastastWeek(count: any) {
    this.lastWeeks = count;
    console.log(this.lastWeeks);
    let ss = this.dayAndDateService.getWeekendFirstDay();
    this.weekDays = this.dayAndDateService.lastWeekDates(ss, count);
  }

  onDateColumnClicked(clickEventType: ClickEventType) {
    this.clickEventType = clickEventType;
    this.showFormDrawer();
  }

  onProjectNamePaletClicked(timeEntryEvent: TimeEntryEvent) {
    this.clickEventType = timeEntryEvent.clickEventType;
    this.timeEntry = timeEntryEvent.timeEntry;
    this.showFormDrawer();
  }

  onEditButtonClicked(clickEventType: ClickEventType) {
    this.clickEventType = clickEventType;
    this.showFormDrawer();
  }

  showFormDrawer() {
    if (this.clickEventType == ClickEventType.showFormDrawer) {
      if (this.timeEntry) {
        let clientId = this.projects?.filter(project => project.id == this.timeEntry?.projectId)[0].clientId.toString();
        this.formData.client = clientId ? clientId : "";
        this.formData.project = this.timeEntry.projectId.toString();
        this.formData.hours = this.timeEntry.hours.toString();
        this.formData.note = this.timeEntry.note;

        this.timeEntry = null;
      }

      this.drawerVisible = true;
    }

    this.clickEventType = ClickEventType.none;
  }

  submitForm(): void {
    for (const i in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(i)) {
        this.validateForm.controls[i].markAsDirty();
        this.validateForm.controls[i].updateValueAndValidity();
      }
    }

    try {
      let dataToSend = {
        fromDate: this.validateForm.value.fromDate != null ? this.validateForm.value.fromDate.toISOString().substring(0, 10) : null,
        toDate: this.validateForm.value.toDate != null ? this.validateForm.value.toDate.toISOString().substring(0, 10) : null,
        client: this.validateForm.value.client,
        project: this.validateForm.value.project,
        hours: this.validateForm.value.hours,
        note: this.validateForm.value.note,
      };

      console.log('sssssssssssssssssssss');
      console.log(dataToSend);
      // this.timesheetService.addTimesheet(dataToSend);
      //this.createNotification('success');

      this.validateForm.reset();
      this.closeFormDrawer();

    } catch (err) {
      console.error(err);
    }
  }

  closeFormDrawer(): void {
    this.validateForm.reset();
    this.drawerVisible = false;
  }

  resetForm(e: MouseEvent): void {
    e.preventDefault();
    this.validateForm.reset();
  }

  createNotification(type: string): void {
    this.notification.create(
      type,
      'Timesheet',
      'Your Timesheet Added Successfully.'
    );
  }
}
