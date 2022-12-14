import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import {AllPermitionData,IPermissionModel,IPermissionResponseModel,} from '../../Models/User/Permission-get.model';
import { NotificationBar } from '../../../utils/feedbacks/notification';
import { ActivatedRoute, Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CommonDataService } from '../../../../../../../libs/common-services/commonData.service';
import { PermissionService } from '../../Services/permission/permission.service';
import { fromEvent } from 'rxjs';
import { GroupSetService } from '../../Services/group-set.service';
import { GroupSetModel } from '../../Models/group-set.model';
import { environment } from './../../../../environments/environment';

export interface GroupCheckBoxItem {
  label: string;
  value: string;
  checked: boolean;
  Guid: string;
}

export interface SelecttedPermission {
  Guid: string;
  
}

@Component({
  selector: 'exec-epp-permission',
  templateUrl: './permission.component.html', 
  styleUrls: ['./permission.component.scss'],
})
export class PermissionComponent implements OnInit {
  permissionResponse?: IPermissionResponseModel;
  groupDetail? : GroupSetModel;
  permissionData:any;
  parentPermission: any;
  onePermission: any;
  allChecked = false;
  indeterminate = true;
   allModuleCecked=true;
   countSelectedModule=0;
   allModuleIntermidate=true;
  isLoding=false;
  permissionIdList: string[] = [];
  childPermissions: IPermissionModel[] = [];
  listOfPermistion: AllPermitionData[] = [];
  listOfAssignedPermistion: AllPermitionData[] = [];
  listCheckBox: GroupCheckBoxItem[] = [];
goupPermissions:IPermissionModel[] = [];
  selectedPermissionList: SelecttedPermission[] = [];
  groupName : string | undefined;
  groupId: any;
  @ViewChild('myDIVName') myDIVName: any;
  disableOutsideClick = true;

  constructor(
    public _commonData:CommonDataService,
    private _notification: NzNotificationService,
    private route: ActivatedRoute,
    private _permissionService: PermissionService,
    private notification: NotificationBar,
    private router:Router,
    private _groupSetService: GroupSetService
  ) {}

