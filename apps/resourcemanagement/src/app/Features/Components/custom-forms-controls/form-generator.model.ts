import { AbstractControl, AsyncValidator, FormArray, FormBuilder, FormControl, FormGroup, ValidatorFn } from "@angular/forms";
import { Address, Addresss } from "../../Models/address.model";
import { CountriesMockService } from "../../Services/external-api.services/countries.mock.service";
import { EmergencyContacts } from "../../Models/emergencycontact";
import { Observable, of } from "rxjs";
import { commonErrorMessage, resetError, validateAddressNonRequired, validateAddressRequired, validateCity, validateEmailAddress, validateEmployeeIdNumber, validateFullName, validateFirstName, validateMiddleName, validatePhoneNumber, validateRequired } from "./shared/custom.validators";

import { Employee } from "../../Models/Employee";
import { EmployeeOrganization } from "../../Models/EmployeeOrganization/EmployeeOrganization";
import { FamilyDetail } from "../../Models/FamilyDetail/FamilyDetailModel";
import { FormGeneratorAssistant } from "./form-generator-assistant.service";
import { Directive, Injectable } from "@angular/core";
import { Nationality } from "../../Models/Nationality";
import { Relationship } from "../../Models/Relationship";
import { EmployeeService } from "../../Services/Employee/EmployeeService";
import { NzNotificationService } from "ng-zorro-antd/notification";
import { Router } from "@angular/router";
import { PermissionListService } from "libs/common-services/permission.service";
import { EmployeeApiService } from "@exec-epp/core-services/employees-services";
import { HttpClient } from "@angular/common/http";
import { ResponseStatus } from "@exec-epp/core-services/a-base-services";
import { map } from "rxjs/operators";

@Injectable({
    providedIn: 'root',
})
@Directive({
    providers: [
        HttpClient,
        { provide: EmployeeApiService, useClass: EmployeeApiService, deps: [HttpClient], multi: false }
    ]
})
export class FormGenerator extends FormGeneratorAssistant {

    public readonly countriesData$: Observable<string[]> = of(['+1', '+251'])

    public personalDetailsForm: FormGroup
    public organizationalForm: FormGroup
    public addressForm: FormGroup
    public emergencyContact: FormGroup
    public emergencyAddress: FormGroup
    public familyDetail: FormGroup

    public allAddresses: Address[] = []
    public allFamilyDetails: FamilyDetail[] = []
    public allEmergencyContacts: EmergencyContacts[] = []
    public employeId = "";
    public readonly address: Address[] = []

    private emplyeeNumber = '';

    private _status = 'Active'
    private _isEdit = false
    public isProfile = false;
    private _validate = false;
    private _employee?: Employee;
    public Guid?: string;
    public useremail:any;

    get IsEdit(): boolean {
        return this._isEdit
    }
    get Validate(): boolean {
        return this._validate
    }

    constructor(
        private readonly _formBuilder: FormBuilder,
        private readonly _employeeService: EmployeeService,
        addressCountryService: CountriesMockService,
        private notification: NzNotificationService,
        private _router: Router,
        private _permissionService: PermissionListService
    ) {
        super(
            addressCountryService
        )
        this.personalDetailsForm = this._createPersonalDetailsForm()
        this.organizationalForm = this._createOrganizationalnalDetailsForm()
        this.addressForm = this._createAddressDetailsForm()
        this.emergencyContact = this._createEmergencyContactDetailsForm()
        this.emergencyAddress = this._createEmergencyAddressDetailsForm()
        this.familyDetail = this._createFamilyDetailsForm()

    }

    private _enableForms() {
        this.organizationalForm.enable();
        this.personalDetailsForm.enable();
    }

    private _disableForms() {

        if (this.isProfile) {
            this.organizationalForm.disable();
            this.personalDetailsForm.disable();
            if (this._permissionService.authorizedPerson('Update_My_Profile')) {
                this.personalDetailsForm.get('phoneNumbers')?.enable();
                this.personalDetailsForm.get('emailAddresses')?.enable()
            }
        } else if (this.IsEdit) {
            this.personalDetailsForm.get('employeeIdNumber')?.disable();
            
         
        } else {
            this.organizationalForm.get('status')?.disable();
        }

       
    }

    

