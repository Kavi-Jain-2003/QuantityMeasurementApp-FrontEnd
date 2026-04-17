import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  messages = signal<ToastMessage[]>([]);
  private nextId = 0;

  show(text: string, type: 'success' | 'error' = 'success', duration = 3500): void {
    const id = this.nextId++;
    this.messages.update(msgs => [...msgs, { id, text, type }]);
    setTimeout(() => this.remove(id), duration);
  }

  private remove(id: number): void {
    this.messages.update(msgs => msgs.filter(m => m.id !== id));
  }
}
