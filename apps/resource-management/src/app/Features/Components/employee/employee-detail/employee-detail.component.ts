import { Component, OnInit } from '@angular/core';
import { Data } from '@angular/router';

import { data } from 'autoprefixer';
import { Observable } from 'rxjs';
import { EmployeeParams } from '../../../Models/Employee/EmployeeParams';
import { IEmployeeViewModel } from '../../../Models/Employee/EmployeeViewModel';
import { ResponseDTO } from '../../../Models/response-dto.model';
import { EmployeeService } from '../../../Services/Employee/EmployeeService';

@Component({
  selector: 'exec-epp-employee-detail',
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.css'],
})
export class EmployeeDetailComponent implements OnInit {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private _employeeService : EmployeeService) {

  }
  checked = false;
  loading = false;
  indeterminate = false;
  listOfData: readonly Data[] = [];
  listOfCurrentPageData: readonly Data[] = [];
  setOfCheckedId = new Set<number>();
  employeeViewModels$ !: Observable<IEmployeeViewModel[]>;
  employeeParams = new EmployeeParams();
  

  ngOnInit(): void {
    this.FeatchAllEmployees();
  }

  updateCheckedSet(id: number, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  onCurrentPageDataChange(listOfCurrentPageData: readonly Data[]): void {
    this.listOfCurrentPageData = listOfCurrentPageData;
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    const listOfEnabledData = this.listOfCurrentPageData.filter(
      ({ disabled }) => !disabled
    );
    this.checked = listOfEnabledData.every(({ id }) =>
      this.setOfCheckedId.has(id)
    );
    this.indeterminate =
      listOfEnabledData.some(({ id }) => this.setOfCheckedId.has(id)) &&
      !this.checked;
  }

  onItemChecked(id: number, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  onAllChecked(checked: boolean): void {
    this.listOfCurrentPageData
      .filter(({ disabled }) => !disabled)
      .forEach(({ id }) => this.updateCheckedSet(id, checked));
    this.refreshCheckedStatus();
  }

  sendRequest(): void {
    this.loading = true;
    const requestData = this.listOfData.filter((data) =>
      this.setOfCheckedId.has(data.id)
    );
    console.log(requestData);
    setTimeout(() => {
      this.setOfCheckedId.clear();
      this.refreshCheckedStatus();
      this.loading = false;
    }, 1000);
  }

  
  FeatchAllEmployees() {
    this.employeeViewModels$ = this._employeeService.SearchEmployeeData(this.employeeParams);
   
  }
}