  ngOnInit(): void {

    this.groupId = this.route.snapshot.paramMap.get('id');
    this._groupSetService.LoadGroupDeatil(this.groupId).subscribe (
      (result : any) => {
        this.groupDetail = result
      }
    );
    this._permissionService.goupPermissions.forEach(element => {
      this.selectedPermissionList = [
        ...this.selectedPermissionList,
        { Guid: element.Guid },
      ];

    });
    this._permissionService.getPermission().subscribe((reponse: any) => {
      this.permissionResponse = reponse;
      this.permissionData = this.permissionResponse?.Data;
      this.permissionData.forEach((element: any) => {

        this.parentPermission = {
          Guid: element.Parent.Guid,
          PermissionCode: element.Parent.PermissionCode,
          Name: element.Parent.Name,
          value: element.Parent.KeyValue,
          label: this.firstLetterUperCaseWord(
            element.Parent.KeyValue.replace(/_/g, ' ')
          ),
          ParentCode: element.Parent.ParentCode,
          checked: false,
          indeterminate: false,
          checkAll: false,
        };
        element.Childs.forEach((element1: any) => {
          this.childPermissions = [
            ...this.childPermissions,
            {
              Guid: element1.Guid,
              PermissionCode: element1.PermissionCode,
              Name: element1.Name,
              value: element1.KeyValue,
              label: this.firstLetterUperCaseWord(
                element1.KeyValue.replace(/_/g, ' ')
              ),
              ParentCode: element1.ParentCode,
              checked: this.permissionAssigned(element1.Guid),
              indeterminate: false,
              checkAll: false,
            },
          ];
        });
        this.listOfPermistion = [
          ...this.listOfPermistion,
          {
            Parent: this.parentPermission,
            Childs: this.childPermissions.sort((a, b)=> a.PermissionCode < b.PermissionCode?-1:1),
          },
        ];
        this.childPermissions = [];
        let index=0;

        this.listOfPermistion.forEach(element => {
          if (this.listOfPermistion[index].Childs.every((item) => !item.checked)) {
            this.listOfPermistion[index].Parent.checkAll = false;
            this.listOfPermistion[index].Parent.indeterminate = false;
          } else if (
            this.listOfPermistion[index].Childs.every((item) => item.checked)
          ) {
            this.listOfPermistion[index].Parent.checkAll = true;
            this.listOfPermistion[index].Parent.indeterminate = false;
          } else {
            this.listOfPermistion[index].Parent.indeterminate = true;
            this.listOfPermistion[index].Parent.checkAll = false;
          }

          index++;
        });
       this.checkWhileAllSelected();

      });

      this.listCheckBox?.push({
        label: this.permissionData[0].Childs[0].KeyValue,
        value: this.permissionData[0].Childs[0].KeyValue,
        checked: false,
        Guid: '',
      });
      this.notification.showNotification({
        type: 'success',
        content: 'Permissions loaded successfully',
        duration: 1,
      });
    });
    this.assinedPermission();
  }
  assinedPermission() {
    if(this.groupId!=null){
    this.listOfAssignedPermistion=[];
    this._permissionService
      .getPermissionCategoryById(this.groupId)
      .subscribe((reponse: any) => {
        this.permissionResponse = reponse;
        this.permissionData = this.permissionResponse?.Data;
        this.permissionData.forEach((element: any) => {
          this.parentPermission = {
            Guid: element.Parent.Guid,
            PermissionCode: element.Parent.PermissionCode,
            Name: element.Parent.Name,
            value: element.Parent.KeyValue,
            label: this.firstLetterUperCaseWord(
              element.Parent.KeyValue.replace(/_/g, ' ')
            ),
            ParentCode: element.Parent.ParentCode,
            checked: false,
            indeterminate: false,
            checkAll: false,
          };

          element.Childs.forEach((element1: any) => {
            this.childPermissions = [
              ...this.childPermissions,
              {
                Guid: element1.Guid,
                PermissionCode: element1.PermissionCode,
                Name: element1.Name,
                value: element1.KeyValue,
                label: this.firstLetterUperCaseWord(
                  element1.KeyValue.replace(/_/g, ' ')
                ),
                ParentCode: element1.ParentCode,
                checked: false,
                indeterminate: false,
                checkAll: false,
              },
            ];
          });
          this.listOfAssignedPermistion = [
            ...this.listOfAssignedPermistion,
            {
              Parent: this.parentPermission,
              Childs: this.childPermissions,
            },
          ];
          this.childPermissions = [];
        });
          this.listOfAssignedPermistion.forEach((element) => {
            let count=0;
            this.listOfPermistion.forEach((element2) => {
              if (element.Parent.Guid == element2.Parent.Guid) {
                element.Childs.forEach((element3) => {
                  let count2=0;
                  element2.Childs.forEach((element4) => {
                    if (element3.Guid == element4.Guid) {
                      element4.checked = true;
                      this.listOfPermistion[count].Childs[count2].checked=true;

                    }
                    count2++;
                  });
                });
              }
              count++;
            });
          });

      });
    }
  }

  log(event: any) {
    this.listCheckBox[0].checked = true;
  }
  updateAllPermissionChecked(event: any, i: number): void {
    this.indeterminate = false;
    if (event) {
      this.countSelectedModule++;
      this.listOfPermistion[i].Parent.indeterminate = false;

      this.listOfPermistion[i].Childs = this.listOfPermistion[i].Childs.map(
        (item) => ({
          ...item,
          checked: true,
        })
      );

      this.listOfPermistion[i].Childs.forEach((element) => {
        let count = 0;
        this.selectedPermissionList.forEach((element2) => {
          this.checkWhileAllSelected();
          if (element.Guid == element2.Guid) {
            this.selectedPermissionList.splice(count, 1);
          }
          count++;
        });

        this.selectedPermissionList = [
          ...this.selectedPermissionList,
          { Guid: element.Guid },
        ];
      });
    } else {
      this.countSelectedModule--;
      this.listOfPermistion[i].Childs = this.listOfPermistion[i].Childs.map(
        (item) => ({
          ...item,
          checked: false,
        })
      );
      this.listOfPermistion[i].Childs.forEach((child) => {
        let count = 0;
        this.checkWhileAllSelected();
        this.selectedPermissionList.forEach((element) => {
          if (element.Guid == child.Guid) {
            this.selectedPermissionList.splice(count, 1);
          }
          count++;
        });
      });
    }

    if(this.countSelectedModule==this.listOfPermistion.length){
      this.allModuleCecked=true;
      this.allModuleIntermidate=false
     }
     else  if(0<this.countSelectedModule && this.countSelectedModule<this.listOfPermistion.length){
      this.allModuleCecked=false;
      this.allModuleIntermidate=true
     }
     else{
      this.allModuleCecked=false;
      this.allModuleIntermidate=false
     }



  }

