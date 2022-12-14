import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { AbstractControl, FormArray, FormControl } from "@angular/forms";
import { defaultFormControlParameter, defaultFormLabellParameter } from "../../../../Models/supporting-models/form-error-log.model";
import { commonErrorMessage } from "../../shared/custom.validators";
import { FormGenerator } from "../../form-generator.model";
import { ExcelControlResponseType } from "../../shared/excel-control-response-type.enum";
import { ExcelButtonResponse } from "../../shared/exel-control-response.model";
import { PermissionListService } from "./../../../../../../../../../libs/common-services/permission.service";
import { EmployeeApiService } from "@exec-epp/core-services/employees-services";
import { map } from "rxjs/operators";
import { ResponseStatus } from "@exec-epp/core-services/a-base-services";
import { EmployeeService } from "../../../../Services/Employee/EmployeeService";
import { environment } from "./../../../../../../environments/environment";


const errValidator = ((c: AbstractControl) => {
    return { error: true };
});
@Component({
    selector: 'exec-epp-custom-email-multiple',
    templateUrl: './custom-email-multiple.component.html',
    styleUrls: ['./custom-email-multiple.component.scss']
})
export class CustomEmailMultipleComponent implements OnInit {

    // @Input() formItem: FormItemData = defaultFormItemData
    label = 'Email Address'
    @Input() maxAmount = 3
    @Input() labelConfig = defaultFormLabellParameter
    @Input() controlConfig = defaultFormControlParameter
    @Input() formArray: FormArray = new FormArray([])
    @Input() beValidate = false;

    @Output() reply = new EventEmitter<boolean>()
    required = true
    errMessages: string[] = []
    editable = false;
    emailInUse = this._employeeService.emailInUse;

    constructor(
        private readonly _formGenerator: FormGenerator,
        private readonly _permissionListService: PermissionListService,
        private readonly _employeeApiService: EmployeeApiService,
        private readonly _employeeService:EmployeeService
    ) { 
    }

    ngOnInit(): void {
        this.editable = this._permissionListService.authorizedPerson('Create_Employee')
            || this._permissionListService.authorizedPerson('Update_Employee')
            || this._permissionListService.authorizedPerson('Update_My_Profile');
        for (let i = 0; i < this.formArray.length; i++) {
            this.errMessages.push('')
        }
      
        this.emailInUse = this._employeeService.emailInUse;
        
    }
    getControl(index: number): FormControl {

        return this._formGenerator.getFormControlfromArray(index, this.formArray)as FormControl

    }

    onAddRemove(event: ExcelButtonResponse) {
        if (event.action == ExcelControlResponseType.ExcelAdd) {
            this.add()
        } else if (event.action == ExcelControlResponseType.ExcelRemove) {
            this.remove(event.data as number)
        } else {
            console.log()
        }
    }

    add() {
        if ((this.formArray.length === this.maxAmount)
            || this.maxAmount == 1) {
            window.alert('Exceeds the allowed number of phones!')
            return
        }
        this.formArray.push(
            this._formGenerator.createEmailControl()
        )
        this.errMessages.push('')
    }

    remove(index: number) {
        if ((this.formArray.length === 1 && this.required)
            || this.maxAmount == 1) {
            window.alert('At least one email is required!')
            return
        }
        this.formArray.removeAt(index)
        this.errMessages = [
            ...this.errMessages.slice(0, index),
            ...this.errMessages.slice(index + 1),
        ]
    }

    onChange(index: number) {
        console.log('Email')
        console.log(this.formArray.disabled)
        this.errMessages[index] = commonErrorMessage.message.substring(0)
        const control = this.getControl(index);
        if (!control.valid) return;
        if(this.formArray.value
            .filter((v: string, i: number) => 
            i !== index && v === control.value).length >0){
                this.errMessages[index] = 'The email already exists!';
                control.addValidators(errValidator);
                control.updateValueAndValidity();
                control.removeValidators(errValidator)
        }
        if(!this.beValidate) return;
        return this._employeeApiService.checkEmailExistence(
            environment.apiUrl, control.value, this._formGenerator.Guid
        ).subscribe(r => {
            console.log('Response')
            console.log(r)
            if (r.ResponseStatus !== 'Success' || r.Data) {
                this.errMessages[index] = 'The email already exists!';
                control.addValidators(errValidator);
                control.updateValueAndValidity();
                control.removeValidators(errValidator)
            }
        });
       
        
    }
   

}