import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { BoardComponent } from './components/board/board.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectLandingComponent } from './components/project-landing/project-landing.component';
import { IssueDetailComponent } from './components/issue-detail/issue-detail.component';
import { DocEditorComponent } from './components/doc-editor/doc-editor.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'unauthorized', component: UnauthorizedComponent },
    { path: 'projects', component: ProjectListComponent, canActivate: [authGuard] },
    { path: 'project/:id', component: ProjectLandingComponent, canActivate: [authGuard] },
    { path: 'issue/:id', component: IssueDetailComponent, canActivate: [authGuard] },
    { path: 'doc/:id', component: DocEditorComponent, canActivate: [authGuard] },
    { path: '', redirectTo: '/projects', pathMatch: 'full' }
];