  checkAll(event:any){


for (let i = 0; i < this.listOfPermistion.length; i++) {

    this.indeterminate = false;
    if (event) {
      this.listOfPermistion[i].Parent.indeterminate = false;
      this.listOfPermistion[i].Parent.checkAll = true;
      const allchilds = this.listOfPermistion[i].Childs;
      this.listOfPermistion[i].Childs = this.listOfPermistion[i].Childs.map(
        (item) => ({
          ...item,
          checked: true,
        })
      );

      this.listOfPermistion[i].Childs.forEach((element) => {
        let count = 0;
        this.selectedPermissionList.forEach((element2) => {
          if (element.Guid == element2.Guid) {
            this.selectedPermissionList.splice(count, 1);
          }
          count++;
        });

        this.selectedPermissionList = [
          ...this.selectedPermissionList,
          { Guid: element.Guid },
        ];
      });
    } else {
      this.listOfPermistion[i].Parent.checkAll = false;

      this.listOfPermistion[i].Childs = this.listOfPermistion[i].Childs.map(
        (item) => ({
          ...item,
          checked: false,
        })
      );
      this.listOfPermistion[i].Childs.forEach((child) => {
        let count = 0;
        this.selectedPermissionList.forEach((element) => {
          if (element.Guid == child.Guid) {
            this.selectedPermissionList.splice(count, 1);
          }
          count++;
        });
      });

  }
  this.checkWhileAllSelected();
}



  }

  