    validatePersonalDetail() {
        this._validate = true;
        let valid = true;
        this._enableForms();
        if (!this.personalDetailsForm.valid) {
            this.personalDetailsForm.updateValueAndValidity();
            valid = false;
        }
        this._disableForms();
        return valid;
    }

    validateOrganizationalDetail() {
        let valid = true;
        this._validate = true;
        this._enableForms();
        if (!this.organizationalForm.valid) {
            this.organizationalForm.updateValueAndValidity();
            valid = false;
        }
        this._disableForms();

      
        
        return valid;
    }

    save() {
        this._validate = true;
        this._enableForms()
        let employee: Employee = {} as Employee
        employee = {
            ...employee,
            ...this.getModelPersonalDetails(),
            EmployeeOrganization: {
                ...this.getModelOrganizationDetails(),
                ...(this._employeeService.isEdit ? {} : { Status: 'Active' })
            },
            EmployeeAddress: this.allAddresses,
            FamilyDetails: this.allFamilyDetails,
            EmergencyContact: this.allEmergencyContacts
        } as Employee
        this._disableForms()
        this._employeeService.empNum = employee.EmployeeNumber;
        this._employeeService.add(employee)
            .subscribe((response: any) => {
                this._employeeService.isdefault = true;
                this.notification.create(
                    response.ResponseStatus.toLowerCase(), "", response.Message
                );
            },
                (error) => {
                    this.notification.create(
                        "error", "Save Failed", error.message
                    );
                }


            )
        this._validate = false;

    }
    
    updateOneEmployee() {
        this._enableForms()
        let employee: Employee = {} as Employee
        employee = {
            ...employee,
            EmployeeNumber: this.emplyeeNumber,
            ...this.getModelPersonalDetails(),
            EmployeeOrganization: this.getModelOrganizationDetails(),
            EmployeeAddress: this.allAddresses,
            FamilyDetails: this.allFamilyDetails,
            EmergencyContact: this.allEmergencyContacts
        } as Employee
        this._disableForms()
        this._employeeService.empNum = employee.EmployeeNumber;
        this._employeeService.update(employee)
            .subscribe((response: any) => {
                this._employeeService.isdefault = true;
                this.notification.create(
                    response.ResponseStatus.toLowerCase(), "", response.Message
                );
            },
                (error) => {
                    this.notification.create(
                        "error", "Update Failed", error.message
                    );
                }


            )
        this._validate = false;

    }

