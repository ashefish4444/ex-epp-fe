import { Address } from "./address.model";
import { EmployeeOrganization } from "./EmployeeOrganization/EmployeeOrganization";
import { FamilyDetail } from "./FamilyDetail/FamilyDetailModel";
import { EmergencyContacts } from "./emergencycontact";
import { Nationality } from "./Nationality";

export interface Employee{
  Guid?: string;
  guid?:string,
  EmployeeNumber:string,
  // FirstName: string,
  // FatherName: string,
  // GrandFatherName: string,
  FullName: string,
  MobilePhone: string,
  Phone1: string,
  Phone2: string,
  PersonalEmail: string,
  PersonalEmail2: string,
  PersonalEmail3: string,
  DateofBirth : Date,
  Gender : string,
  Nationality?: Nationality[],
  FamilyDetails?: FamilyDetail[],
  EmployeeOrganization: EmployeeOrganization,
  EmployeeAddress?: Address[],
  EmergencyContact?: EmergencyContacts[]

}
