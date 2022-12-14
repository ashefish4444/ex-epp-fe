import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Data, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, fromEvent, of, observable, merge } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { ColumnItem } from '../../Models/ColumnItem';
import { FormValidator } from '../../../utils/validator';
import { GroupParams } from '../../Models/User/GroupParams';
import { GroupSetModel } from '../../Models/group-set.model';
import { NotificationBar } from '../../../utils/feedbacks/notification';
import { NzButtonSize } from 'ng-zorro-antd/button';
import { PaginationResult } from '../../Models/PaginationResult';
import { UserParams } from '../../Models/User/UserParams';
import { listtToFilter } from '../../Models/listToFilter';
import { AuthenticationService } from './../../../../../../../libs/common-services/Authentication.service';
import { GroupSetService } from '../../Services/group-set.service';
import { PermissionListService } from '../../../../../../../libs/common-services/permission.service';

@Component({
  selector: 'exec-epp-groupset',
  templateUrl: './groupset.component.html',
  styleUrls: ['./groupset.component.scss']
})
export class GroupsetComponent implements OnInit {

  isVisible = false;
  groupSet = new FormGroup({
    Name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(70),
    Validators.pattern('^[a-zA-Z][a-zA-Z0-9-_ ]+$')]),
    Description: new FormControl('', [Validators.maxLength(250)])
  });

  size: NzButtonSize = 'small';
  groupDashboardForm !: FormGroup;
  loading = false;
  indeterminate = false;
  setOfCheckedId = new Set<string>();
  groupList$: Observable<GroupSetModel[]> = new Observable<GroupSetModel[]>();
  listOfData: readonly Data[] = [];
  listOfCurrentPageData: readonly Data[] = [];
  groupList: GroupSetModel[] = [];
  paginatedResult !: PaginationResult<GroupSetModel[]>;
  groupParams = new GroupParams();
  searchStateFound !: boolean;
  pageSize = 10;
  pageIndex = 1;
  totalRows !: number;
  totalRecord !: number;
  groupName!: string;
  isLogin = false;

  @ViewChild('searchInput') public input!: ElementRef;

  constructor(
    //private _intialdataService: IntialdataService,
    private _authenticationService: AuthenticationService,
    private _permissionService: PermissionListService,
    private groupSetService: GroupSetService,
    private router: Router,
    private notification: NotificationBar,
    private validator: FormValidator,
    private fb: FormBuilder
  ) {
    this.isLogin = _authenticationService.loginStatus();
  }
  authorize(key: string) {

    return this._permissionService.authorizedPerson(key);
  }
  // getPermission(): void {
  // this._intialdataService.getUserPermission().subscribe((res:any)=>{
  // this.permissionList=res.Data;
  // })
  //}

  ngAfterViewInit() {


    fromEvent<any>(this.input.nativeElement, 'keyup')
      .pipe(
        map(event => event.target.value),
        startWith(''),
        debounceTime(2000),
        distinctUntilChanged(),
        switchMap(async (search) => {
          this.groupDashboardForm.value.userName = search,
          this.SearchgroupsByName()
        })
      ).subscribe();

  }

  onAddNewRecord(): void {
    this.resetForm();
    this.isVisible = true;
    this.resetForm();
  }

  handleCancel(): void {
    this.isVisible = false;
  }

  resetForm() {
    this.groupSet.reset();
  }


  onSaveGroup(): void {
    const dataToPost = this.groupSet.value;

    this.groupSetService.createGroup(dataToPost).subscribe(
      () => {
        this.notification.showNotification({
          type: 'success',
          content: 'Group created successfully',
          duration: 5000,
        });
        this.FeatchAllgroups();
        this.isVisible = false;
      },
      (err: any) => {
        this.notification.showNotification({
          type: 'error',
          content: err?.error.Message,
          duration: 5000,
        });
        console.log('error:' + err.error.Message);
      }
    );
  }
  ngOnInit(): void {
    this.creategroupDashboardControls();
    this.groupList as GroupSetModel[];
    this.FeatchAllgroups();
    this.notification.showNotification({
      type: 'success',
      content: 'Groups loaded successfully',
      duration: 1,
    });
  }

  creategroupDashboardControls() {
    this.groupDashboardForm = this.fb.group({
      groupName: [''],
      description: ['']
    })
  }

  FeatchAllgroups() {
    this.loading = true;
    this.groupParams.searchKey = this.groupDashboardForm.value.groupName;
    this.groupSetService.SearchUsers(this.groupParams).subscribe((response: PaginationResult<GroupSetModel[]>) => {
      if (response.Data) {

        this.groupList$ = of(response.Data);
        this.groupList = response.Data;
        this.listOfCurrentPageData = response.Data;
        this.pageIndex = response.pagination.PageIndex;
        this.pageSize = response.pagination.PageSize;
        this.totalRecord = response.pagination.TotalRecord;
        this.totalRows = response.pagination.TotalRows;
        this.loading = false;
      }
      else {
        this.loading = false;
        this.groupList = [];
        this.groupList$ = of([]);

      }

    }, error => {
      this.loading = false;

    });
    this.searchStateFound = false;
  }

  SearchgroupsByName() {
    this.groupParams.searchKey = this.groupDashboardForm.value.groupName;
    this.groupParams.pageIndex = 1;
    if (this.groupParams.searchKey.length >= 2 || this.groupParams.searchKey == "")
      this.groupSetService.SearchUsers(this.groupParams)
        .subscribe((response: PaginationResult<GroupSetModel[]>) => {
          if (response.Data) {
            this.loading = true;
            this.groupList$ = of(response.Data);
            this.groupList = response.Data;
            this.listOfCurrentPageData = response.Data;
            this.pageIndex = response.pagination.PageIndex;
            this.pageSize = response.pagination.PageSize;
            this.totalRecord = response.pagination.TotalRecord;
            this.totalRows = response.pagination.TotalRows;
            this.loading = false;
          }
          else {
            this.loading = false;
            this.groupList = [];
            this.groupList$ = of([]);

          }
          this.searchStateFound = true;
        }, error => {
          this.loading = false;
        });
  }



  PageIndexChange(index: any): void {

    this.groupParams.pageIndex = index;
    this.groupParams.searchKey = this.groupName ?? "";
    if (this.searchStateFound == true) {
      this.groupSetService.SearchUsers(this.groupParams).subscribe(
        (response: PaginationResult<GroupSetModel[]>) => {
          this.loading = true;
          this.groupList$ = of(response.Data);
          this.groupList = response.Data;
          this.totalRows = response.pagination.TotalRows;
          this.pageIndex = response.pagination.PageIndex;
          this.loading = false;
        });
    } else {
      this.groupSetService.SearchUsers(this.groupParams)
        .subscribe((response: PaginationResult<GroupSetModel[]>) => {
          this.groupList$ = of(response.Data);
          this.groupList = response.Data;
          this.totalRows = response.pagination.TotalRows;
          this.pageIndex = response.pagination.PageIndex;
          this.loading = false;
        });
      this.searchStateFound = false;
      this.loading = false;
    }
  }

  NameSortOrderChange(event: any) {
    this.groupParams.sortBy = "Name";
    if (event === 'ascend')
      this.groupParams.sortOrder = "Ascending";
    else if (event === 'descend')
      this.groupParams.sortOrder = "Descending";
    else {
      this.groupParams.sortOrder = "";
      this.groupParams.sortBy = "";
    }
    this.FeatchAllgroups();
  }

  AddToGroup(userId: string) {
    // to do
  }

  Remove(userId: string) {
    // to do
  }

  ShowDetail(groupId: string) {
    this.router.navigateByUrl('usermanagement/group-detail/' + groupId);
  }

  CheckGroupNamExistance(event: any) {
    // const group_Name  = event.target.value;
    // alert(group_Name);
    //  this.ngAfterViewInit();
  }
}
