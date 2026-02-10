import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Image, Box, Trello, Share2, Calendar, User, AlertCircle } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';
import { BoardComponent } from '../board/board.component';

@Component({
    selector: 'app-project-landing',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        BoardComponent,
        LucideAngularModule
    ],
    template: `
    <div class="bg-notion-bg text-zinc-300 min-h-screen flex flex-col antialiased selection:bg-blue-500/30 font-sans">
        
        <!-- Navbar -->
        <header class="h-12 flex items-center px-4 text-sm sticky top-0 z-50 bg-notion-bg/80 backdrop-blur-md border-b border-notion-border">
            <a routerLink="/projects" class="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors mr-4">
                <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
                Back
            </a>
            <div class="flex items-center gap-2 text-zinc-500">
                <span>/</span>
                <span class="text-zinc-200 truncate max-w-[200px]">{{ project?.title }}</span>
            </div>
        </header>

        <main class="flex-1 overflow-y-auto" *ngIf="project">
            
            <!-- Cover Image -->
            <div class="h-64 w-full relative group">
                <img *ngIf="project.cover_image" [src]="project.cover_image" class="w-full h-full object-cover">
                <div *ngIf="!project.cover_image" class="w-full h-full bg-gradient-to-r from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <lucide-icon name="image" class="w-12 h-12 text-zinc-700"></lucide-icon>
                </div>
                
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </div>

            <!-- Content Container -->
            <div class="max-w-4xl mx-auto px-6 sm:px-12 -mt-12 relative z-10 pb-20">
                
                <!-- Icon/Project Emoji -->
                <div class="w-24 h-24 bg-notion-bg rounded-lg p-1 shadow-lg mb-6 flex items-center justify-center">
                     <div class="w-full h-full bg-zinc-800 rounded flex items-center justify-center">
                        <lucide-icon name="box" class="w-10 h-10 text-blue-500"></lucide-icon>
                     </div>
                </div>

                <!-- Title & Actions -->
                <div class="mb-8">
                    <h1 class="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">{{ project.title }}</h1>
                    
                    <div class="flex flex-wrap gap-3">
                        <button class="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2">
                             <lucide-icon name="share-2" class="w-4 h-4"></lucide-icon>
                             Share
                        </button>
                    </div>
                </div>

                <!-- Divider -->
                <div class="h-px bg-zinc-800 w-full mb-8"></div>

                <!-- Description / Details -->
                <div class="prose prose-invert prose-zinc max-w-none mb-12">
                    <h3 class="text-lg font-medium text-zinc-200 mb-2">About this project</h3>
                    <p class="text-zinc-400 leading-relaxed whitespace-pre-wrap">{{ project.description || 'No description provided.' }}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div class="bg-zinc-800/50 border border-zinc-800 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                                <lucide-icon name="calendar" class="w-4 h-4 text-zinc-500"></lucide-icon>
                                Created
                            </h4>
                            <p class="text-zinc-400 text-sm">{{ project.created_at | date:'mediumDate' }}</p>
                        </div>
                         <div class="bg-zinc-800/50 border border-zinc-800 rounded-lg p-4">
                            <h4 class="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                                <lucide-icon name="user" class="w-4 h-4 text-zinc-500"></lucide-icon>
                                Owner
                            </h4>
                            <p class="text-zinc-400 text-sm">You</p>
                        </div>
                    </div>
                </div>

                <!-- Embedded Board -->
                <div class="mt-8">
                    <h3 class="text-xl font-semibold text-zinc-200 mb-4 flex items-center gap-2">
                        <lucide-icon name="trello" class="w-5 h-5 text-blue-500"></lucide-icon>
                        Tasks
                    </h3>
                    <app-board [projectId]="project.id"></app-board>
                </div>

            </div>
        </main>

        <div *ngIf="loading" class="flex-1 flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
        
        <div *ngIf="error" class="flex-1 flex items-center justify-center flex-col gap-2">
             <lucide-icon name="alert-circle" class="w-8 h-8 text-red-500"></lucide-icon>
             <p class="text-zinc-400">Project not found or access denied.</p>
             <a routerLink="/projects" class="text-blue-500 hover:underline mt-2">Return to projects</a>
        </div>

    </div>
    `
})
export class ProjectLandingComponent implements OnInit {
    project: any = null;
    loading = true;
    error = false;

    constructor(
        private route: ActivatedRoute,
        private supabase: SupabaseService
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.loadProject(id);
            }
        });
    }

    async loadProject(id: string) {
        this.loading = true;
        this.error = false;
        try {
            const { data, error } = await this.supabase.getProject(id);
            if (error || !data) {
                this.error = true;
            } else {
                this.project = data;
            }
        } catch (e) {
            this.error = true;
        } finally {
            this.loading = false;
        }
    }
}
