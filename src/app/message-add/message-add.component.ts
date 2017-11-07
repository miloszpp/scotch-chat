import { Component, OnInit, Input } from '@angular/core';
import { MessageService } from '../message.service';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { User } from '../model';

@Component({
  selector: 'app-message-add',
  templateUrl: './message-add.component.html'
})
export class MessageAddComponent {
  @Input() user: User;

  constructor(
    private messageService: MessageService,
    private toastr: ToastrService
  ) { }

  sendMessage(form: NgForm) {
    this.messageService.add(form.value.content, this.user.name).then(
      () => { form.resetForm(); this.toastr.success("Message sent!"); },
      () => { this.toastr.error("Sending message failed"); }
    );
  }

}
