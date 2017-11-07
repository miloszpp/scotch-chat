import { Component, OnInit, Input } from '@angular/core';
import { MessageService } from '../message.service';
import { Observable } from 'rxjs/Observable';
import { Message, User } from '../model';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html'
})
export class MessageListComponent implements OnInit {
  @Input() user: User;
  
  messages: Observable<Message[]>;

  constructor(private messageService: MessageService) { }

  ngOnInit() {
    this.messages = this.messageService.getMessagesStream();
  }
}
