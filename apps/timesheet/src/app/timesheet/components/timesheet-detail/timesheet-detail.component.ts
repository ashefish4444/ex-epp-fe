import {
  ApprovalStatus,
  StartOfWeek,
  TimeEntry,
  Timesheet,
  TimesheetApproval,
  TimesheetConfiguration,
} from '../../../models/timesheetModels';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  DateColumnEvent,
  TimeEntryEvent,
} from '../../../models/clickEventEmitObjectType';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  NzNotificationPlacement,
  NzNotificationService,
} from 'ng-zorro-antd/notification';

import { ClickEventType } from '../../../models/clickEventType';
import { Client } from '../../../models/client';
import { ClientAndProjectStateService } from '../../state/client-and-projects-state.service';
import { DayAndDateService } from '../../services/day-and-date.service';
import { Employee } from '../../../models/employee';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
import {
  Observable, Subscription,
} from 'rxjs';
import { PermissionListService } from './../../../../../../../libs/common-services/permission.service';
import { Project } from '../../../models/project';
import { TimeEntryFormData } from '../../../models/timeEntryFormData';
import { TimesheetConfigurationStateService } from '../../state/timesheet-configuration-state.service';
import { TimesheetService } from '../../services/timesheet.service';
import { TimesheetStateService } from '../../state/timesheet-state.service';
import { TimesheetValidationService } from '../../services/timesheet-validation.service';
import { differenceInCalendarDays } from 'date-fns';
import { LoadingStateService } from '../../state/loading-state.service';
import { formatDate } from '@angular/common';

export const startingDateCriteria = {} as {
  isBeforeThreeWeeks: boolean;
  startingDate: Date;
};

@Component({
  selector: 'exec-epp-timesheet-detail',
  templateUrl: './timesheet-detail.component.html',
  styleUrls: ['./timesheet-detail.component.scss'],
})
export class TimesheetDetailComponent implements OnInit, OnDestroy {
  userId = "";
  clickEventType = ClickEventType.none;
  drawerVisible = false;
  invalidTimeEntriesModalVisible = false;
  addTimeEntryModalVisible = false;
  validateForm!: FormGroup;

  modalTitle = "";
  modalMessages: string[] = []

  // Used for disabling client and project list when selected for edit.
  disableFromDate = false;
  disableToDate = false;
  disableClient = false;
  disableProject = false;
  timesheetConfig: TimesheetConfiguration = this.timesheetConfigurationStateService.defaultTimesheetConfig;
  timesheetConfig$: Observable<TimesheetConfiguration> = new Observable();
  timesheet: Timesheet | null = null;
  timesheet$: Observable<Timesheet | null> = new Observable();
  timeEntries: TimeEntry[] | null = null;
  timeEntries$: Observable<TimeEntry[] | null> = new Observable();
  timesheetApprovals: TimesheetApproval[] | null = [];
  timesheetApproval: TimesheetApproval | null = null;
  timesheetReview: TimeEntry[] | null = [];
  timesheetApprovals$: Observable<TimesheetApproval[] | null> = new Observable();
  timesheetApproved = false;

  timeEntry: TimeEntry | null = null;
  newTimeEntry: TimeEntry | null = null;
  weeklyTotalHours = 0;

  invalidEntries: { Date: Date; Message: string }[] = [];

  clients: Client[] = [];
  projects: Project[] = [];

  formData: TimeEntryFormData = {
    fromDate: new Date(),
    toDate: new Date(),
    client: '',
    project: '',
    hours: null,
    note: '',
  };

  dateColumnContainerClass = '';
  dateColumnTotalHour = 0;
  maxDateColumnTotalHour = 24;
  date: Date;
  firstday1: Date;
  lastday1: Date;
  futereDate: any;
  public weekDays: any[] = [];
  parentCount = null;
  nextWeeks = null;
  lastWeeks = null;
  timesheetId: string | undefined;
  startValue: Date | null = null;
  endValue: Date | null = null;
  isSubmitted = false;
  @ViewChild('endDatePicker') endDatePicker!: NzDatePickerComponent;
  endValue1 = new Date();
  startingDateCriteria = startingDateCriteria;
  isToday = true;
  $clients: Observable<Client[]>
  $projects: Observable<Project[]>
  $selectedClient: Observable<string | null>
  $selectedProject: Observable<string | null>
  $disableClient: Observable<boolean>
  $disableProject: Observable<boolean>
  $disableDates: Observable<boolean>

