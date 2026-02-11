import { Component, OnInit, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, LayoutGrid, Plus, Image, FolderOpen, X } from 'lucide-angular';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/ui/modal/modal.component';

@Component({
    selector: 'app-project-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        LucideAngularModule,
        ModalComponent
    ],
    template: `
    <div class="bg-notion-bg text-zinc-300 min-h-screen flex flex-col antialiased selection:bg-blue-500/30 font-sans">
        
        <!-- Header -->
        <header class="h-12 flex items-center justify-between px-4 text-sm sticky top-0 z-50 bg-notion-bg border-b border-notion-border">
            <div class="flex items-center gap-2">
                 <div class="p-1 rounded bg-zinc-800">
                    <lucide-icon name="layout-grid" class="w-4 h-4 text-zinc-400"></lucide-icon>
                 </div>
                 <span class="font-medium text-zinc-200">Velocity</span>
            </div>
            
             <div class="flex items-center gap-3 text-xs">
                <button (click)="signOut()" class="text-zinc-400 hover:text-zinc-200 transition-colors">Sign Out</button>
             </div>
        </header>

        <main class="flex-1 overflow-y-auto p-6 md:p-12">
            <div class="max-w-5xl mx-auto">
                
                <div class="flex items-center justify-between mb-8">
                    <div>
                        <h1 class="text-3xl font-bold text-zinc-100 mb-1">Projects</h1>
                        <p class="text-zinc-500">Manage and organize your work.</p>
                    </div>
                    <button (click)="showCreateModal = true" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                        <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
                        New Project
                    </button>
                </div>

                <!-- Project Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <!-- Project Card -->
                    <a *ngFor="let project of projects" [routerLink]="['/project', project.id]" class="group bg-notion-card hover:bg-notion-hover border border-notion-border hover:border-zinc-600 rounded-lg overflow-hidden transition-all cursor-pointer block h-48 flex flex-col">
                        <div class="h-24 bg-zinc-800 relative overflow-hidden">
                             <img *ngIf="project.cover_image" [src]="project.cover_image" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                             <div *ngIf="!project.cover_image" class="w-full h-full flex items-center justify-center bg-zinc-800">
                                <lucide-icon name="image" class="w-8 h-8 text-zinc-700"></lucide-icon>
                             </div>
                        </div>
                        <div class="p-4 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 class="text-base font-semibold text-zinc-200 mb-1 group-hover:text-blue-400 transition-colors">{{ project.title }}</h3>
                                <p class="text-xs text-zinc-500 line-clamp-2">{{ project.description || 'No description' }}</p>
                            </div>
                            <div class="text-[10px] text-zinc-600 mt-2">
                                Updated {{ project.created_at | date }}
                            </div>
                        </div>
                    </a>

                    <!-- Empty State -->
                    <div *ngIf="projects.length === 0" class="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-lg">
                        <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <lucide-icon name="folder-open" class="w-6 h-6 text-zinc-500"></lucide-icon>
                        </div>
                        <h3 class="text-zinc-300 font-medium mb-1">No projects yet</h3>
                        <p class="text-zinc-500 text-sm mb-4">Create your first project to get started.</p>
                        <button (click)="showCreateModal = true" class="text-blue-500 hover:text-blue-400 text-sm">Create new project</button>
                    </div>

                </div>
            </div>
        </main>

        <!-- Create Modal using Reusable Component -->
        <app-modal [(isOpen)]="showCreateModal" title="New Project">
             <div class="space-y-4">
                <div>
                    <label class="block text-xs font-medium text-zinc-400 mb-1.5">Project Title</label>
                    <input [(ngModel)]="newProject.title" type="text" class="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600" placeholder="e.g. Website Redesign">
                </div>
                <div>
                        <label class="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
                        <textarea [(ngModel)]="newProject.description" rows="3" class="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600" placeholder="Briefly describe your project..."></textarea>
                </div>
                <div>
                    <label class="block text-xs font-medium text-zinc-400 mb-1.5">Cover Image URL</label>
                    <input [(ngModel)]="newProject.cover_image" type="text" class="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600" placeholder="https://...">
                </div>

                <div *ngIf="errorMessage" class="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">
                    {{ errorMessage }}
                </div>

                <div class="flex justify-end gap-2 pt-4">
                    <button (click)="showCreateModal = false" class="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-sm">Cancel</button>
                    <button (click)="createProject()" [disabled]="!newProject.title || isCreating" class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2">
                        <span *ngIf="isCreating" class="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></span>
                        Create Project
                    </button>
                </div>
            </div>
        </app-modal>

    </div>
    `
})
export class ProjectListComponent implements OnInit {
    projects: any[] = [];
    showCreateModal = false;
    isCreating = false;
    errorMessage = '';

    newProject = {
        title: '',
        description: '',
        cover_image: ''
    };
    currentUser: any = null;

    constructor(private supabase: SupabaseService) { }

    ngOnInit() {
        this.loadProjects();
        this.supabase.currentUser$.subscribe(user => {
            this.currentUser = user;
        });
    }

    async loadProjects() {
        const { data, error } = await this.supabase.getProjects();
        if (error) {
            console.error('Error fetching projects:', error);
        } else {
            this.projects = data || [];
        }
    }

    async createProject() {
        if (!this.currentUser) return;
        this.isCreating = true;
        this.errorMessage = '';

        const projectData = {
            ...this.newProject,
            owner_id: this.currentUser.id
        };

        const { data, error } = await this.supabase.createProject(projectData);
        if (error) {
            console.error('Error creating project:', error);
            this.errorMessage = 'Failed to create project. Please try again.';
        } else {
            this.projects.unshift(data);
            this.showCreateModal = false;
            this.newProject = { title: '', description: '', cover_image: '' };
        }
        this.isCreating = false;
    }

    async signOut() {
        await this.supabase.signOut();
    }
}

