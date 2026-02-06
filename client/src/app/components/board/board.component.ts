import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    priority?: string;
    progress?: number;
}

interface Column {
    title: string;
    tasks: Task[];
    id: string; // 'todo', 'in-progress', 'done'
    colorClass?: string; // For the badge style e.g. bg-blue-500/20 text-blue-300
    dotColor?: string;
}

@Component({
    selector: 'app-board',
    standalone: true,
    imports: [CommonModule, DragDropModule, LucideAngularModule],
    template: `
    <div class="bg-notion-bg text-zinc-300 min-h-screen flex flex-col antialiased selection:bg-blue-500/30 font-sans">

    <!-- Top Navigation Bar -->
    <header class="h-12 flex items-center justify-between px-3 text-sm sticky top-0 z-50 bg-notion-bg border-b border-notion-border">
        <div class="flex items-center gap-2">
            <button class="p-1 hover:bg-notion-hover rounded text-zinc-400 transition-colors">
                <lucide-icon name="menu" class="w-4 h-4"></lucide-icon>
            </button>
            <div class="flex items-center gap-1 text-zinc-400">
                <span class="flex items-center gap-1 hover:bg-notion-hover px-1.5 py-0.5 rounded cursor-pointer transition-colors text-zinc-100">
                    <lucide-icon name="search" class="w-4 h-4 text-blue-400"></lucide-icon>
                    <span>Projects</span>
                </span>
                <span class="text-zinc-600">/</span>
                <span class="flex items-center gap-1 hover:bg-notion-hover px-1.5 py-0.5 rounded cursor-pointer transition-colors">
                    <lucide-icon name="lock" class="w-3 h-3"></lucide-icon>
                    <span>Private</span>
                </span>
            </div>
        </div>
        <div class="flex items-center gap-3 text-xs">
            <span class="text-zinc-500 hidden sm:block">Edited just now</span>
            <button class="flex items-center gap-1 text-zinc-300 hover:bg-notion-hover px-2 py-1 rounded transition-colors">
                <span>Share</span>
            </button>
            <button class="p-1 hover:bg-notion-hover rounded text-zinc-400 transition-colors">
                <lucide-icon name="star" class="w-4 h-4"></lucide-icon>
            </button>
            <button (click)="signOut()" class="p-1 hover:bg-notion-hover rounded text-zinc-400 transition-colors" title="Sign Out">
                <lucide-icon name="more-horizontal" class="w-4 h-4"></lucide-icon>
            </button>
        </div>
    </header>

    <!-- Scrollable Content -->
    <main class="flex-1 overflow-y-auto relative custom-scrollbar">

        <!-- Cover Image -->
        <div class="group relative h-48 w-full">
            <img src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop"
                alt="Cover" class="w-full h-full object-cover opacity-80">
            <div class="absolute top-4 right-24 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button class="bg-notion-bg/60 backdrop-blur-sm text-xs px-2 py-1 rounded hover:bg-notion-bg/80 text-zinc-300 border border-white/10 transition-colors">Change cover</button>
                <button class="bg-notion-bg/60 backdrop-blur-sm text-xs px-2 py-1 rounded hover:bg-notion-bg/80 text-zinc-300 border border-white/10 transition-colors">Reposition</button>
            </div>
        </div>

        <!-- Page Content -->
        <div class="max-w-[96rem] mx-auto px-4 sm:px-12 pb-20">

            <!-- Page Header -->
            <div class="group relative -mt-10 mb-8">
                <!-- Icon -->
                <div class="w-20 h-20 text-7xl mb-4 relative z-10 select-none">
                    <div class="relative bg-notion-bg rounded-md">
                         <lucide-icon name="search" class="w-16 h-16 text-blue-500 stroke-[2.5]"></lucide-icon>
                    </div>
                </div>

                <div class="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-0">
                    <button class="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                        <lucide-icon name="info" class="w-3.5 h-3.5"></lucide-icon>
                        Hide description
                    </button>
                </div>

                <h1 class="text-4xl font-semibold text-zinc-100 tracking-tight mb-2">Projects</h1>
                <p class="text-base text-zinc-400 border-b border-notion-border pb-6">Manage and execute projects from start to finish.</p>
            </div>

            <!-- View Controls -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-notion-border pb-3">

                <!-- Tabs -->
                <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <button class="flex items-center gap-2 bg-notion-hover text-zinc-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                        <lucide-icon name="kanban" class="w-4 h-4"></lucide-icon>
                        By status
                    </button>
                    <button class="flex items-center gap-2 text-zinc-400 hover:bg-notion-hover px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                        <lucide-icon name="star" class="w-4 h-4"></lucide-icon>
                        All projects
                    </button>
                    <button class="flex items-center gap-2 text-zinc-400 hover:bg-notion-hover px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                        <lucide-icon name="chart-gantt" class="w-4 h-4"></lucide-icon>
                        Gantt
                    </button>
                    <button class="flex items-center gap-2 text-zinc-400 hover:bg-notion-hover px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
                         <lucide-icon name="user" class="w-4 h-4"></lucide-icon>
                        My projects
                    </button>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 text-zinc-400">
                    <button class="p-1.5 hover:bg-notion-hover rounded transition-colors">
                        <lucide-icon name="filter" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button class="p-1.5 hover:bg-notion-hover rounded transition-colors">
                        <lucide-icon name="arrow-up-down" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button class="p-1.5 hover:bg-notion-hover rounded transition-colors">
                        <lucide-icon name="zap" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button class="p-1.5 hover:bg-notion-hover rounded transition-colors">
                        <lucide-icon name="search" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button class="p-1.5 hover:bg-notion-hover rounded transition-colors mr-2">
                        <lucide-icon name="more-horizontal" class="w-4 h-4"></lucide-icon>
                    </button>

                    <div class="flex">
                        <button class="bg-notion-blue hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-l rounded-r-none transition-colors border-r border-blue-600/50">New</button>
                        <button class="bg-notion-blue hover:bg-blue-600 text-white px-1.5 py-1.5 rounded-r rounded-l-none transition-colors">
                            <lucide-icon name="chevron-down" class="w-4 h-4"></lucide-icon>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Kanban Board -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            
              <!-- Dynamic Columns -->
              <div *ngFor="let col of columns" class="flex flex-col gap-2 group/col"
                   cdkDropList
                   [cdkDropListData]="col.tasks"
                   (cdkDropListDropped)="drop($event)">
                   
                    <div class="flex items-center justify-between px-1 mb-1">
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded-full text-xs font-medium border"
                                  [ngClass]="col.colorClass || 'bg-zinc-700/50 text-zinc-400 border-zinc-700'">
                                {{ col.title }}
                            </span>
                            <span class="text-zinc-500 text-xs">{{ col.tasks.length }}</span>
                        </div>
                        <div class="flex gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                            <button class="text-zinc-500 hover:text-zinc-300">
                                <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
                            </button>
                            <button class="text-zinc-500 hover:text-zinc-300">
                                <lucide-icon name="more-horizontal" class="w-4 h-4"></lucide-icon>
                            </button>
                        </div>
                    </div>

                    <!-- Tasks -->
                    <div *ngFor="let task of col.tasks" 
                         cdkDrag 
                         class="bg-notion-card hover:bg-notion-hover border border-notion-border rounded-md shadow-sm p-3 cursor-pointer group transition-all">
                         
                        <div class="flex items-start gap-2 mb-4">
                            <div class="mt-0.5">
                                <lucide-icon name="file-text" class="w-4 h-4 text-zinc-500"></lucide-icon>
                            </div>
                            <span class="text-sm font-medium text-zinc-200 group-hover:underline decoration-zinc-500 underline-offset-2">
                                {{ task.title }}
                            </span>
                        </div>
                        
                        <p class="text-xs text-zinc-500 mb-2 truncate">{{ task.description }}</p>

                        <div class="space-y-3">
                             <div class="space-y-1" *ngIf="task.progress !== undefined">
                                <div class="flex justify-between text-xs text-zinc-400 font-medium">
                                    <span>{{ task.progress }}%</span>
                                </div>
                                <div class="h-1 w-full bg-zinc-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-blue-500" [style.width.%]="task.progress"></div>
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-2" *ngIf="task.priority">
                                <span class="bg-[#462020] text-[#FF9E9E] px-1.5 py-0.5 rounded text-[11px] font-medium border border-[#582626]">
                                    {{ task.priority }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Add New -->
                    <button class="flex items-center gap-2 text-zinc-500 hover:bg-notion-hover p-2 rounded text-sm transition-colors text-left group">
                        <lucide-icon name="plus" class="w-4 h-4 text-zinc-600 group-hover:text-zinc-400"></lucide-icon>
                        <span class="group-hover:text-zinc-300">New project</span>
                    </button>

              </div>

            </div>
        </div>
    </main>

    <!-- Help Button -->
    <button class="fixed bottom-6 right-6 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-lg border border-zinc-700 transition-colors z-50">
        <lucide-icon name="help-circle" class="w-6 h-6"></lucide-icon>
    </button>
    </div>
  `,
    styles: [`
    /* Custom Scrollbar for columns */
    ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: #3f3f46;
        border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: #52525b;
    }
    .custom-scrollbar::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }
  `]
})
export class BoardComponent {

