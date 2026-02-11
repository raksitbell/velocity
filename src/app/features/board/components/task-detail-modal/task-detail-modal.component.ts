
import { Component, Input, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';

@Component({
    selector: 'app-task-detail-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, ModalComponent],
    template: `
    <app-modal [isOpen]="isOpen" (isOpenChange)="close()" [title]="task?.title || 'Task Details'" [width]="'3xl'">
      <div *ngIf="task" class="flex flex-col gap-6">
        
        <!-- Header / Meta -->
        <div class="flex flex-wrap gap-4 text-sm text-zinc-400">
           <div class="flex items-center gap-2">
             <lucide-icon name="credit-card" class="w-4 h-4"></lucide-icon>
             <span>{{ task.status }}</span>
           </div>
           
           <div class="flex items-center gap-2">
             <lucide-icon name="user" class="w-4 h-4"></lucide-icon>
             <span>{{ task.assignee?.email || 'Unassigned' }}</span>
           </div>

           <!-- Tags Display -->
           <div class="flex items-center gap-2">
             <lucide-icon name="tag" class="w-4 h-4"></lucide-icon>
             <div class="flex flex-wrap gap-1">
                <span *ngFor="let t of task.tags" [style.background-color]="t.color + '33'" [style.color]="t.color" class="px-2 py-0.5 rounded text-xs border" [style.border-color]="t.color + '40'">
                    {{ t.name }}
                </span>
                <button (click)="isTagMenuOpen.set(!isTagMenuOpen())" class="text-xs bg-zinc-800 px-1.5 rounded hover:bg-zinc-700">+</button>
             </div>
           </div>
        </div>

        <!-- Tag Selection Menu (Simple toggle for now) -->
        <div *ngIf="isTagMenuOpen()" class="p-2 bg-zinc-800 border border-zinc-700 rounded shadow-xl">
            <div class="text-xs text-zinc-500 mb-2">Select a tag</div>
            <div class="flex flex-col gap-1">
                <button *ngFor="let tag of availableTags()" (click)="toggleTag(tag)" class="text-left px-2 py-1 hover:bg-zinc-700 rounded text-sm flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" [style.background-color]="tag.color"></span>
                    {{ tag.name }}
                    <lucide-icon *ngIf="hasTag(tag)" name="check" class="w-3 h-3 ml-auto"></lucide-icon>
                </button>
                <div class="border-t border-zinc-700 my-1"></div>
                <!-- Create new tag input -->
                <div class="flex gap-1" (click)="$event.stopPropagation()">
                    <input [(ngModel)]="newTagName" placeholder="New tag..." class="bg-zinc-900 border-none text-xs text-white rounded px-1 py-1 w-full">
                    <input type="color" [(ngModel)]="newTagColor" class="w-6 h-6 p-0 border-none bg-transparent">
                    <button (click)="createNewTag()" [disabled]="!newTagName" class="text-blue-400 text-xs hover:text-blue-300">Add</button>
                </div>
            </div>
        </div>

        <!-- Title Edit -->
        <div>
             <input [(ngModel)]="localTitle" (blur)="saveTitle()" class="text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 w-full text-zinc-100 placeholder-zinc-600" placeholder="Task Title">
        </div>

        <!-- Description (Rich Text Wrapper) -->
        <div class="border border-zinc-700 rounded-md bg-zinc-900/50 min-h-[150px] p-4">
            <div class="mb-2 border-b border-zinc-700 pb-2 flex gap-2 text-zinc-400">
                <button (click)="execCmd('bold')" class="hover:text-zinc-200"><lucide-icon name="bold" class="w-4 h-4"></lucide-icon></button>
                <button (click)="execCmd('italic')" class="hover:text-zinc-200"><lucide-icon name="italic" class="w-4 h-4"></lucide-icon></button>
                <button (click)="execCmd('insertUnorderedList')" class="hover:text-zinc-200"><lucide-icon name="list" class="w-4 h-4"></lucide-icon></button>
            </div>
            <div #editor contenteditable="true" class="outline-none text-sm text-zinc-300" (blur)="saveDescription($event)"></div>
        </div>

        <!-- Attachments -->
        <div>
            <h4 class="text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                <lucide-icon name="paperclip" class="w-4 h-4"></lucide-icon> Attachments
            </h4>
            <div class="grid grid-cols-2 gap-2">
                <div *ngFor="let att of task.attachments" class="relative group bg-zinc-800 rounded p-2 flex items-center gap-2 overflow-hidden">
                    <img *ngIf="att.type === 'image'" [src]="att.url" class="w-10 h-10 object-cover rounded">
                    <a [href]="att.url" target="_blank" class="text-sm text-blue-400 hover:underline truncate">{{ att.name }}</a>
                </div>
                <!-- Upload Placeholder -->
                 <label class="cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 border border-dashed border-zinc-700 rounded p-2 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors">
                    <input type="file" class="hidden" (change)="uploadImage($event)">
                    <span class="text-xs">+ Add Image</span>
                </label>
            </div>
        </div>

      </div>
    </app-modal>
  `,
    styles: [`
    [contenteditable]:empty:before { content: 'Add a description...'; color: #52525b; }
  `]
})
export class TaskDetailModalComponent {
    @Input() isOpen = false;
    @Input() task: any = null;
    @Input() projectId: string | null = null;
    @Output() isOpenChange = new EventEmitter<boolean>();
    @Output() taskUpdated = new EventEmitter<void>();

    localTitle = '';
    isTagMenuOpen = signal(false);
    availableTags = signal<any[]>([]);

    newTagName = '';
    newTagColor = '#3b82f6';

    constructor(private supabase: SupabaseService) {
        effect(() => {
            if (this.isOpen && this.task) {
                this.localTitle = this.task.title;
                this.loadTags();
                // Initialize editor content? Handled via direct DOM or just ensuring task is loaded
                setTimeout(() => {
                    const editor = document.querySelector('[contenteditable]');
                    if (editor) editor.innerHTML = this.task.description || '';
                }, 0);
            }
        });
    }

    close() {
        this.isOpenChange.emit(false);
    }

    async saveTitle() {
        if (this.localTitle !== this.task.title) {
            await this.supabase.updateTask(this.task.id, { title: this.localTitle });
            this.task.title = this.localTitle;
            this.taskUpdated.emit();
        }
    }

    execCmd(command: string) {
        document.execCommand(command, false);
    }

    async saveDescription(event: any) {
        const newDesc = event.target.innerHTML;
        if (newDesc !== this.task.description) {
            await this.supabase.updateTask(this.task.id, { description: newDesc });
            this.task.description = newDesc;
            this.taskUpdated.emit();
        }
    }

    async loadTags() {
        if (!this.projectId) return;
        const { data } = await this.supabase.getTags(this.projectId);
        if (data) this.availableTags.set(data);
    }

    hasTag(tag: any) {
        return this.task?.tags?.some((t: any) => t.id === tag.id) ||
            this.task?.task_tags?.some((tt: any) => tt.tag?.id === tag.id); // Handle nested structure
    }

    async toggleTag(tag: any) {
        if (this.hasTag(tag)) {
            await this.supabase.removeTaskTag(this.task.id, tag.id);
        } else {
            await this.supabase.addTaskTag(this.task.id, tag.id);
        }
        this.taskUpdated.emit(); // Trigger refresh to reload tags correctly
    }

    async createNewTag() {
        if (!this.newTagName || !this.projectId) return;
        const { data } = await this.supabase.createTag({
            project_id: this.projectId,
            name: this.newTagName,
            color: this.newTagColor
        });
        if (data) {
            this.loadTags();
            this.toggleTag(data); // Auto-assign
            this.newTagName = '';
        }
    }

    async uploadImage(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        const path = `${this.projectId}/${this.task.id}/${Date.now()}-${file.name}`;
        const { data, error } = await this.supabase.uploadFile(file, path);

        if (data) {
            const { data: publicUrl } = await this.supabase.getPublicUrl(path);
            const currentAttachments = this.task.attachments || [];
            const newAttachment = { type: 'image', url: publicUrl.publicUrl, name: file.name };

            await this.supabase.updateTask(this.task.id, {
                attachments: [...currentAttachments, newAttachment]
            });
            this.taskUpdated.emit();
        }
    }
}
