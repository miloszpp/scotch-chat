import { Component } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { User } from './model';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  template: `
<div class="container">
  <app-navbar></app-navbar>
  <div *ngIf="userStream | async; let user">
    <app-message-list [user]="user"></app-message-list>
    <app-message-add [user]="user"></app-message-add>
  </div>
</div>
  `
})
export class AppComponent {
  userStream: Observable<User>;

  constructor(private authService: AuthService) {
    this.userStream = authService.getUserStream();
  }
}