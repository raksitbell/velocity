import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex flex-col items-center justify-center p-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p *ngIf="message" class="text-gray-600 font-medium animate-pulse">{{ message }}</p>
    </div>
  `
})
export class LoadingComponent {
    @Input() message: string = 'Loading...';
}