    getModelPersonalDetails() {

        const value = this.personalDetailsForm.value
        this._employeeService.empNum = value.employeeIdNumber;

        return {
            guid: this.employeId,
            EmployeeNumber: value.employeeIdNumber,
            // FirstName: value.fullName.firstName,
            // FatherName: value.fullName.middleName,
            // GrandFatherName: value.fullName.lastName,
            FullName: value.fullName,
            Gender: value.gender,
            PersonalEmail: value.emailAddresses[0],
            PersonalEmail2: value.emailAddresses.length > 1 ? value.emailAddresses[1] : undefined,
            PersonalEmail3: value.emailAddresses.length > 2 ? value.emailAddresses[2] : undefined,
            MobilePhone: value.phoneNumbers[0].prefix + value.phoneNumbers[0].phone,
            Phone1: value.phoneNumbers.length > 1 ? value.phoneNumbers[1].prefix + value.phoneNumbers[1] : undefined,
            Phone2: value.phoneNumbers.length > 2 ? value.phoneNumbers[2].prefix + value.phoneNumbers[2] : undefined,
            DateofBirth: value.dateofBirth,
            Nationality: value.nationalities && value.nationalities.length > 0 ? value.nationalities.map((nationality: string) => {
                return {
                    Name: nationality
                }
            }) : [],
        } as Partial<Employee>
    }
    getModelOrganizationDetails() {
        const value = this.organizationalForm.value
        let temprepmanager = "";
       
        if (value.reportingManager == null) {
            console.log("it was empty");
            temprepmanager = "00000000-0000-0000-0000-000000000000";
        }
        else {
            temprepmanager = value.reportingManager;
        }
        
        return {
            CountryId: value.country,
            DutyBranchId: value.dutyStation,
            CompaynEmail: value.companyEmail[0], 
            JobTitleId: value.jobTitle,
            DepartmentId: value.department,

            ReportingManager: temprepmanager,//value.reportingManager,
            EmploymentType: value.employeementType,
            JoiningDate: value.joiningDate,
            TerminationDate: value.terminationDate,
            Status: value.status
        } as Partial<EmployeeOrganization>
    }
    getModelAddressDetails() {
        const value = this.addressForm.value
        return {
            Guid: value.guid,
            Country: value.country,
            StateRegionProvice: value.state,
            City: value.city,
            SubCityZone: value.subCityZone,
            Woreda: value.woreda,
            HouseNumber: value.houseNumber,
            PostalCode: value.postalCode
        } as Partial<Address>
    }
    getModelFamilyDetails() {
        const value = this.familyDetail.value
        return [{
            Guid: value.guid,
            FullName: value.fullName.firstName + ' ' + value.fullName.middleName + ' ' + value.fullName.lastName,
            Relationship: { Name: value.relationship } as Relationship,
            Gender: value.gender,
            DoB: value.dateofBirth
        }] as Partial<FamilyDetail>

    }
    getModelEmergencyContactDetails() {
        const value = this.emergencyContact.value
        const valueAddress = this.emergencyAddress.value
        return {
            Guid: value.guid,
            FirstName: value.fullName.firstName,
            FatherName: value.fullName.middleName,
            GrandFatherName: value.fullName.lastName,
            Relationship: value.relationship,
            PhoneNumber: value.phoneNumbers[0].prefix + value.phoneNumbers[0].phone,
            phoneNumber2: value.phoneNumbers.length > 1 ? value.phoneNumbers[1].prefix + value.phoneNumbers[1].phone : undefined,
            phoneNumber3: value.phoneNumbers.length > 2 ? value.phoneNumbers[2].prefix + value.phoneNumbers[2].phone : undefined,
            email: value.emailAddresses[0],
            email2: value.emailAddresses.length > 1 ? value.emailAddresses[1] : undefined,
            email3: value.emailAddresses.length > 2 ? value.emailAddresses[2] : undefined,
            Country: valueAddress.country,
            stateRegionProvice: valueAddress.state,
            city: valueAddress.city,
            subCityZone: valueAddress.subCityZone,
            woreda: valueAddress.woreda,
            houseNumber: valueAddress.houseNumber,
            postalCode: valueAddress.postalCode
        } as Partial<EmergencyContacts>

    }

    private _createPersonalDetailsForm() {
        return this._formBuilder.group({
            employeeIdNumber: [null, validateRequired],
            fullName: [null, validateRequired], // this._createFullNameFormGroup(),
            gender: [null, validateRequired],
            dateofBirth: [null, validateRequired],
            emailAddresses: this._formBuilder.array([
                this.createEmailControl()
            ]),
            phoneNumbers: this._formBuilder.array([
                this.createPhoneNumberFormGroup()
            ]),
            nationalities: [null]
        });
    }

    private _createOrganizationalnalDetailsForm() {


        return this._formBuilder.group({
            country: [null, validateRequired],
            dutyStation: [null, validateRequired],
            companyEmail: this._formBuilder.array([
                this.createEmailControl()
            ]),
            jobTitle: [null, validateRequired],
            department: [null, validateRequired],
            reportingManager: [null],
            employeementType: [null, validateRequired],
            joiningDate: [null, validateRequired],
            terminationDate: [null],
            status: ['Active', validateRequired]
        });
    }

    private _createAddressDetailsForm() {
        return this._formBuilder.group({
            guid: [null],
            country: [null, validateRequired],
            state: [null],
            city: [null, validateCity],
            subCityZone: [null, validateAddressRequired],
            woreda: [null, validateAddressNonRequired],
            houseNumber: [null, validateAddressNonRequired],
            postalCode: [null, validateAddressNonRequired]
        });
    }

    private _createFamilyDetailsForm() {
        return this._formBuilder.group({
            guid: [null],
            relationship: [null, validateRequired],
            fullName: this._createFullNameFormGroup(),
            gender: [null],
            dateofBirth: [null]
        });
    }

