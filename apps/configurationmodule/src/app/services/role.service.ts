import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, RolePostModel } from '../models/role';
import { Pagination } from '../models/pagination';
import { ResponseDto, ResponseDTO } from '../models/response-dto.model';


@Injectable({
  providedIn: 'root'
})
export class RoleService {
  baseUrl = environment.apiUrl;
  roles:Role[] = [];

  constructor(private http: HttpClient) { }

  getRole(id: string): Observable<ResponseDTO<RolePostModel>> {
    return this.http.get<ResponseDTO<RolePostModel>>(this.baseUrl + "Role/Get?id="+ id);
  }

  getRoles(index: number, searchKey: string, sortBy: string, sortOrder: string): Observable<Pagination> {
    index = index ?? 1;

    let params = new HttpParams()
      .append('PageIndex', `${index}`);
    if(searchKey) {
      params= params.append('searchKey', `${searchKey}`);
    }
    if(sortBy) {
      params = params.append('sortBy', `${sortBy}`);
    }
    
    if(sortOrder) {
      params =params.append('sortOrder',`${sortOrder}`);
    }

    return this.http.get<Pagination>(this.baseUrl + "Role?"+params.toString());
  }

  addRole(role: Role): Observable<ResponseDTO<Role>> {
    return this.http.post<ResponseDTO<Role>>(this.baseUrl + "Role", role);
  }

  updateRole(role: Role, id: string): Observable<ResponseDTO<Role>> {
    role.Guid = id;
    return this.http.put<ResponseDTO<Role>>(this.baseUrl + "Role", role);
  }

  deleteRole(id: string): Observable<ResponseDTO<Role>> {
    return this.http.delete<ResponseDTO<Role>>(this.baseUrl + "Role/?id="+ id);
  }

  checkifRoleisDeletable(id:string) : Observable<any>{
    return this.http.get<any>(this.baseUrl+"Employee/checkRole/?idNumber="+id);
  }

}
