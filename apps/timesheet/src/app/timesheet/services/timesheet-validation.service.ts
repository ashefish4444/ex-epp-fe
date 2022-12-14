import {
  ApprovalStatus,
  TimeEntry,
  TimesheetApproval,
  TimesheetConfiguration,
} from '../../models/timesheetModels';

import { Injectable } from '@angular/core';
import { TimesheetConfigurationStateService } from '../state/timesheet-configuration-state.service';

@Injectable({
  providedIn: 'root',
})
export class TimesheetValidationService {
  date: Date;
  fromDate: Date;
  toDate: Date;
  message: string | null = null;

  constructor(private timesheetConfigStateService: TimesheetConfigurationStateService) {
    this.date = new Date();
    this.date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
    this.fromDate = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate() - this.date.getDay() + 1);
    this.toDate = new Date(this.fromDate.getFullYear(), this.fromDate.getMonth(), this.fromDate.getDate() + 6);
  }

  isValidForAdd(timeEntry: TimeEntry, timeEntries: TimeEntry[], timesheetApprovals: TimesheetApproval[], timesheetConfig: TimesheetConfiguration) {
    this.message = null;

    return this.isValidTimeEntry(timeEntry, timeEntries, timesheetApprovals, timesheetConfig);
  }

  isValidForUpdate(timeEntry: TimeEntry, timeEntries: TimeEntry[], timesheetApprovals: TimesheetApproval[], timesheetConfig: TimesheetConfiguration) {
    this.message = null;
    const timeEntriesForUpdate = [...timeEntries];
    const timeEntryIndex = timeEntriesForUpdate.findIndex(te => new Date(te.Date).valueOf() === new Date(timeEntry.Date).valueOf() && te.ProjectId === timeEntry.ProjectId);

    if (timeEntryIndex >= 0) {
      timeEntriesForUpdate.splice(timeEntryIndex, 1);
    }

    return this.isValidTimeEntry(timeEntry, timeEntriesForUpdate, timesheetApprovals, timesheetConfig);
  }

  isValidForDelete(timeEntry: TimeEntry, timesheetApprovals: TimesheetApproval[]) {
    this.message = null;

    if (this.isTimesheetRequestedForApproval(timeEntry, timesheetApprovals)) {
      return false;
    }

    if (this.isDateNotWithInTheWeek(timeEntry, this.fromDate, this.toDate)) {
      return false;
    }

    return true;
  }

  isValidForApproval(timeEntries: TimeEntry[], timesheetConfiguration: TimesheetConfiguration) {
    const dates = [...new Set(timeEntries.map((te) => te.Date))];
    const weekdays = dates.map((date) =>
      new Date(date).toLocaleString('en-us', { weekday: 'long' })
    );

    this.message = null;

    if (timeEntries.length === 0) {
      return false;
    }

    if (!timesheetConfiguration?.StartOfWeeks) {
      timesheetConfiguration.StartOfWeeks = this.timesheetConfigStateService.defaultTimesheetConfig.StartOfWeeks;
    }

    if (!timesheetConfiguration?.WorkingDays) {
      timesheetConfiguration.WorkingDays = this.timesheetConfigStateService.defaultTimesheetConfig.WorkingDays;
    }

    if (!timesheetConfiguration?.WorkingHours) {
      timesheetConfiguration.WorkingHours = this.timesheetConfigStateService.defaultTimesheetConfig.WorkingHours;
    }

    for (const workingDay of timesheetConfiguration.WorkingDays) {
      if (
        weekdays.filter((wd) => wd.toUpperCase() === workingDay.toUpperCase())
          .length === 0
      ) {
        this.message = `Pelase add time entry for ${workingDay} before requesting for approval.`;
        return false;
      }
    }

    for (const timeEntry of timeEntries) {
      if (this.isDateNotWithInTheWeek(timeEntry, this.fromDate, this.toDate)) {
        return false;
      }
    }

    if (
      !timesheetConfiguration.WorkingHours ||
      timesheetConfiguration.WorkingHours.Min <= 0
    ) {
      return true;
    }

    let totalHour = 0;
    for (const date of dates) {
      const workingDay = new Date(date).toLocaleString('en-us', {
        weekday: 'long',
      });

      if (
        timesheetConfiguration.WorkingDays.filter(
          (wd) => wd.toUpperCase() === workingDay.toUpperCase()
        ).length === 0
      ) {
        continue;
      }

      totalHour = timeEntries
        .filter(
          (te) => new Date(te.Date).valueOf() === new Date(date).valueOf()
        )
        .map((te) => te.Hour)
        .reduce((prev, next) => prev + next, 0);

      if (totalHour < timesheetConfiguration.WorkingHours.Min) {
        this.message = `Minimum working hour is not satisfied for a request for approval. Please add time entry for ${new Date(date).toDateString()} date to satisfy minimum working hours.`;
        return false;
      }
      else if (totalHour > timesheetConfiguration.WorkingHours.Max) {
        this.message = `Maximum working hour is not satisfied for a request for approval. Please add time entry lass than or equal to ${timesheetConfiguration.WorkingHours.Max} hours for ${new Date(date).toDateString()} date to satisfy maximum working hours`
        return false;
      }
    }

    return true;
  }

  isValidTimeEntry(timeEntry: TimeEntry, timeEntries: TimeEntry[], timesheetApprovals: TimesheetApproval[], timesheetConfig: TimesheetConfiguration) {
    this.message = null;

    if (this.isFutureDate(timeEntry)) {
      return false;
    }

    if (this.isTimeEntryHourMoreThanMaxHour(timeEntry, timesheetConfig)) {
      return false;
    }

    if (
      this.isTimeEntriesHourMoreThanMaxHours(timeEntry, timeEntries, this.fromDate, this.toDate, timesheetConfig)
    ) {
      return false;
    }

    if (this.isTimesheetRequestedForApproval(timeEntry, timesheetApprovals)) {
      return false;
    }

    if (this.isDateNotWithInTheWeek(timeEntry, this.fromDate, this.toDate)) {
      return false;
    }

    return true;
  }

  private isFutureDate(timeEntry: TimeEntry) {
    const date = new Date(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
    if (timeEntry.Date.valueOf() > date.valueOf()) {
      this.message = "Can't fill timesheet for the future.";
      return true;
    }

    return false;
  }

  private isTimeEntryHourMoreThanMaxHour(timeEntry: TimeEntry, timesheetConfig: TimesheetConfiguration): boolean {
    if (timeEntry.Hour > timesheetConfig.WorkingHours.Max) {
      this.message = `Time entry should not have more than ${timesheetConfig.WorkingHours.Max} hours. Please enter ${timesheetConfig.WorkingHours.Max} hours or less for ${timeEntry.Date}`;
      return true;
    }

    return false;
  }

  private isTimeEntriesHourMoreThanMaxHours(timeEntry: TimeEntry, timeEntries: TimeEntry[], fromDate: Date, toDate: Date, timesheetConfig: TimesheetConfiguration) {
    fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    toDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    const totalHour = timeEntries
      .filter(
        (te) =>
          new Date(te.Date).valueOf() === timeEntry?.Date.valueOf() &&
          new Date(te.Date).valueOf() >= fromDate.valueOf() &&
          new Date(te.Date).valueOf() <= toDate.valueOf()
      )
      .map((te) => te.Hour)
      .reduce((prev, next) => prev + next, 0);

    if (totalHour + timeEntry.Hour > timesheetConfig.WorkingHours.Max) {
      this.message = `Time entries for a day should not be more than ${timesheetConfig.WorkingHours.Max} hours. Please enter ${timesheetConfig.WorkingHours.Max - totalHour} hours or less for ${timeEntry.Date.toDateString()}`;
      return true;
    }

    return false;
  }

  private isTimesheetRequestedForApproval(timeEntry: TimeEntry, timesheetApprovals: TimesheetApproval[]) {
    if (timesheetApprovals.length === 0) {
      return false;
    }

    const timesheetApproval = timesheetApprovals.filter(
      (tsa) =>
        tsa.TimesheetId === timeEntry.TimeSheetId &&
        tsa.ProjectId === timeEntry.ProjectId
    );

    if (
      timesheetApproval.length > 0 &&
      timesheetApproval[0].Status == ApprovalStatus.Approved
    ) {
      this.message =
        "Can't add or edit entries when the timesheet is approved.";
      return true;
    }

    return false;
  }

  private isDateNotWithInTheWeek(timeEntry: TimeEntry, fromDate: Date, toDate: Date) {
    fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    toDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());

    if (timeEntry.Date < fromDate || timeEntry.Date > toDate) {
      this.message = `Time entry should be with in the week. please select or add time entrys between ${this.fromDate.toDateString()} and ${this.toDate.toDateString()}`;
      return true;
    }

    return false;
  }
}
