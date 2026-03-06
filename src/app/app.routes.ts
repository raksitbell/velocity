import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { BoardComponent } from './features/board/board.component';
import { ProjectListComponent } from './features/project-list/project-list.component';
import { ProjectLandingComponent } from './features/project-landing/project-landing.component';
import { IssueDetailComponent } from './features/issue-detail/issue-detail.component';
import { DocEditorComponent } from './features/doc-editor/doc-editor.component';
import { UnauthorizedComponent } from './features/auth/unauthorized.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'unauthorized', component: UnauthorizedComponent },
    { path: 'projects', component: ProjectListComponent, canActivate: [authGuard] },
    { path: 'project/:id', component: ProjectLandingComponent, canActivate: [authGuard] },
    { path: 'issue/:id', component: IssueDetailComponent, canActivate: [authGuard] },
    { path: 'doc/:id', component: DocEditorComponent, canActivate: [authGuard] },
    { path: '', redirectTo: '/projects', pathMatch: 'full' }
];
