import { Component, OnInit } from '@angular/core';

import { UserService } from './timesheet/services/user.service';

@Component({
  selector: 'exec-epp-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'timesheet';

  constructor(private userService: UserService) {
    let userId = '176e8f56-e1e4-4259-83ec-69f401b69550';
    localStorage.setItem("userId", userId);

    let supervisorId = "1b38f8be-e7dc-495f-ace3-c87f2332b063";
    localStorage.setItem("supervisorId", supervisorId);
  }

  ngOnInit(): void {

  }
}
