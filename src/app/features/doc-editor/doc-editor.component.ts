import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-doc-editor',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-white flex justify-center">
      <div class="w-full max-w-4xl px-12 py-16">
         <!-- Cover Image Placeholder -->
         <div class="h-48 w-full bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 rounded-lg mb-8 opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer group relative">
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 font-medium text-white shadow-sm">Change Cover</div>
         </div>

         <!-- File Title -->
         <input type="text" class="w-full text-5xl font-bold text-gray-900 placeholder-gray-300 border-none focus:ring-0 p-0 mb-8" placeholder="Untitled" value="Project Specification">

         <!-- Editor Controls -->
         <div class="flex items-center space-x-4 mb-8 text-gray-400 border-b pb-4">
             <button class="hover:text-gray-900 font-medium text-sm">+ Add Icon</button>
             <button class="hover:text-gray-900 font-medium text-sm">+ Add Property</button>
             <div class="flex-1"></div>
             <span class="text-xs">Edited just now</span>
         </div>
         
         <!-- Editor Content (Simulated) -->
         <div class="prose prose-lg max-w-none space-y-4 outline-none" contenteditable="true">
            <p>Welcome to the <strong>Velocity</strong> project specification.</p>
            <h3>Goals</h3>
            <ul>
                <li>Create a unified workspace.</li>
                <li>Integrate Kanban, Issues, and Docs.</li>
            </ul>
            <blockquote>
                "Everything you need, in one place."
            </blockquote>
            <p>Type '/' for commands...</p>
         </div>
      </div>
    </div>
  `,
    styles: [`
    [contenteditable]:empty:before {
        content: attr(placeholder);
        color: #9ca3af;
        cursor: text;
    }
  `]
})
export class DocEditorComponent { }