  loading$: Observable<number>;
  loadingSubscription = new Subscription();
  leaveforbiden = false;
  disabledDate = (current: Date): boolean =>
    // Can not select days before today and today
    differenceInCalendarDays(current, this.date) > 0;

  constructor(
    private fb: FormBuilder,
    private timesheetService: TimesheetService,
    private notification: NzNotificationService,
    private dayAndDateService: DayAndDateService,
    private timesheetValidationService: TimesheetValidationService,
    private timesheetConfigurationStateService: TimesheetConfigurationStateService,
    private timesheetStateService: TimesheetStateService,
    private readonly _clientAndProjectStateService: ClientAndProjectStateService,
    private readonly _permissionService: PermissionListService,
    private loadingStateService: LoadingStateService
  ) {
    this.timesheetStateService.setTimesheetPageTitle("Manage my Timesheet");

    this.date = this.timesheetStateService.date;
    this.firstday1 = this.dayAndDateService.getWeeksFirstDate(this.date);
    this.lastday1 = this.dayAndDateService.getWeeksLastDate(this.date);

    this.$clients = this._clientAndProjectStateService.$clients;
    this.$projects = this._clientAndProjectStateService.$projects;
    this.$selectedClient = this._clientAndProjectStateService.$selectedClient;
    this.$selectedProject = this._clientAndProjectStateService.$selectedProject;
    this.$disableClient = this._clientAndProjectStateService.$disableClient;
    this.$disableProject = this._clientAndProjectStateService.$disableProject;
    this.$disableDates = this._clientAndProjectStateService.$disableDate;
    this.loading$ = this.loadingStateService.loading$;
  }

  ngOnInit(): void {
    this.timesheetStateService.setApproval(false);
    this.userId = localStorage.getItem('userId') ?? "";
    this.timesheetConfig$ = this.timesheetConfigurationStateService.timesheetConfiguration$;

    this.timesheet$ = this.timesheetStateService.timesheet$;
    this.timeEntries$ = this.timesheetStateService.timeEntries$;
    this.timesheetApprovals$ = this.timesheetStateService.timesheetApprovals$;


    this.timesheetConfig$.subscribe((tsc) => {
      this.timesheetConfig = tsc ?? this.timesheetConfigurationStateService.defaultTimesheetConfig;
      this.startingWeek(this.timesheetConfig.StartOfWeeks);
      this.maxDateColumnTotalHour = this.timesheetConfig.WorkingHours.Max;
    });
    this.timesheet$.subscribe((ts) => (this.timesheet = ts ?? null));
    this.timeEntries$.subscribe((te) => (this.timeEntries = te ?? null));
    this.timesheetApprovals$.subscribe(
      (tsa) => {
        this.timesheetApprovals = tsa ?? null;

        if (this.timesheetApprovals && this.timesheetApprovals.length > 0) {
          this.dateColumnContainerClass = "";
        }
      }
    );

    if (this.userId) {
      this.timesheetStateService.getTimesheet(this.userId);
    }

    this.calculateWeeklyTotalHours();

    this.validateForm = this.fb.group({
      fromDate: [null, [Validators.required]],
      toDate: [null],
      client: [null, [Validators.required]],
      project: [null, [Validators.required]],
      hours: [null, [Validators.required]],
      note: [null, [Validators.required]],
    });

    this.calcualteNoOfDaysBetweenDates();

    this.loadingSubscription = this.loading$.subscribe(res => {
      if (res == 0 && !this.drawerVisible) {
        this.checkForCurrentWeek();
      }
    })

    this.loadingSubscription.add(
      this.$clients.subscribe(response => {
        this.clients = response;
      })
    );

    this.loadingSubscription.add(
      this.$projects.subscribe(response => {
        this.projects = response;
      })
    )
    this.valueChangeInputleave();
  }

  ngOnDestroy(): void {
    this.loadingSubscription.unsubscribe();
  }

  initializeClient() {
    this.$selectedClient.subscribe(clientId => {
      this.formData.client = clientId;
    }).unsubscribe();
  }

  initializeProject() {
    this.$selectedProject.subscribe(projectId => {
      this.formData.project = projectId;
    }).unsubscribe();
  }

  onClientChange(event: string) {
    if (this._clientAndProjectStateService.Client !== event) {
      this._clientAndProjectStateService.Client = event;
      this.initializeClient();
    }
  }

