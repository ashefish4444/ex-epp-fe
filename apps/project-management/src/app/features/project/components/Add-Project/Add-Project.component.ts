
import { NzTabPosition } from 'ng-zorro-antd/tabs';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
import { Client, ClientService, Employee, EmployeeService, Project, ProjectCreate, projectResourceType, ProjectService, ProjectStatus, ProjectStatusService } from '../../../../core';
import { Router } from '@angular/router';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'exec-epp-Add-Project',
  templateUrl: './Add-Project.component.html',
  styleUrls: ['./Add-Project.component.css']
})
export class AddProjectComponent implements OnInit {
  position: NzTabPosition = 'left';
  projectStatus!: boolean;
  selectedStatus!: string;

  validateForm!: FormGroup;
  userSubmitted!: boolean;
  currentDate = Date.now.toString();
  projectCreate:ProjectCreate={} as ProjectCreate;
  clients= []as Client[];
  employees= [] as Employee[];
  projects= [] as Project[];
  projectStatuses=[] as ProjectStatus[];
  projectNameExits=false;
  enableAddResourceTab=false;
  projectNameExitsErrorMessage=""
   projectStartdDate={}as Date;
  resources: projectResourceType[]=[] as  projectResourceType[];

  @ViewChild('endDatePicker') endDatePicker!: NzDatePickerComponent;
  @ViewChild('startDatePicker') startDatepicker!: NzDatePickerComponent;


  submitForm(): void {
    for (const i in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(i)) {
        this.validateForm.controls[i].markAsDirty();
        this.validateForm.controls[i].updateValueAndValidity();
      }
    }
  }

    constructor(private fb: FormBuilder,private projectService:ProjectService,
    private clientService:ClientService ,private employeeService:EmployeeService,
    private projectStatusService:ProjectStatusService,private router:Router) { }

  ngOnInit(): void {

    this.createRegistrationForm();
    this.clientService.getAll().subscribe(response=>{
      this.clients=response;

    })
    this.employeeService.getAll().subscribe((response:Employee[])=>{
      this.employees=response;

    });

    this.projectStatusService.getAll().subscribe((response:ProjectStatus[])=>{
      this.projectStatuses=response;

    })
    this.projectService.getAll().subscribe((response:Project[])=>{
      this.projects=response;
    })


    this.validateForm.valueChanges.subscribe(()=>{
      if( this.validateForm.valid)
      {  
      this.enableAddResourceTab=true; 
       this.projectStartdDate=  this.validateForm.controls.startValue.value;  
      this.projectCreate.ProjectName=this.validateForm.controls.projectName.value
      this.projectCreate.ClientGuid=this.validateForm.controls.client.value;
      this.projectCreate.EndDate=this.validateForm.controls.endValue.value;
      this.projectCreate.SupervisorGuid=this.validateForm.controls.supervisor.value;
      this.projectCreate.StartDate=this.validateForm.controls.startValue.value;
      this.projectCreate.projectType=this.validateForm.controls.projectType.value;
      this.projectCreate.ProjectStatusGuid=this.validateForm.controls.status.value; 
      this.projectCreate.Description=this.validateForm.controls.description.value;

      }else
      {
       this.projectCreate={} as ProjectCreate
      }

    });

  }

  createRegistrationForm(){
    this.validateForm = this.fb.group({
      projectName: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      client: ['3fa85f64-5717-4562-b3fc-2c963f66afa6', [Validators.required]],
      projectType: ['External', [Validators.required]],
      status: [null, [Validators.required]],
      supervisor: [null, [Validators.required]],
      startValue: [null, [Validators.required]],
      endValue: [null, [Validators.required]],
      description:[""]
    });
  }

  onSubmit(){
  this.userSubmitted = true;
   this.projectCreate.assignResource=this.resources;
   this.projectService.createProject(this.projectCreate);
   this.router.navigateByUrl('client-project/add-project');
   this.onReset();
   console.log(this.validateForm.value)
  }

  onReset(){
    this.userSubmitted = false;
    this.validateForm.reset();
  }

  disabledStartDate = (startValue: Date): boolean => {
    if (!startValue || !this.validateForm.controls.endValue.value) {
      return false;
    }
    return startValue.getTime() > this.validateForm.controls.endValue.value.getTime();
  };

  disabledEndDate = (endValue: Date): boolean => {
    if (!endValue || !this.validateForm.controls.startValue.value) {
      return false;
    }
    return endValue.getTime() <= this.validateForm.controls.startValue.value.getTime();
  };

  handleStartOpenChange(open: boolean): void {
    if (!open) {
      this.endDatePicker.open();
    }

  }

  handleEndOpenChange(open: boolean): void {

  
  }


  get projectName() {
    return this.validateForm.controls.projectName as FormControl;
  }

  get clientName() {
    return this.validateForm.controls.client as FormControl;
  }

  get projectType() {
    return this.validateForm.controls.projectType as FormControl;
  }

  get status() {
    return this.validateForm.controls.status as FormControl;
  }

  get supervisor() {
    return this.validateForm.controls.supervisor as FormControl;
  }

  get startValue() {
    return this.validateForm.controls.startValue as FormControl;
  }

  get endValue() {
    return this.validateForm.controls.endValue as FormControl;
  }
  onInputProjectName(event:Event)
  {
   let found=false;
    if(!this.validateForm.controls.projectName.invalid)
      {
        if(this.projects!=[])
       for(let  i=0 ;this.projects.length; i++)
       {
           
        if(this.validateForm.controls.projectName.value.toString().toLowerCase()==this.projects[i].name.toLowerCase())
          {           
           found=true;
            this.projectNameExitsErrorMessage="Project name already exists by this"+this.projects[i].client.ClientName+" client"
          }
           
     
       }
      }
      if(found==true)
      {this.projectNameExits=true;
        //this.validateForm.controls.projectName.setErrors({'incorrect':true});
      }
      else
      {this.projectNameExits=false;
       // this.validateForm.controls.projectName.setErrors(null);
      }
  }

  updateProjectResourseList(resources: projectResourceType[])
  {
    this.resources=resources;
  }

  selectChangeHandler (event: any) {
    this.selectedStatus = event.target.value;
    console.log(this.selectedStatus)
  }

}

