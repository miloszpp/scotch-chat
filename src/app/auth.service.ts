import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Observable } from 'rxjs/Observable';
import { User } from './model';

@Injectable()
export class AuthService {
  constructor(private afAuth: AngularFireAuth) { }

  getUserStream(): Observable<User> {
    return this.afAuth.authState.map(state => state ? <User>{ name: state.email } : null);
  }

  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  logout() {
    this.afAuth.auth.signOut();
  }
}
