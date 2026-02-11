import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-unauthorized',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <!-- Lock Icon -->
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
        <p class="text-gray-600 mb-6">
            You tried to access a protected area. You need to sign in to continue.
        </p>

        <div class="bg-indigo-50 rounded-md p-4 mb-6">
            <p class="text-indigo-700 font-medium">
                Redirecting to login in <span class="font-bold text-xl">{{ countdown }}</span> seconds...
            </p>
        </div>

        <button (click)="redirectNow()" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
            Go to Login Now
        </button>
      </div>
    </div>
  `
})
export class UnauthorizedComponent implements OnInit, OnDestroy {
    countdown = 5;
    private intervalId: any;

    constructor(private router: Router) { }

    ngOnInit() {
        this.intervalId = setInterval(() => {
            this.countdown--;
            if (this.countdown === 0) {
                this.redirectNow();
            }
        }, 1000);
    }

    ngOnDestroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    redirectNow() {
        this.router.navigate(['/login']);
    }
}
