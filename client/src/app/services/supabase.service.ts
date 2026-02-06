import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
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
}
