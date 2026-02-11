import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private _currentUser = new BehaviorSubject<User | null>(null);

    currentUser$ = this._currentUser.asObservable();

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

        // Initialize session
        this.supabase.auth.getSession().then(({ data: { session } }) => {
            this._currentUser.next(session?.user ?? null);
        }).catch(error => {
            console.error('Error initializing Supabase session:', error);
            // Handle lock errors gracefully (usually due to multiple tabs)
        });

        // Listen to changes
        this.supabase.auth.onAuthStateChange((_event, session) => {
            this._currentUser.next(session?.user ?? null);
        });
    }

    get client() {
        return this.supabase;
    }

    /* Auth Methods */

    async signUp(email: string, password: string) {
        return this.supabase.auth.signUp({
            email,
            password,
        });
    }

    async signIn(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({
            email,
            password,
        });
    }

    async signOut() {
        return this.supabase.auth.signOut();
    }

    /* Data Methods (Examples) */

    async getWorkspaces() {
        return this.supabase.from('workspaces').select('*');
    }

    async createWorkspace(name: string, ownerId: string) {
        return this.supabase.from('workspaces').insert({ name, owner_id: ownerId });
    }

    /* Project Methods */

    async getProjects() {
        return this.supabase.from('projects').select('*').order('created_at', { ascending: false });
    }

    async getProject(id: string) {
        return this.supabase.from('projects').select('*').eq('id', id).single();
    }

    async createProject(project: { title: string; description: string; cover_image: string; owner_id: string }) {
        return this.supabase.from('projects').insert(project).select().single();
    }

    /* Task Methods */

    async getTasks(projectId: string) {
        return this.supabase.from('tasks').select(`
            *,
            assignee:assignee_id(email),
            task_tags(
                tag:tags(*)
            )
        `).eq('project_id', projectId);
    }

    async createTask(task: { title: string; project_id: string; status: string; priority?: string }) {
        return this.supabase.from('tasks').insert(task).select().single();
    }

    async updateTaskStatus(taskId: string, status: string) {
        return this.supabase.from('tasks').update({ status }).eq('id', taskId);
    }

    /* Activity Log Methods */

    async getLogs(projectId: string, limit = 5) {
        console.log('Fetching logs for project:', projectId, 'limit:', limit);
        const result = await this.supabase
            .from('activity_logs')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(limit);

        console.log('Log fetch result:', result);
        return result;
    }

    async createLog(log: {
        project_id: string;
        user_id: string;
        user_email?: string;
        action: string;
        details: any
    }) {
        return this.supabase.from('activity_logs').insert(log);
    }

    /* Task Update Method */
    async updateTask(id: string, updates: any) {
        return this.supabase.from('tasks').update(updates).eq('id', id);
    }

    /* Tag Methods */

    async getTags(projectId: string) {
        return this.supabase.from('tags').select('*').eq('project_id', projectId);
    }

    async createTag(tag: { project_id: string; name: string; color: string }) {
        return this.supabase.from('tags').insert(tag).select().single();
    }

    async addTaskTag(taskId: string, tagId: string) {
        return this.supabase.from('task_tags').insert({ task_id: taskId, tag_id: tagId });
    }

    async removeTaskTag(taskId: string, tagId: string) {
        return this.supabase.from('task_tags').delete().match({ task_id: taskId, tag_id: tagId });
    }

    /* Storage Methods */

    async uploadFile(file: File, path: string) {
        return this.supabase.storage.from('task-attachments').upload(path, file);
    }

    async getPublicUrl(path: string) {
        return this.supabase.storage.from('task-attachments').getPublicUrl(path);
    }
}