    private _createEmergencyContactDetailsForm() {
        return this._formBuilder.group({
            guid: [null],
            fullName: this._createFullNameFormGroup(),
            relationship: [null, validateRequired],
            emailAddresses: this._formBuilder.array([
                this.createEmailControl()
            ]),
            phoneNumbers: this._formBuilder.array([
                this.createPhoneNumberFormGroup()
            ]),
        });
    }

    private _createEmergencyAddressDetailsForm() {
        return this._formBuilder.group({
            country: [null, validateRequired],
            state: [null],
            city: [null, validateCity],
            subCityZone: [null, validateAddressRequired],
            woreda: [null, validateAddressNonRequired],
            houseNumber: [null, validateAddressNonRequired],
            postalCode: [null, validateAddressNonRequired],
        });
    }


    private _createEmployeeIdNumberFormGroup() {
        const segments = this._extractEmployeeIdNumber()
        console.log('Id Number')
        console.log(segments)
        return this._formBuilder.group({
            prefix: [segments.prefix],
            idNumber: [null, [validateEmployeeIdNumber]],
        })
    }

    private _createFullNameFormGroup() {
        return this._formBuilder.group({
            firstName: [null, [validateFirstName]],
            middleName: [null, [validateMiddleName]],
            lastName: [null, [validateFirstName]],
        })
    }

    createEmailControl() {
        return this._formBuilder.control(
            null,
            [validateEmailAddress]
        )
    }

    createPhoneNumberFormGroup() {
        const segments = this._extractPhoneNumber()
        return this._formBuilder.group({
            prefix: [segments.prefix],
            phone: [segments.value, [validatePhoneNumber]],
        })
    }

    getFormControl(name: string, formGroup: FormGroup): FormControl {
        return formGroup.get(name) as FormControl
    }

    getFormArray(name: string, formGroup: FormGroup): FormArray {
        return formGroup.get(name) as FormArray
    }

    getFormControlfromArray(index: number, formArray: FormArray): FormControl | undefined {
        if (index >= formArray.length) {
            return undefined
        }
        return formArray.at(index) as FormControl
    }

    getFormGroupfromArray(index: number, formArray: FormArray): FormGroup | undefined {
        if (index >= formArray.length) {
            return undefined
        }
        return formArray.at(index) as FormGroup
    }

    getFormGroup(name: string, formGroup: FormGroup): FormGroup {
        return formGroup.get(name) as FormGroup
    }

    private _setControlValue(value: any, control?: FormControl) {
        if (control) {
            control.setValue(value)
        }
    }

    private _setEmployeeIdNumber(employeeIdNumber: string, formGroup: FormGroup) {
        this._setControlValue(employeeIdNumber, this.getFormControl('employeeIdNumber', formGroup))
    }

    private _setFullName(fullName: string, formGroup: FormGroup) {
        this._setControlValue(fullName, this.getFormControl('fullName', formGroup));
    }

    private _setNames(first: string | null, middle: string | null | undefined, last: string | null, formGroup: FormGroup) {
        this._setControlValue(first, this.getFormControl('firstName', formGroup))
        this._setControlValue(middle, this.getFormControl('middleName', formGroup))
        this._setControlValue(last, this.getFormControl('lastName', formGroup))
    }

    private _setPhoneNumber(phoneNumber: string, formGroup: FormGroup) {
        const segemets = this._extractPhoneNumber(phoneNumber)
        if (segemets.value !== null) {
            this._setControlValue(segemets.prefix, this.getFormControl('prefix', formGroup))
            this._setControlValue(segemets.value, this.getFormControl('phone', formGroup))
        }
    }

    private _setEmailArray(emails: string[] | null, formArray: FormArray) {
        if (emails !== null && emails.length > 0) {
            for (let i = 0; i < emails.length; i++) {
                const existingControl = this.getFormControlfromArray(i, formArray)
                if (existingControl !== undefined) {
                    this._setControlValue(emails[i], existingControl)
                } else {
                    const newControl = this.createEmailControl()
                    this._setControlValue(emails[i], newControl)
                    formArray.push(newControl)
                }
            }
        }
        
           
    }

