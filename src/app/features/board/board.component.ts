import { Component, OnInit, Input, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { SupabaseService } from '../../core/services/supabase.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule, Menu, Search, Lock, Star, MoreHorizontal, Info, Kanban, ChartGantt, User, Filter, ArrowUpDown, Zap, ChevronDown, Plus, FileText, HelpCircle, X } from 'lucide-angular';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { TaskDetailModalComponent } from './components/task-detail-modal/task-detail-modal.component';
import { FormsModule } from '@angular/forms';

interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    priority?: string;
    progress?: number;
    tags?: any[]; // For eager loaded tags
    task_tags?: any[]; // For join structure
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
    imports: [
        CommonModule,
        DragDropModule,
        RouterModule,
        LucideAngularModule,
        ModalComponent,
        TaskDetailModalComponent,
        FormsModule
    ],
    template: `
    <div class="text-zinc-300 antialiased selection:bg-blue-500/30 font-sans">

        <!-- View Controls (Removed) -->
        <div class="flex justify-end mb-4">
             <button (click)="addTask('todo')" class="bg-notion-blue hover:bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors flex items-center gap-2">
                <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
                New Task
            </button>
        </div>


        <!-- Activity Log -->
        <div class="mb-8 border-b border-zinc-800 pb-6 max-w-3xl">
            <h3 class="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                <lucide-icon name="history" class="w-4 h-4"></lucide-icon>
                Activity
            </h3>
            <div class="space-y-4">
                @for (log of logs(); track log.id) {
                <div class="flex gap-3 text-sm group">
                    <div class="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400 shrink-0 select-none">
                        {{ log.user_email?.[0] | uppercase }}
                    </div>
                    <div>
                        <div class="text-zinc-400">
                            <span class="text-zinc-300 font-medium hover:underline cursor-pointer">{{ log.user_email }}</span>
                            <span class="ml-1">
                                <ng-container [ngSwitch]="log.action">
                                    <span *ngSwitchCase="'create'">created task <span class="text-zinc-200 font-medium">"{{ log.details.task_title }}"</span> in <span class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs">{{ log.details.status }}</span></span>
                                    <span *ngSwitchCase="'move'">moved <span class="text-zinc-200 font-medium">"{{ log.details.task_title }}"</span> to <span class="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs">{{ log.details.to_status }}</span> column</span>
                                </ng-container>
                            </span>
                        </div>
                        <div class="text-[11px] text-zinc-600 mt-0.5">{{ log.created_at | date:'medium' }}</div>
                    </div>
                </div>
                }
                @if (logs().length === 0) {
                <div class="text-zinc-600 text-sm italic py-4">No recent activity</div>
                }
            </div>
            
            @if (logs().length >= 5 || showAllLogs()) {
            <div class="mt-4">
                <button (click)="toggleLogs()" class="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
                    {{ showAllLogs() ? 'Show less' : 'View full details' }}
                </button>
            </div>
            }
        </div>

        <!-- Kanban Board -->
        <div cdkDropListGroup class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        
            <!-- Dynamic Columns -->
            @for (col of columns(); track col.id) {
            <div class="flex flex-col gap-2 group/col"
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
                </div>

                <!-- Tasks -->
                @for (task of col.tasks; track task.id) {
                <div 
                        cdkDrag 
                        (click)="openTaskDetail(task)"
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
                            @if (task.progress !== undefined) {
                            <div class="space-y-1">
                            <div class="flex justify-between text-xs text-zinc-400 font-medium">
                                <span>{{ task.progress }}%</span>
                            </div>
                            <div class="h-1 w-full bg-zinc-700 rounded-full overflow-hidden">
                                <div class="h-full bg-blue-500" [style.width.%]="task.progress"></div>
                            </div>
                        </div>
                        }

                        @if (task.priority) {
                        <div class="flex flex-wrap gap-2">
                            <span class="bg-[#462020] text-[#FF9E9E] px-1.5 py-0.5 rounded text-[11px] font-medium border border-[#582626]">
                                {{ task.priority }}
                            </span>
                        </div>
                        }
                    </div>
                </div>
                }

                <!-- Add New -->
                <button (click)="addTask(col.id)" class="flex items-center gap-2 text-zinc-500 hover:bg-notion-hover p-2 rounded text-sm transition-colors text-left group w-full">
                    <lucide-icon name="plus" class="w-4 h-4 text-zinc-600 group-hover:text-zinc-400"></lucide-icon>
                    <span class="group-hover:text-zinc-300">New</span>
                </button>

            </div>
            }

        </div>




    </div>



    <!-- Create Task Modal -->
    <app-modal [isOpen]="isTaskModalOpen()" (isOpenChange)="isTaskModalOpen.set($event)" title="New Task">
        <div class="space-y-4">
            <div>
                <label class="block text-xs font-medium text-zinc-400 mb-1.5">Task Title</label>
                <input [ngModel]="newTaskTitle()" (ngModelChange)="newTaskTitle.set($event)" (keydown.enter)="confirmAddTask()" type="text" class="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-zinc-600" placeholder="What needs to be done?" autofocus>
            </div>
             <div class="flex justify-end gap-2 pt-4">
                <button (click)="isTaskModalOpen.set(false)" class="px-3 py-1.5 text-zinc-400 hover:text-zinc-200 text-sm">Cancel</button>
                <button (click)="confirmAddTask()" [disabled]="!newTaskTitle()" class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors">Create Task</button>
            </div>
        </div>
    </app-modal>

    <!-- Task Detail Modal -->
    <app-task-detail-modal 
        [isOpen]="!!selectedTask()" 
        (isOpenChange)="selectedTask.set(null)"
        [task]="selectedTask()"
        [projectId]="projectId"
        (taskUpdated)="loadTasks()">
    </app-task-detail-modal>
    
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
export class BoardComponent implements OnInit, OnChanges {

    @Input() projectId: string | null = null;

    // We will separate tasks into columns
    columns = signal<Column[]>([
        { id: 'todo', title: 'Not started', tasks: [], colorClass: 'bg-zinc-700/50 text-zinc-400 border-zinc-700' },
        { id: 'in-progress', title: 'In Progress', tasks: [], colorClass: 'bg-blue-500/20 text-blue-300 border-blue-500/20' },
        { id: 'done', title: 'Done', tasks: [], colorClass: 'bg-emerald-900/40 text-emerald-400 border-emerald-900/40' }
    ]);

    // Modal State
    isTaskModalOpen = signal(false);
    selectedTask = signal<Task | null>(null);
    newTaskTitle = signal('');
    activeColumnId = signal('todo');

    // Activity Logs
    logs = signal<any[]>([]);
    showAllLogs = signal(false);

    constructor(
        private supabase: SupabaseService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        // Fallback to route param if no input provided
        if (!this.projectId) {
            this.route.paramMap.subscribe(params => {
                const id = params.get('id');
                if (id) {
                    this.projectId = id;
                    this.loadTasks();
                }
            });
        } else {
            this.loadTasks();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['projectId'] && !changes['projectId'].firstChange) {
            this.loadTasks();
        }
    }

    async loadTasks() {
        if (!this.projectId) return;

        const { data: tasks, error } = await this.supabase.getTasks(this.projectId);
        if (error) {
            console.error('Error loading tasks', error);
            // return; // Continue to load logs even if tasks fail?
        } else {
            // Clear existing
            this.columns.update(cols => {
                cols.forEach(col => col.tasks = []);
                return [...cols]; // Trigger update
            });

            // Distribute tasks
            (tasks || []).forEach((task: any) => {
                const cols = this.columns();
                const col = cols.find(c => c.id === task.status);
                if (col) {
                    col.tasks.push(task as Task);
                } else {
                    cols[0].tasks.push(task as Task);
                }
            });
            this.columns.update(cols => [...cols]); // Refresh
        }

        this.loadLogs();
    }

    async loadLogs() {
        if (!this.projectId) return;
        const limit = this.showAllLogs() ? 50 : 5;
        const { data, error } = await this.supabase.getLogs(this.projectId, limit);
        if (error) {
            console.error('Error loading logs:', error);
        }
        if (data) {
            console.log('Logs loaded:', data);
            this.logs.set(data);
        }
    }

    toggleLogs() {
        this.showAllLogs.update(v => !v);
        this.loadLogs();
    }

    addTask(columnId: string) {
        this.activeColumnId.set(columnId);
        this.newTaskTitle.set('');
        this.isTaskModalOpen.set(true);
    }

    openTaskDetail(task: Task) {
        this.selectedTask.set(task);
    }

    async confirmAddTask() {
        if (!this.newTaskTitle() || !this.projectId) return;

        const title = this.newTaskTitle();
        const columnId = this.activeColumnId();

        this.isTaskModalOpen.set(false); // Close immediately for better UX

        const newTask = {
            title,
            project_id: this.projectId,
            status: columnId,
            priority: 'Medium'
        };

        const { data, error } = await this.supabase.createTask(newTask);
        if (error) {
            console.error('Error creating task', error);
            // Optionally reopen modal or show error
            return;
        }

        if (data) {
            const cols = this.columns();
            const col = cols.find(c => c.id === columnId);
            if (col) {
                col.tasks.push(data as Task);
                this.columns.update(c => [...c]); // Update signal
            }

            // Log activity
            const { data: { user } } = await this.supabase.client.auth.getUser();
            if (user) {
                await this.supabase.createLog({
                    project_id: this.projectId,
                    user_id: user.id,
                    user_email: user.email,
                    action: 'create',
                    details: { task_title: title, status: columnId }
                });
                this.loadLogs();
            }
        }
    }

    async signOut() {
        await this.supabase.signOut();
        this.router.navigate(['/login']);
    }

    async drop(event: CdkDragDrop<Task[]>) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else {
            transferArrayItem(
                event.previousContainer.data,
                event.container.data,
                event.previousIndex,
                event.currentIndex,
            );

            // Update DB
            const cols = this.columns();
            const destColumn = cols.find(c => c.tasks === event.container.data);

            if (destColumn && event.container.data[event.currentIndex]) {
                const task = event.container.data[event.currentIndex];
                await this.supabase.updateTaskStatus(task.id, destColumn.id);

                // Log activity
                const { data: { user } } = await this.supabase.client.auth.getUser();
                if (user) {
                    await this.supabase.createLog({
                        project_id: this.projectId!,
                        user_id: user.id,
                        user_email: user.email,
                        action: 'move',
                        details: {
                            task_title: task.title,
                            to_status: destColumn.id
                        }
                    });
                    this.loadLogs();
                }
            }
        }
    }
}

