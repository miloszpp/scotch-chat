import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Message } from './model';
import { Observable } from 'rxjs/Observable';
import * as firebase from 'firebase/app';

@Injectable()
export class MessageService {
  messages: AngularFireList<Message>;

  constructor(private db: AngularFireDatabase) {
    this.messages = this.db.list<Message>(
      'messages', 
      ref => ref.orderByChild('timestamp').limitToLast(10)
    );
  }

  getMessagesStream(): Observable<Message[]> {
    return this.messages.valueChanges();
  }

  add(content: string, author: string): PromiseLike<any> {
    return this.messages.push(<Message>{
      author: author,
      content: content,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  }
}