    private _setPhoneArray(phoneNumbers: string[], formArray: FormArray) {
        for (let i = 0; i < phoneNumbers.length; i++) {
            const existingFormGroup = this.getFormGroupfromArray(i, formArray)
            if (existingFormGroup !== undefined) {
                this._setPhoneNumber(phoneNumbers[i], existingFormGroup)
            } else {
                const newFormGroup = this.createPhoneNumberFormGroup()
                this._setPhoneNumber(phoneNumbers[i], newFormGroup)
                formArray.push(newFormGroup)
            }
        }
    }

    private _setPresonalDetail(employee: Employee) {
        this._setEmployeeIdNumber(
            employee.EmployeeNumber,
            this.personalDetailsForm
        )
        this._setControlValue(employee.FullName, this.getFormControl('fullName', this.personalDetailsForm));
        // this._setNames(
        //     employee.FirstName,
        //     employee.FatherName,
        //     employee.GrandFatherName,
        //     this.getFormGroup('fullName', this.personalDetailsForm)
        // )
        // this._setFullName(
        //     employee.FullName,
        //     this.personalDetailsForm
        // )
        this._setControlValue(
            employee.Gender,
            this.getFormControl('gender', this.personalDetailsForm)
        )
        this._setControlValue(
            employee.DateofBirth,
            this.getFormControl('dateofBirth', this.personalDetailsForm)
        )

        const emailArray: string[] = [employee.PersonalEmail]
        if (employee.PersonalEmail2 && employee.PersonalEmail2 !== null && employee.PersonalEmail2 !== '') {

            emailArray.push(employee.PersonalEmail2)
        }
        if (employee.PersonalEmail3 && employee.PersonalEmail3 !== null && employee.PersonalEmail3 !== '') {

            emailArray.push(employee.PersonalEmail3)
        }
        this._setEmailArray(
            emailArray,
            this.getFormArray('emailAddresses', this.personalDetailsForm)
        )

        const phonerray: string[] = [];//[employee.MobilePhone]
        if (employee.Phone1 && employee.Phone1 !== null && employee.Phone1 !== '') {

            phonerray.push(employee.MobilePhone)
        }
        if (employee.Phone2 && employee.Phone2 !== null && employee.Phone2 !== '') {

            phonerray.push(employee.Phone2)
        }
        if (employee.MobilePhone && employee.MobilePhone !== null && employee.MobilePhone !== '') {
            phonerray.push(employee.MobilePhone);
        }

        this._setPhoneArray(
            phonerray,
            this.getFormArray('phoneNumbers', this.personalDetailsForm)
        )


        this._setControlValue(
            employee.Nationality?.map(nationality => nationality.Name),
            this.getFormControl('nationalities', this.personalDetailsForm)
        )
        //  this.errorMessageforPersonalDetails(
        //      this.personalDetailsForm
        //  )
    }

    private _setOrganizationalDetail(organizationalDetail: EmployeeOrganization) {
        this._setControlValue(
            organizationalDetail.CountryId,
            this.getFormControl('country', this.organizationalForm)
        )
        this._setControlValue(
            organizationalDetail.DutyBranchId,
            this.getFormControl('dutyStation', this.organizationalForm)
        )
        this._setEmailArray(
            [
                organizationalDetail.CompaynEmail
            ],
            this.getFormArray('companyEmail', this.organizationalForm)
        )
        this._setControlValue(
            organizationalDetail.DepartmentId,
            this.getFormControl('department', this.organizationalForm)
        )
        this._setControlValue(
            organizationalDetail.JobTitleId,
            this.getFormControl('jobTitle', this.organizationalForm)
        )
        this._setControlValue(
            organizationalDetail.ReportingManager,
            this.getFormControl('reportingManager', this.organizationalForm)
        )
        this._setControlValue(
            organizationalDetail.EmploymentType,
            this.getFormControl('employeementType', this.organizationalForm)
        )
        this._setControlValue(
            organizationalDetail.JoiningDate,
            this.getFormControl('joiningDate', this.organizationalForm)
        )
        this._setControlValue(
            organizationalDetail.TerminationDate,
            this.getFormControl('terminationDate', this.organizationalForm)
        )

        this._setControlValue(
            organizationalDetail.Status,
            this.getFormControl('status', this.organizationalForm)
        )
        this.errorMessageforOrganizationDetails(
            this.organizationalForm
        )
        if (this.isProfile) {
            this.organizationalForm.disable({ onlySelf: true });
        }
        
    }