  onProjectChange(event: string) {
    if (this._clientAndProjectStateService.Project !== event) {
      this._clientAndProjectStateService.Project = event;
      this.initializeProject();
      this.initializeClient();
    }
  }

  setFirstDay(startOfWeeks: StartOfWeek[]) {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    let dayOfWeek = daysOfWeek.indexOf(startOfWeeks[0].DayOfWeek)
    if (dayOfWeek === -1) {
      dayOfWeek = 1;
    }

    return dayOfWeek;
  }

  startingWeek(startOfWeeks: StartOfWeek[]) {
    const date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());

    this.dayAndDateService.fs = this.setFirstDay(startOfWeeks);
    this.weekDays = this.dayAndDateService.getWeekByDate(date);
    this.firstday1 = this.dayAndDateService.getWeekendFirstDay();
    this.lastday1 = this.dayAndDateService.getWeekendLastDay();

    this.timesheetValidationService.fromDate = this.firstday1;
    this.timesheetValidationService.toDate = this.lastday1;

    this.checkTimeOverThreeWeeks(this.firstday1);
  }

  nextWeek(count: any) {
    this.timesheetConfig$.subscribe(tsc => {
      this.timesheetConfig = tsc ?? {
        StartOfWeeks: [{ DayOfWeek: "Monday", EffectiveDate: new Date(0) }],
        WorkingDays: [],
        WorkingHours: { Min: 0, Max: 24 }
      }
      this.date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate() + 7);
      const date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());

      this.dayAndDateService.fs = this.setFirstDay(this.timesheetConfig.StartOfWeeks);
      this.weekDays = this.dayAndDateService.getWeekByDate(date);
      this.firstday1 = this.dayAndDateService.getWeekendFirstDay();
      this.lastday1 = this.dayAndDateService.getWeekendLastDay();

      this.timesheetValidationService.fromDate = this.firstday1;
      this.timesheetValidationService.toDate = this.lastday1;

      if (this.userId) {
        this.timesheetStateService.getTimesheet(this.userId, this.weekDays[0]);
      }

      this.checkTimeOverThreeWeeks(this.firstday1);

    });
  }

  lastastWeek(count: any) {
    this.timesheetConfig$.subscribe(tsc => {
      this.timesheetConfig = tsc ?? {
        StartOfWeeks: [{ DayOfWeek: "Monday", EffectiveDate: new Date(0) }],
        WorkingDays: [],
        WorkingHours: { Min: 0, Max: 24 }
      }

      this.date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate() - 7);
      this.isToday = false;
      const date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());

      this.dayAndDateService.fs = this.setFirstDay(this.timesheetConfig.StartOfWeeks);
      this.weekDays = this.dayAndDateService.getWeekByDate(date);
      this.firstday1 = this.dayAndDateService.getWeekendFirstDay();
      this.lastday1 = this.dayAndDateService.getWeekendLastDay();

      this.timesheetValidationService.fromDate = this.firstday1;
      this.timesheetValidationService.toDate = this.lastday1;

      if (this.userId) {
        this.timesheetStateService.getTimesheet(this.userId, this.weekDays[0]);
      }

      this.checkTimeOverThreeWeeks(this.firstday1);
    });
  }

  // To calculate the time difference of two dates
  calcualteNoOfDaysBetweenDates() {
    const date1 = new Date('06/21/2019');
    const date2 = new Date('07/30/2019');
    const Difference_In_Time = date2.getTime() - date1.getTime();

    // To calculate the no. of days between two dates
    const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
  }

  checkTimeOverThreeWeeks(date: Date): void {
    const nowDate: Date = this.dayAndDateService.getWeeksFirstDate(new Date());
    const projectDate: Date = date;
    startingDateCriteria.startingDate = projectDate;
    const threeWeeksinMillisecond = 3 * 7 * 24 * 3600 * 1000;
    startingDateCriteria.isBeforeThreeWeeks =
      nowDate.getTime() - projectDate.getTime() > threeWeeksinMillisecond
        ? true
        : false;
  }

  disabledDate1 = (current: Date): boolean =>
    // Can not select days before today and today
    differenceInCalendarDays(current, this.date) > 0;

  disabledStartDate = (startValue: Date): boolean => {
    if (!startValue || !this.endValue) {
      return false;
    }
    return startValue.getTime() < this.endValue1.getTime();
  };

  disabledEndDate = (endValue: Date): boolean => {
    if (!endValue || !this.startValue) {
      return false;
    }
    return endValue.getTime() <= this.startValue.getTime();
  };

  selectedDate(date: Date) {
    this.timesheetConfig$.subscribe(tsc => {
      this.timesheetConfig = tsc ?? {
        StartOfWeeks: [{ DayOfWeek: "Monday", EffectiveDate: new Date(0) }],
        WorkingDays: [],
        WorkingHours: { Min: 0, Max: 24 }
      }

      this.date = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      this.dayAndDateService.fs = this.setFirstDay(this.timesheetConfig.StartOfWeeks);
      this.weekDays = this.dayAndDateService.getWeekByDate(date);
      this.firstday1 = this.dayAndDateService.getWeekendFirstDay();
      this.lastday1 = this.dayAndDateService.getWeekendLastDay();

      this.timesheetValidationService.fromDate = this.firstday1;
      this.timesheetValidationService.toDate = this.lastday1;

      if (this.userId) {
        this.timesheetStateService.getTimesheet(this.userId, this.weekDays[0]);
      }

      this.checkTimeOverThreeWeeks(this.firstday1);
    });
  }

  selectedDateCanceled(curr: any) {
    if (curr != null) {
      this.weekDays = this.dayAndDateService.getWeekByDate(curr);
      this.firstday1 = this.dayAndDateService.getWeekendFirstDay();
      this.lastday1 = this.dayAndDateService.getWeekendLastDay();
    }
  }

  /* checkForCurrentWeek()
   * check if the displayed week is the current week
   * check if all working days have time entry
   * check if all working days have minimum hour
   */
  checkForCurrentWeek(): void {
    let date = new Date();
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (this.dayAndDateService.getWeeksFirstDate(new Date()).getTime() - this.firstday1.getTime() < 7 * 24 * 3600000) {
      this.isToday = true;
    }
    else {
      this.isToday = false;
    }

    if (this.timesheetApprovals && this.timesheetApprovals.length > 0) {
      this.dateColumnContainerClass = "";
    }
    else if ((this.lastday1.valueOf() >= date.valueOf()) || this.startingDateCriteria.isBeforeThreeWeeks) {
      this.dateColumnContainerClass = "";
    }
    else {
      this.dateColumnContainerClass = "date-column-container";

      if (this.timeEntries && this.timeEntries.length > 0 && this.timesheetValidationService.isValidForApproval(this.timeEntries, this.timesheetConfig)) {
        this.createNotification("warning", "Timesheet hase not been submitted", "bottomRight");
      } else {
        this.createNotification("warning", "Timesheet has not been filled", "bottomRight");
      }
    }
  }

  calculateWeeklyTotalHours() {
    if (this.timeEntries) {

      this.weeklyTotalHours = this.timeEntries
        ?.map((timeEntry) => timeEntry.Hour)
        .reduce((prev, next) => prev + next, 0);

    } else {
      this.weeklyTotalHours = 0;
    }
  }

  onDateColumnClicked(dateColumnEvent: DateColumnEvent, date: Date) {
    this.clickEventType = dateColumnEvent.clickEventType;
    this.timeEntry = null;
    this.date = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0
    );
    this.setDateColumnTotalHour();

    if (this.date > new Date()) {
      this.createNotification(
        'error',
        "Can't fill timesheet for the future.",
        'bottomRight'
      );
      return;
    }

    if (this.dateColumnTotalHour < this.maxDateColumnTotalHour) {
      this.scrollPageToTop();
      this.checkForApproalAndShowFormDrawer();
    } else {
      this.createNotification(
        'error',
        `Day is already filled up to ${this.maxDateColumnTotalHour} hours`,
        'bottomRight'
      );
    }
  }

  scrollPageToTop() {
    window.scroll({
      top: 0,
      left: 0,
      // behavior: 'smooth'
    });
  }

  onProjectNamePaletClicked(timeEntryEvent: TimeEntryEvent, date: Date) {
    this.clickEventType = timeEntryEvent.clickEventType;
    this.timeEntry = timeEntryEvent.timeEntry;
    this.date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    this.setDateColumnTotalHour();

    this.checkForApproalAndShowFormDrawer();
  }

  onPaletEllipsisClicked(timeEntryEvent: TimeEntryEvent, date: Date) {
    this.clickEventType = timeEntryEvent.clickEventType;
    this.timeEntry = timeEntryEvent.timeEntry;
    this.date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    this.setDateColumnTotalHour();
  }

  onEditButtonClicked(clickEventType: ClickEventType, date: Date) {
    this.clickEventType = clickEventType;
    this.date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    this.checkForApproalAndShowFormDrawer();
  }

  onDeleteButtonClicked(clickEvenetType: ClickEventType, date: Date) {
    this.clickEventType = clickEvenetType;

    if (this.userId) {
      this.timesheetStateService.getTimesheet(this.userId, date);
    }
  }

  checkForApproalAndShowFormDrawer() {
    if (!this.timesheet) {
      this.showFormDrawer();
      return;
    }

    this.timesheetService
      .getTimeSheetApproval(this.timesheet?.Guid)
      .subscribe((objApprove) => {
        this.timesheetApprovals = objApprove ? objApprove : null;
        if (!this.timesheetApprovals || this.timesheetApprovals.length === 0) {
          this.showFormDrawer();
          return;
        }

        const timesheetApproval = this.timesheetApprovals.filter(
          (tsa) => tsa.ProjectId === this.timeEntry?.ProjectId
        );

        if (
          timesheetApproval.length > 0 &&
          timesheetApproval[0].Status === Object.values(ApprovalStatus)[1].valueOf()
        ) {
          this.timesheetApproved = true;
          this.validateForm.disable();
          this.showFormDrawer();
        } else {
          this.timesheetApproved = false;
          this.validateForm.enable();
          this.showFormDrawer();
        }
      });

  }

  showFormDrawer() {
    if (this.clickEventType === ClickEventType.showFormDrawer) {
      if (this.timeEntry) {
        this._clientAndProjectStateService.Project = this.timeEntry?.ProjectId;
        this._clientAndProjectStateService.disable();

        this.formData.hours = this.timeEntry.Hour;
        this.formData.note = this.timeEntry.Note;

        this.disableFromDate = true;
        this.disableToDate = true;
        this.disableClient = true;
        this.disableProject = true;

        this.timesheetApproval = this.timesheetApprovals?.filter(tsa => tsa.ProjectId === this.timeEntry?.ProjectId)[0] ?? null;
      }

      this.initializeClient();
      this.initializeProject();

      this.formData.fromDate = this.date;
      this.formData.toDate = this.date;

      this.checkLeaveForLeaveInputOfADay();

      this.drawerVisible = true;
    }

    this.clickEventType = ClickEventType.none;
  }

  setDefaultClient(clients: Client[] | null) {
    if (!clients || (this.formData.client && this.formData.client != '')) {
      return;
    }

    clients.length === 1
      ? (this.formData.client = clients[0].id.toString())
      : (this.formData.client = '');
  }

  setDefaultProject(projects: Project[] | null) {
    if (!projects || (this.formData.project && this.formData.project != '')) {
      return;
    }

    projects.length === 1
      ? (this.formData.project = projects[0].id.toString())
      : (this.formData.project = '');
  }

  submitForm(): void {
    this.invalidEntries = [];

    for (const i in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(i)) {
        this.validateForm.controls[i].markAsDirty();
        this.validateForm.controls[i].updateValueAndValidity();
      }
    }

    try {
      const timeEntry: TimeEntry = {
        Guid: '00000000-0000-0000-0000-000000000000',
        Note: this.validateForm.value.note ?? "",
        Date: new Date(
          this.date.getFullYear(),
          this.date.getMonth(),
          this.date.getDate()
        ),
        Index: 1,
        Hour: this.validateForm.controls.hours.value,
        ProjectId: this.validateForm.value.project,
        TimeSheetId: '00000000-0000-0000-0000-000000000000',
      };

      if (this.formData.fromDate === this.formData.toDate) {
        this.addTimeEnteryForOneDay(timeEntry);
      } else {
        this.addTimeEntryForDateRange(timeEntry);
      }
    } catch (err) {
      console.error(err);
    }
  }

  addTimeEnteryForOneDay(timeEntry: TimeEntry) {
    if (this.timeEntry) {
      timeEntry.Guid = this.timeEntry.Guid;
      timeEntry.TimeSheetId = this.timeEntry.TimeSheetId;

      this.updateTimeEntry(timeEntry);
    } else if (this.timesheet) {
      timeEntry.TimeSheetId = this.timesheet.Guid;

      this.timesheetService
        .getTimeEntries(this.timesheet.Guid, this.date, timeEntry.ProjectId)
        .subscribe((response) => {
          this.timeEntry = response ? response[0] : null;

          if (this.timeEntry) {
            timeEntry.Guid = this.timeEntry.Guid;
            timeEntry.Hour = this.timeEntry.Hour + timeEntry.Hour;
            timeEntry.Note = this.timeEntry.Note === "" ? timeEntry.Note : this.timeEntry.Note + '\n' + timeEntry.Note;

            this.updateTimeEntry(timeEntry);

            this.timeEntry = null;
          } else {
            this.checkProjectDateBeforeAddTimeEntry(timeEntry);
          }
        });

    } else {
      this.checkProjectDateBeforeAddTimeEntry(timeEntry);
    }
    this.validateForm.reset();
  }

  addTimeEntryForDateRange(timeEntry: TimeEntry) {
    if (!this.formData.fromDate || !this.formData.toDate) {
      return;
    }

    const timeEntries: TimeEntry[] = [];
    let tmpTimeEntry: TimeEntry | null;
    let dates = this.dayAndDateService.getRangeOfDates(
      this.formData.fromDate,
      this.formData.toDate
    );

    if (this.timesheet) {
      let checkedLeaveDates: Date[] = [];
      for (const date of dates) {
        if (!this.isThereLeaveOnADay(date))
          checkedLeaveDates = [...checkedLeaveDates, date]
      }
      dates = [...checkedLeaveDates];
      for (let i = 0; i < dates.length; i++) {
        timeEntry.Date = new Date(dates[i]);
        timeEntry.TimeSheetId = this.timesheet.Guid;
        tmpTimeEntry =
          this.timeEntries?.filter(
            (te) =>
              new Date(te.Date).valueOf() === timeEntry.Date.valueOf() &&
              te.ProjectId === timeEntry.ProjectId
          )[0] ?? null;

        let timeEntryClone;

        if (tmpTimeEntry) {
          tmpTimeEntry = { ...tmpTimeEntry };

          tmpTimeEntry.Date = timeEntry.Date;
          tmpTimeEntry.Hour = tmpTimeEntry.Hour + timeEntry.Hour;
          tmpTimeEntry.Note = tmpTimeEntry.Note + '\n' + timeEntry.Note;


          timeEntryClone = { ...tmpTimeEntry };
        } else {
          timeEntryClone = { ...timeEntry };

        }

        if (tmpTimeEntry && this.timesheetValidationService.isValidForUpdate(timeEntryClone, this.timeEntries ?? [], this.timesheetApprovals ?? [], this.timesheetConfig)) {
          timeEntries.push(timeEntryClone);
        }
        else if (this.timesheetValidationService.isValidForAdd(timeEntryClone, this.timeEntries ?? [], this.timesheetApprovals ?? [], this.timesheetConfig)) {
          timeEntries.push(timeEntryClone);
        }
        else {
          this.invalidEntries.push({
            Date: timeEntry.Date,
            Message: this.timesheetValidationService.message ?? '',
          });
        }
      }
    } else {
      for (let i = 0; i < dates.length; i++) {
        timeEntry.Date = new Date(dates[i]);

        const timeEntryClone = { ...timeEntry };

        if (this.timesheetValidationService.isValidForAdd(timeEntry, this.timeEntries ?? [], this.timesheetApprovals ?? [], this.timesheetConfig)
        ) {
          timeEntries.push(timeEntryClone);
        } else {
          this.invalidEntries.push({
            Date: timeEntry.Date,
            Message: this.timesheetValidationService.message ?? '',
          });
        }
      }
    }

    if (this.invalidEntries && this.invalidEntries.length > 0) {
      this.invalidTimeEntriesModalVisible = true;
      return;
    }

    if (timeEntries && timeEntries.length > 0) {
      this.addTimeEntryForRangeOfDates(timeEntries);
    }
  }

  checkProjectDateBeforeAddTimeEntry(timeEntry: TimeEntry) {
    const project = this.projects.filter(p => p.id === timeEntry.ProjectId)[0];
    const date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
    let projectEndDate = new Date(project.endDate);
    projectEndDate = new Date(projectEndDate.getFullYear(), projectEndDate.getMonth(), projectEndDate.getDate());
    let projectAssignedDate = new Date(project.assignedDate);
    projectAssignedDate = new Date(projectAssignedDate.getFullYear(), projectAssignedDate.getMonth(), projectAssignedDate.getDate());

    this.newTimeEntry = timeEntry;
    this.modalTitle = "Add entry ?";
    this.modalMessages = [];
    if (date < projectAssignedDate) {
      this.modalMessages.push("You are about to add time entry before your assigned date.");
      this.modalMessages.push("Are you sure you want to continue?");
      this.addTimeEntryModalVisible = true;
      return;
    }
    else if (date > projectEndDate) {
      this.modalMessages.push("You are about to add time entry after project end date.");
      this.modalMessages.push("Are you sure you want to continue?");;
      this.addTimeEntryModalVisible = true;
      return;
    }

    this.addTimeEntry();
  }

  addTimeEntry() {
    if (!this.userId) {
      return;
    }

    if (!this.newTimeEntry) {
      return;
    }

    const date = new Date(this.newTimeEntry.Date);
    this.newTimeEntry.Date = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      3,
      0,
      0,
      0
    );

    this.timesheetService.addTimeEntry(this.userId, this.newTimeEntry).subscribe(
      (response) => {
        if (response.ResponseStatus === "Success") {
          this.timesheetStateService.getTimesheet(this.userId, this.date);

          this.createNotification(
            response.ResponseStatus.toLowerCase(),
            response.Message
          );
        }
        else {
          this.createNotification(
            response.ResponseStatus.toLowerCase(),
            response.Message
          );
        }
      },
      (error) => {
        this.createNotification(
          "error",
          error.message()
        );
      }
    );

    if (this.drawerVisible) {
      this.closeFormDrawer();
    }
  }

  updateTimeEntry(timeEntry: TimeEntry) {
    const date = timeEntry.Date;
    timeEntry.Date = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      3,
      0,
      0,
      0
    );

    this.timesheetService.updateTimeEntry(timeEntry).subscribe(
      (response) => {
        if (response.ResponseStatus === "Success") {
          this.timesheetStateService.getTimesheet(this.userId, this.date);

          this.createNotification(
            response.ResponseStatus.toLowerCase(),
            response.Message
          );
        }
        else {
          this.createNotification(
            response.ResponseStatus.toLowerCase(),
            response.Message
          );
        }
      },
      (error) => {
        this.createNotification(
          'error',
          error.message
        );
      }
    );

    if (this.drawerVisible) {
      this.closeFormDrawer();
    }
  }

  addTimeEntryForRangeOfDates(timeEntries: TimeEntry[]) {
    if (!this.userId) {
      return;
    }

    for (const timeEntry of timeEntries) {
      const date = timeEntry.Date;
      timeEntry.Date = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        3,
        0,
        0,
        0
      );
    }

    this.timesheetService
      .addTimeEntryForRangeOfDates(this.userId, timeEntries)
      .subscribe(
        (response) => {
          if (response.ResponseStatus === "Success") {
            this.timesheetStateService.getTimesheet(this.userId, this.date);

            this.createNotification(
              response.ResponseStatus.toLowerCase(),
              response.Message
            );
          }
          else {
            this.createNotification(
              response.ResponseStatus.toLowerCase(),
              response.Message
            );
          }
        },
        (error) => {
          this.createNotification(
            'error',
            error.message
          );
        }
      );

    if (this.drawerVisible) {
      this.closeFormDrawer();
    }
  }

  closeFormDrawer(): void {
    this.clearFormData();
    this.drawerVisible = false;
  }

  resetForm(e: MouseEvent): void {
    e.preventDefault();
    this.clearFormData();
  }

  clearFormData() {
    this.timeEntry = null;
    this.newTimeEntry = null;
    this.disableFromDate = false;
    this.disableToDate = false;
    this.disableClient = false;
    this.disableProject = false;
    this.validateForm.reset();
    this.setDateColumnTotalHour();
    this._clientAndProjectStateService.reset();
  }

  setDateColumnTotalHour() {
    let fromDate = this.formData.fromDate;
    let toDate = this.formData.toDate;
    const totalHour = this.timeEntries
      ?.filter(
        (timeEntry) =>
          new Date(timeEntry.Date).getTime() === this.date.getTime()
      )
      .map((timeEntry) => timeEntry.Hour)
      .reduce((prev, curr) => prev + curr, 0);

    if (this.timeEntry) {
      this.dateColumnTotalHour = totalHour ? totalHour : 0;
      this.dateColumnTotalHour -= this.timeEntry ? this.timeEntry.Hour : 0;
    } else if (fromDate && toDate) {

      fromDate = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate()
      );
      toDate = new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate()
      );


      if (fromDate.valueOf() === toDate.valueOf()) {
        this.dateColumnTotalHour = totalHour ? totalHour : 0;
      } else {
        this.dateColumnTotalHour = 0;
      }
    } else {
      this.dateColumnTotalHour = totalHour ?? 0;
    }
  }

  onFormFromDateChange() {
    if (!this.drawerVisible) {
      return;
    }

    if (this.disableFromDate) {
      return;
    }

    if (this.formData.fromDate) {
      this.formData.toDate = this.formData.fromDate;
      this.disableToDate = false;
      this.setColumnDate(this.formData.fromDate);
    } else {
      this.formData.toDate = null;
      this.disableToDate = true;
    }

    this.setDateColumnTotalHour();
  }

  onFormToDateChange() {
    if (!this.drawerVisible) {
      return;
    }

    if (!this.formData.toDate || !this.formData.fromDate) {
      return;
    }

    if (this.formData.toDate < this.formData.fromDate) {
      this.formData.fromDate = this.formData.toDate;

      this.setColumnDate(this.formData.fromDate);
    }

    this.setDateColumnTotalHour();
  }

  setColumnDate(date: Date) {
    this.date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  createNotification(type: string, message: string, position?: NzNotificationPlacement) {

    if (this.startingDateCriteria.isBeforeThreeWeeks) {
      return;
    }
    if (!position) {
      position = 'bottomRight';
    }

    switch (type.toLowerCase()) {

      case 'success':
        this.notification.success('', message, { nzPlacement: position });
        break;
      case 'info':
        this.notification.info('', message, { nzPlacement: position });
        break;
      case 'warning':
        this.notification.warning('', message, { nzPlacement: position });
        break;
      case 'error':
        this.notification.error('', message, { nzPlacement: position });

        break;
    }
  }

  disabledDates = (current: Date): boolean => {
    const date = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate()
    );
    const fromDate = new Date(
      this.firstday1.getFullYear(),
      this.firstday1.getMonth(),
      this.firstday1.getDate()
    );
    const toDate = new Date(
      this.lastday1.getFullYear(),
      this.lastday1.getMonth(),
      this.lastday1.getDate()
    );

    return (
      date.valueOf() < fromDate.valueOf() ||
      date.valueOf() > toDate.valueOf() ||
      date.valueOf() > new Date().valueOf()
    );
  };

  authorize(key: string) {
    return this._permissionService.authorizedPerson(key);
  }


  valueChangeInputleave() {
    this.validateForm.controls.client.valueChanges.subscribe(() => {
      const client = this.clients.find(c => c.id == this.validateForm.controls.client.value);
      if (client?.name == "Leave") {
        this.validateForm.controls.fromDate.disable();
        this.validateForm.controls.toDate.disable();
        this.validateForm.controls.hours.disable();
        this.formData.hours = this.timesheetConfig.WorkingHours.Min;
      }
      else {
        this.validateForm.controls.fromDate.enable();
        this.validateForm.controls.toDate.enable();
        this.validateForm.controls.hours.enable();
        this.formData.hours = null;
      }
    });
  }

  checkLeaveForLeaveInputOfADay() {
    if (this.formData.fromDate && this.timeEntries != null) {
      const dayEntery = this.timeEntries.filter(e => formatDate(e.Date, 'yyyy-MM-dd', 'en_US') ==
        (this.formData.fromDate && formatDate(this.formData.fromDate, 'yyyy-MM-dd', 'en_US')));
      if (dayEntery.length > 0)
        !this.isThereLeaveOnADay(this.formData.fromDate) ? this.leaveforbiden = true : this.leaveforbiden = false;
      else this.leaveforbiden = false;
    }
    else this.leaveforbiden = false;
  }

  isThereLeaveOnADay(enteryDate: Date): boolean {
    if (this.timeEntries != null && this.clients != null) {
      const dayEntery = this.timeEntries.filter(
        e => formatDate(e.Date, 'yyyy-MM-dd', 'en_US') == formatDate(enteryDate, 'yyyy-MM-dd', 'en_US'));
      for (const entery of dayEntery) {
        for (const client of this.clients) {
          const project = client.projects.find(c => c.id == entery.ProjectId);
          if ((project?.name.trim() == "Casual Leave" || project?.name.trim() == "Medical/Maternity" ||
            project?.name.trim() === "Sick Leave" || project?.name.trim() === "Vacation") || project?.name.trim() == "Leave")
            return true;
        }
      }
    }
    return false;
  }

}