    columns: Column[] = [
        {
            id: 'todo',
            title: 'Not started',
            colorClass: 'bg-zinc-700/50 text-zinc-400 border-zinc-700',
            tasks: [
                { id: '1', title: 'Design Database Schema', description: 'Plan out the profiles, boards, and tasks tables.', status: 'todo', progress: 0, priority: 'High' },
                { id: '2', title: 'Setup Supabase Auth', description: 'Enable email/password and magic link providers.', status: 'todo', progress: 0 }
            ]
        },
        {
            id: 'in-progress',
            title: 'In Progress',
            colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
            tasks: [
                { id: '3', title: 'Frontend Setup', description: 'Initialize Angular project and Tailwind.', status: 'in-progress', progress: 50, priority: 'Medium' }
            ]
        },
        {
            id: 'done',
            title: 'Done',
            colorClass: 'bg-emerald-900/40 text-emerald-400 border-emerald-900/40',
            tasks: [
                { id: '4', title: 'Initial Planning', description: 'Create implementation plan.', status: 'done', progress: 100 }
            ]
        }
    ];

    constructor(private supabase: SupabaseService, private router: Router) { }

    async signOut() {
        await this.supabase.signOut();
        this.router.navigate(['/login']);
    }

    drop(event: CdkDragDrop<Task[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex,
            );
        }
    }
}