    private _setAddressDetail(address: Address) {
        this._setControlValue(
            address.Guid,
            this.getFormControl('guid', this.addressForm)
        )
        this._setControlValue(
            address.Country,
            this.getFormControl('country', this.addressForm)
        )
        this._setControlValue(
            address.StateRegionProvice,
            this.getFormControl('state', this.addressForm)
        )
        this._setControlValue(
            address.City,
            this.getFormControl('city', this.addressForm)
        )
        this._setControlValue(
            address.SubCityZone,
            this.getFormControl('subCityZone', this.addressForm)
        )
        this._setControlValue(
            address.Woreda,
            this.getFormControl('woreda', this.addressForm)
        )
        this._setControlValue(
            address.HouseNumber,
            this.getFormControl('houseNumber', this.addressForm)
        )
        this._setControlValue(
            address.PostalCode,
            this.getFormControl('postalCode', this.addressForm)
        )
        this.errorMessageforAddressDetails(
            this.addressForm
        )
    }

    private _setEmergencyContactDetail(emergencyContact: EmergencyContacts) {

        this._setControlValue(
            emergencyContact.Guid,
            this.getFormControl('guid', this.emergencyContact)
        )

        if (emergencyContact.FirstName && emergencyContact.FatherName) {
            this._setNames(
                emergencyContact.FirstName,
                emergencyContact.FatherName,
                emergencyContact.GrandFatherName,
                this.getFormGroup('fullName', this.emergencyContact)
            )
        }
        this._setControlValue(
            emergencyContact.Relationship,
            this.getFormControl('relationship', this.emergencyContact)
        )
        const emailArray: string[] = [emergencyContact.email]
        if (emergencyContact.email2 && emergencyContact.email2 !== null && emergencyContact.email2 !== '') {
            emailArray.push(emergencyContact.email2)
        }
        if (emergencyContact.email3 && emergencyContact.email3 !== null && emergencyContact.email3 !== '') {
            emailArray.push(emergencyContact.email3)
        }
        this._setEmailArray(
            emailArray,
            this.getFormArray('emailAddresses', this.emergencyContact)
        )

        const phonerray: string[] = [emergencyContact.PhoneNumber]
        if (emergencyContact.phoneNumber2 && emergencyContact.phoneNumber2 !== null && emergencyContact.phoneNumber2 !== '') {
            phonerray.push(emergencyContact.phoneNumber2)
        }
        if (emergencyContact.phoneNumber3 && emergencyContact.phoneNumber3 !== null && emergencyContact.phoneNumber3 !== '') {
            phonerray.push(emergencyContact.phoneNumber3)
        }
        this._setPhoneArray(
            phonerray,
            this.getFormArray('phoneNumbers', this.emergencyContact)
        )
        this._setControlValue(
            emergencyContact.Country,
            this.getFormControl('country', this.emergencyAddress)
        )
        this._setControlValue(
            emergencyContact.stateRegionProvice,
            this.getFormControl('state', this.emergencyAddress)
        )
        this._setControlValue(
            emergencyContact.city,
            this.getFormControl('city', this.emergencyAddress)
        )


        this._setControlValue(
            emergencyContact.subCityZone,
            this.getFormControl('subCityZone', this.emergencyAddress)
        )
        this._setControlValue(
            emergencyContact.woreda,
            this.getFormControl('woreda', this.emergencyAddress)
        )
        this._setControlValue(
            emergencyContact.houseNumber,
            this.getFormControl('houseNumber', this.emergencyAddress)
        )
        this._setControlValue(
            emergencyContact.postalCode,
            this.getFormControl('postalCode', this.emergencyAddress)
        )
        this.errorMessageforEmergencyContactDetails(
            this.emergencyContact,
            this.emergencyAddress
        )
    }

