
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DragDropModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" (click)="close()"></div>

      <!-- Modal Content -->
      <div cdkDrag class="relative bg-notion-bg border border-zinc-700 rounded-lg shadow-2xl w-full overflow-hidden" [ngClass]="maxWidthClass" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div cdkDragHandle class="px-6 py-4 border-b border-zinc-800 flex justify-between items-center cursor-move">
          <h3 class="text-lg font-medium text-zinc-100">{{ title }}</h3>
          <button (click)="close()" class="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800">
            <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <ng-content></ng-content>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() width: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' = 'md';
  @Output() isOpenChange = new EventEmitter<boolean>();

  get maxWidthClass() {
    switch (this.width) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      case '4xl': return 'max-w-4xl';
      case '5xl': return 'max-w-5xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-md';
    }
  }

  close() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }
}
