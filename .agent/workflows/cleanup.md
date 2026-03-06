---
description: 
---

1. Structural Refactor: The "LIFT" Principle
To ensure your project can handle heavy tensor-field density calculations without UI lag, we follow the official Angular style guide's LIFT principle: Locate code quickly, Identify at a glance, Flat structure (as much as possible), and Try to stay DRY.

2. Code Cleanup & Modernization
To maximize efficiency and avoid virtual containment breaches, we must leverage modern Angular features:

Signals over Observables: For synchronous state management (like real-time mass_displacement values), transition to Angular Signals to reduce change detection overhead.

Standalone Components: Remove bloated NgModules. This reduces the dependency graph and speeds up the initial "bootstrap" of your gravity-nullification dashboard.

Control Flow Syntax: Replace *ngIf and *ngFor with the new @if and @for syntax for better performance and readability.

Directory Structure Refactor