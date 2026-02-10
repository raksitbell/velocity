import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {{ isSignUp ? 'Create your account' : 'Sign in to your account' }}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Or
            <button (click)="toggleMode()" class="font-medium text-indigo-600 hover:text-indigo-500 underline focus:outline-none">
              {{ isSignUp ? 'sign in to existing account' : 'create a new account' }}
            </button>
          </p>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="rounded-md shadow-sm -space-y-px">
            <div class="mb-4">
              <label for="email-address" class="block text-sm font-medium text-gray-700">Email address</label>
              <input formControlName="email" id="email-address" name="email" type="email" autocomplete="email" required class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Email address">
            </div>
            <div class="mb-4">
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input formControlName="password" id="password" name="password" type="password" autocomplete="current-password" required class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" placeholder="Password">
            </div>
          </div>

          <div>
            <button type="submit" [disabled]="loading" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg *ngIf="!loading" class="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                <svg *ngIf="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In') }}
            </button>
          </div>
          
          <div *ngIf="message" class="text-sm text-center font-medium" [ngClass]="{'text-green-600': !isError, 'text-red-600': isError}">
            {{ message }}
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  message = '';
  isError = false;
  isSignUp = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.message = '';
    this.isError = false;
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.message = '';
    this.isError = false;

    const { email, password } = this.loginForm.value;

    try {
      if (this.isSignUp) {
        const { error } = await this.supabase.signUp(email, password);
        if (error) throw error;
        this.message = 'Account created! You can now sign in.';
        this.isSignUp = false; // Switch to login mode
      } else {
        const { error } = await this.supabase.signIn(email, password);
        if (error) throw error;
        void this.router.navigate(['/projects']);
      }
    } catch (error: any) {
      this.isError = true;
      this.message = error.error_description || error.message;
    } finally {
      this.loading = false;
    }
  }
}