    private _setFamilyDetail(familyDetail: FamilyDetail) {debugger;
        let names: (string | null)[] = familyDetail.FullName.split(' ')
        if (names.length === 2) names = [names[0], null, names[1]]
        this._setControlValue(
            familyDetail.Guid,
            this.getFormControl('guid', this.familyDetail)
        )
        this._setNames(
            names[0], names[1], names[2],
            this.getFormGroup('fullName', this.familyDetail)
        )
        this._setControlValue(
            familyDetail.Relationship?.Name,
            this.getFormControl('relationship', this.familyDetail)
        )
        this._setControlValue(
            familyDetail.Gender,
            this.getFormControl('gender', this.familyDetail)
        )
        this._setControlValue(
            familyDetail.DateofBirth,
            this.getFormControl('dateofBirth', this.familyDetail)
        )
        this.errorMessageforFamilyDetails(
            this.familyDetail
        )
    }

    private _regenerateForm() {
        this.personalDetailsForm = this._createPersonalDetailsForm()
        this.organizationalForm = this._createOrganizationalnalDetailsForm()
        this.addressForm = this._createAddressDetailsForm()
        this.emergencyContact = this._createEmergencyContactDetailsForm()
        this.familyDetail = this._createFamilyDetailsForm()
    }

    // eslint-disable-next-line no-debugger
    generateForms(employee?: Employee) {
        this._employee = employee;
        this.Guid = employee?.Guid
        this._regenerateForm()
        if (employee) {
            this._validate = true;
            this.emplyeeNumber = employee.EmployeeNumber;
            this._isEdit = true
            this._setPresonalDetail(employee)
            if (employee?.EmployeeOrganization) {
                this._setOrganizationalDetail(employee?.EmployeeOrganization)
            }
            if (employee?.EmployeeAddress) {
                this.allAddresses = employee.EmployeeAddress
            }
            if (employee?.FamilyDetails) {
                this.allFamilyDetails = employee?.FamilyDetails
            }
            if (employee?.EmergencyContact) {
                this.allEmergencyContacts = employee?.EmergencyContact
            }
            this._validate = true;
        } else {
            this._isEdit = false
            this._validate = false;
        }
        this._disableForms()
    }

    generateAddressForm(address?: Addresss) {
        this.addressForm = this._createAddressDetailsForm()
        if (address) {
            this._setAddressDetail(address)
        }
    }

    generateEmergencyContactForm(emergencyContact?: EmergencyContacts) {
        this.emergencyContact = this._createEmergencyContactDetailsForm()
        this.emergencyAddress = this._createEmergencyAddressDetailsForm()
        if (emergencyContact) {
            this._setEmergencyContactDetail(emergencyContact)
        }
    }

    generateFamilyDetailForm(familyDetail?: FamilyDetail) {
        this.familyDetail = this._createFamilyDetailsForm()
        if (familyDetail) {
            this._setFamilyDetail(familyDetail)
        }
    }

    triggerControlValidation(control: AbstractControl, required: boolean) {
        resetError(required)
        const value = control.value
        control.setValue(null)
        control.setValue(value)
        return commonErrorMessage.message.substring(0)
    }

    private _formValidation(formGroup: FormGroup) {
        this._enableForms();
        const value = formGroup.value;
        formGroup.reset();
        formGroup.setValue(value);
        this._disableForms();
    }

    errorMessageforPersonalDetails(formGroup: FormGroup) {
        this._formValidation(formGroup);
    }

    errorMessageforOrganizationDetails(formGroup: FormGroup) {
        this._formValidation(formGroup);
    }

    errorMessageforAddressDetails(formGroup: FormGroup) {
        this._formValidation(formGroup);
    }

    errorMessageforFamilyDetails(formGroup: FormGroup) {
        this._formValidation(formGroup);
    }

    errorMessageforEmergencyContactDetails(emergencyGroup: FormGroup, addressGroup: FormGroup) {
        this._formValidation(emergencyGroup);
        this._formValidation(addressGroup);

    }

    private readonly _apiWait = (condition: { done: boolean }) => {
        for (let i = 0; i < 20 && !condition.done; i++) {
            setTimeout(() => { }, 100);
        }
    }

}
