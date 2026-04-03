import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (msg of toast.messages(); track msg.id) {
        <div class="toast-msg" [class]="msg.type">{{ msg.text }}</div>
      }
    </div>
  `
})
export class ToastComponent {
  toast = inject(ToastService);
}
