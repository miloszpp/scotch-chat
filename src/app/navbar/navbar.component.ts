import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Observable } from 'rxjs/Observable';
import { User } from '../model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  userStream: Observable<User>;

  constructor(private authService: AuthService) {
    this.userStream = authService.getUserStream();
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }
}