  updateSingleChecked(event: any, index: number, guid: string): void { 
    if (event) {
      let found=false;
      this.listOfPermistion[index].Childs.forEach(element => {
        if(guid==element.Guid&& element.Name=="Admin"){
          found=true;
          this.updateAllPermissionChecked(event,index)
        }
        
        //my new added
     
        if(element.ParentCode != "006")
        {
          console.log(element.value + "--->"+ element.Name);
        if(guid ==element.Guid && element.value =="Create_Client"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Client"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
            }
          })
        }
        if(guid ==element.Guid && element.value =="Update_Client"){
         
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Client"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.Name =="updategroup"){
         
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.Name == "viewgroup"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Delete_Client"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Client"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Add_User"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_User"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Update_User"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_User"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Delete_User"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_User"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Submit_Timesheet"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Timesheet"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Edit_Timesheet"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Timesheet"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Delete_Timesheet"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Timesheet"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Create_Project"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Project"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Update_Project"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Project"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Delete_Project"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Project"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Delete_Resources"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Resources"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Update_Resources"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Resources"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Assign_Resource"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Resources"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
          if(guid ==element.Guid && element.value =="Assign_Client"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Client"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Create_Employee"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Employee"){
              
              item.checked = true;          
              found=false;

              this.selectedPermissionList = [
                ...this.selectedPermissionList,
                { Guid: item.Guid,
                 },
              ];
             
            }
          })
        }
        if(guid ==element.Guid && element.value =="Update_Employee"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Employee"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Delete_Employee"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Employee"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Create_Group"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Group"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Update_Group"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Group"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Delete_Group"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Group"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value.trim() =="Remove_Client"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Client"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
      }
      else{
        console.log(element.value);
        if(guid ==element.Guid && element.value =="Create_Department"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Department"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Update_Department"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Department"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Delete_Department"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Department"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Create_Role"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Role"){
            item.checked = true;
            found=false; 

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Update_Role"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Role"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Delete_Role"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Role"){
            item.checked = true;
            found=false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
        if(guid ==element.Guid && element.value =="Create_Timesheet_Configuration"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Timesheet_Configuration"){
            item.checked = true;
            found = false;

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
            }
          })
        }
        if(guid ==element.Guid && element.value =="Update_Timesheet_Configuration"){
         
          this.listOfPermistion[index].Childs.forEach((item) =>{
           
            if(item.value == "View_Timesheet_Configuration"){
              
            item.checked = true;
            found = false;  

            this.selectedPermissionList = [
              ...this.selectedPermissionList,
              { Guid: item.Guid,
               },
            ];
          }
          })
        }
      }

      });

     if(!found){
      this.selectedPermissionList = [
        ...this.selectedPermissionList,
        { Guid: guid },
      ];
     }
    } else {
     
      let count = 0;
      this.selectedPermissionList.forEach((element) => {
        if (element.Guid == guid) {
          this.selectedPermissionList.splice(count, 1);
        }
        count++;
      });
    }

    if (this.listOfPermistion[index].Childs.every((item) => !item.checked)) {
      this.listOfPermistion[index].Parent.checkAll = false;
      this.listOfPermistion[index].Parent.indeterminate = false;
    } else if (
      this.listOfPermistion[index].Childs.every((item) => item.checked)
    ) {
      this.listOfPermistion[index].Parent.checkAll = true;
      this.listOfPermistion[index].Parent.indeterminate = false;
    } else {
      this.listOfPermistion[index].Parent.indeterminate = true;
      this.listOfPermistion[index].Parent.checkAll = false;
    }
    this.checkWhileAllSelected();
  }
  firstLetterUperCaseWord(word: string) {
    let fullPhrase = '';
    const wordLists = word.split(' ');
    wordLists.forEach((element) => {
      try {
        let titleCase='';
       if(element=="for" || element =="to"){
         titleCase =
        element[0].toLowerCase() + element.substr(1).toLowerCase();
       }
       else{
         titleCase =
        element[0].toUpperCase() + element.substr(1).toLowerCase();
       }
      fullPhrase = fullPhrase + ' ' + titleCase;
      } catch (error) {
        console.log();

      }
    });
    if(wordLists.length==0){
fullPhrase= word[0].toUpperCase() + word.substr(1).toLowerCase();
    }
    return fullPhrase;
  }
  updatePermission() {
    this.isLoding=true;
    this.selectedPermissionList.forEach((element) => {
      this.permissionIdList = [...this.permissionIdList, element.Guid];
    });
    const postData = {
      GroupSetId: this.groupId,
      PermissionIDArray: this.permissionIdList,
    };
    this._permissionService
      .addGroupPermission(postData)
      .subscribe((data: any) => {
        this._notification.create(
          data.ResponseStatus.toLowerCase(),
          data.ResponseStatus,
          data.Message
        );
        this.isLoding=true;
        this._commonData.getPermission(environment.apiUrl);
       this.router.navigateByUrl("usermanagement/group-detail/"+this.groupId)
      
      });
      

  }

  permissionAssigned(id:string){
    let bool=false;
    this._permissionService.goupPermissions.forEach(element => {
      if(id==element.Guid){
       bool=true;
      }
    });
    return bool;
  }
  cancelPermission(){

    this.router.navigateByUrl("usermanagement/group-detail/"+this.groupId)
  }

  showModal(): void {
    this.isLoding = true;
  }

  handleOk(): void {
    console.log('Button ok clicked!');
   // this.isLoding = false;
  }

  handleCancel(): void {
    console.log('Button cancel clicked!');
  //  this.isLoding = false;
  }

  checkWhileAllSelected(){
   let interm=0;
   let check=0;
   this.allModuleIntermidate=true
      this.listOfPermistion.forEach(element => {
        if(element.Parent.indeterminate){
          interm++;

        }
        if(element.Parent.checkAll){
         check++;

        }

           if(check==this.listOfPermistion.length){
            this.allModuleCecked=true;
            this.allModuleIntermidate=false
           }
           else  if(interm>0){
            this.allModuleCecked=false;
            this.allModuleIntermidate=true
           }
           else{
            this.allModuleCecked=false;
            this.allModuleIntermidate=false
           }

      });
  }
}
