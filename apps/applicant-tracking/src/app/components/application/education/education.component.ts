import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { EducationProgramModel } from '../../../models/education/education-programme.model';
import { EducationModel } from '../../../models/education/education.model';
import { FieldOfStudyModel } from '../../../models/education/field-of-study.model';
import { ResponseDTO } from '../../../models/ResponseDTO';
import { EducationProgrammeService } from '../../../services/applicant/education-programme.service';
import { EducationService } from '../../../services/applicant/education.service';
import { FieldOfStudyService } from '../../../services/applicant/field-of-study.service';
import {
  NotificationType,
  NotifierService,
} from '../../../shared/services/notifier.service';
@Component({
  selector: 'exec-epp-education',
  templateUrl: './education.component.html',
  styleUrls: ['./education.component.scss'],
})
export class EducationComponent implements OnInit {
  info = '';
  loggedInUser: any;
  isModalVisible = false;
  isUpdateMode = false;
  isRecordUpdated = false;
  educations: [EducationModel] | [] = [];
  educationModel: EducationModel | null = null;
  loading = false;
  is_studying = false;

  // databinding
  showConfirm = false;
  guid: any;
  fetchedEducationProgramme: [EducationProgramModel] | [] = [];
  fetchedFieldOfStudies: [FieldOfStudyModel] | [] = [];
  constructor(
    private eduProgService: EducationProgrammeService,
    private fieldOfStudyService: FieldOfStudyService,
    private educationService: EducationService,
    private notifier: NotifierService,
    private modal: NzModalService
  ) {}

  education = new FormGroup({
    institution: new FormControl('', [Validators.required]),
    yearFrom: new FormControl(null, [Validators.required]),
    yearTo: new FormControl(null, [Validators.required]),
    country: new FormControl('', [Validators.required]),
    program: new FormControl('', [Validators.required]),
    fieldOfStudy: new FormControl('', [Validators.required]),
    isStudying: new FormControl(false, [Validators.required]),
    otherFieldOfStudy: new FormControl(null),
  });

  public validation = new FormGroup({
    isMultitpleEntry: new FormControl(false, [Validators.required]),
  });
  closeModal() {
    this.isModalVisible = false;
  }
  openModal() {
    this.isModalVisible = true;
  }
  onSaveRecord(): void {
    this.loading = true;
  }
  onEditRecord(guid: string | null) {
    this.isUpdateMode = true;
    this.openModal();
    const id: string = guid == null ? '' : guid;
    this.guid = id;
    this.educationService.getById(id).subscribe(
      (res: ResponseDTO<[EducationModel]>) => {
        const row = res.Data[0];
        this.education.patchValue({
          institution: row.Institution,
          yearFrom: new Date(row.DateFrom),
          yearTo: new Date(row.DateTo),
          country: row.Country,
          program: row.EducationProgramme?.Guid, 
          fieldOfStudy: row.FieldOfStudy?.Guid, 
          isStudying: row.IsCompleted,
          otherFieldOfStudy: row.OtherFieldOfStudy,
        });
      },
      (err) => console.log(err)
    );
  }
  onDeleteRecord(guid: string | null) {
    this.showConfirmation(guid);
   
  }
  deleteItem(guid: string | null)
  {
    const id = guid?guid:'';
    this.educationService.delete(id)
    .subscribe(_ => {
      this.notifier.notify(NotificationType.success, 'Record deleted successfully');
      this.bindRecord();
  });

  }

  disabledStartDate = (startValue: Date): boolean => {
    if (!startValue || !this.education.controls.yearTo.value) {
      return false;
    }
    return (
      startValue.getTime() > this.education.controls.yearTo.value.getTime()
    );
  };

  disabledEndDate = (endValue: Date): boolean => {
    if (!endValue || !this.education.controls.yearFrom.value) {
      return false;
    }
    // return (
    //   endValue.getTime() <= this.education.controls.yearFrom.value.getTime()
    // );
    return false;
  };

  onCountryChange(value: any) {
    this.education.controls.country.setValue(value);
  }
  async onFormSubmit() {
    this.loading = true;
    const educationModel = this.getFormValue();
    if (!this.isUpdateMode) await this.addItem(educationModel);
    else await this.updateItem(educationModel);
    
   
  }
  addItem(educationModel: EducationModel) {
    this.educationService.add(educationModel).subscribe(
      (_) => {
        this.onSaveCompleted();
        this.bindRecord();
      },
      (err) => console.log(err)
    );
  }
  updateItem(educationModel: EducationModel) {
    this.educationService.update(educationModel).subscribe(
      (_) => {
        this.onSaveCompleted();
        this.bindRecord();
      },
      (err: any) => 
      {
        this.onShowError(err);
      }
    );
  }
  getFormValue(): EducationModel {
    const educationModel = {
      Guid: this.guid ? this.guid : null,
      ApplicantId: this.loggedInUser.Guid,
      Institution: this.education.get('institution')?.value,
      DateFrom: new Date( this.education.get('yearFrom')?.value),
      DateTo: new Date (this.education.get('yearTo')?.value),
      Country: this.education.get('country')?.value,
      EducationProgrammeId: this.education.get('program')?.value,
      EducationProgramme: null,
      FieldOfStudyId: this.education.get('fieldOfStudy')?.value,
      FieldOfStudy: null,
      OtherFieldOfStudy: this.education.get('otherFieldOfStudy')?.value,
      IsCompleted: this.education.get('isStudying')?.value,
    };
    return educationModel;
  }

  onSaveCompleted() {
    if (!this.validation.controls.isMultitpleEntry.value) {
      this.closeModal();
      this.isRecordUpdated = true;
    }
    this.loading = false;
    this.notifier.notify(
      NotificationType.success,
      'Record is successfully added.'
    );
    this.education.reset();
    this.guid = null;
    this.loading = false;
    this.closeModal();
    this.isUpdateMode = false;
  }

  ngOnInit(): void {
    this.loggedInUser = JSON.parse(
      localStorage.getItem('loggedInUserInfo') ?? ''
    );
    this.bindRecord();
    this.education.controls.isStudying.valueChanges.subscribe((value) => {
      if (value) {
        this.education.controls.yearTo.setValidators([]);
        this.education.controls.yearTo.reset();
      } else
        this.education.controls.yearTo.setValidators([Validators.required]);
      this.education.controls.yearTo.updateValueAndValidity();
    });

    //api-integration
    this.eduProgService.get().subscribe(
      (res) => {
        this.fetchedEducationProgramme = res;
      },
      (err) => {console.log(err)}
    );
    this.fieldOfStudyService.get().subscribe(
      (res: ResponseDTO<[FieldOfStudyModel]>) => {
        this.fetchedFieldOfStudies = res.Data;
      },
      (err) => {
        console.log(err);
      }
    );
  }
  bindRecord() {
    this.educationService.getByApplicantId(this.loggedInUser.Guid).subscribe(
      (res: ResponseDTO<[EducationModel]>) => {
        this.educations = res.Data;
      },
      (err: any) => console.log(err)
    );
  }
  showConfirmation(guid: string | null): void {
    this.modal.confirm({
      nzTitle: 'Confirm',
      nzContent: 'Do you want to delete this record?',
      nzOnOk: () => { this.deleteItem(guid) }
       
    });
}
onShowError(err: any) {
  this.notifier.notify(NotificationType.error, 'Some error occured. Please review your input and try again.');
  this.loading = false;
}
}


