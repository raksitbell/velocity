import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-issue-detail',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-white flex flex-col">
      <!-- Header / Breadcrumbs -->
      <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
         <div class="flex items-center space-x-2 text-sm text-gray-500">
            <span>VEL-1234</span>
            <span>/</span>
            <span>Design Database Schema</span>
         </div>
         <div class="flex space-x-3">
            <button class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium">Share</button>
            <button class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">Export</button>
         </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto p-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-6">Design Database Schema</h1>
            
            <div class="prose max-w-none">
                <h3 class="text-lg font-semibold mb-2">Description</h3>
                <p class="text-gray-700 mb-4">
                    We need to design a robust schema for Supabase that supports:
                </p>
                <ul class="list-disc pl-5 mb-4 text-gray-700">
                    <li>Multi-tenancy via Workspaces</li>
                    <li>Kanban Boards and Lists</li>
                    <li>Rich Text Documents</li>
                </ul>
                <p class="text-gray-700">
                    Ensure RLS policies are in place from day one.
                </p>
            </div>

            <div class="mt-12 border-t pt-8">
                <h3 class="text-lg font-semibold mb-4">Activity</h3>
                <div class="flex space-x-4 mb-6">
                    <div class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">JD</div>
                    <div class="flex-1">
                        <textarea class="w-full border border-gray-300 rounded p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" rows="3" placeholder="Add a comment..."></textarea>
                        <div class="mt-2 flex justify-end">
                            <button class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Sidebar -->
        <aside class="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            <div class="mb-6">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <select class="block w-full border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 bg-white">
                    <option>To Do</option>
                    <option selected>In Progress</option>
                    <option>Done</option>
                </select>
            </div>

            <div class="mb-6">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assignee</label>
                <div class="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer">
                    <div class="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">JD</div>
                    <span class="text-sm text-gray-900">John Doe</span>
                </div>
            </div>
            
            <div class="mb-6">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
                <div class="flex items-center space-x-2">
                    <span class="h-4 w-1 bg-red-500 rounded-full"></span>
                    <span class="text-sm text-gray-900">High</span>
                </div>
            </div>

            <div class="mb-6">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reporter</label>
                <div class="flex items-center space-x-2">
                    <div class="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">JS</div>
                    <span class="text-sm text-gray-900">Jane Smith</span>
                </div>
            </div>
        </aside>
      </div>
    </div>
  `
})
export class IssueDetailComponent {
    constructor(private route: ActivatedRoute) { }
}
