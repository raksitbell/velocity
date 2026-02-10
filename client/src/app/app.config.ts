import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LucideAngularModule, LayoutGrid, Plus, Image, FolderOpen, X, ArrowLeft, Box, Trello, Share2, Calendar, User, AlertCircle, Menu, Search, Lock, Star, MoreHorizontal, Kanban, ChartGantt, Filter, ArrowUpDown, Zap, ChevronDown, FileText, HelpCircle, Info } from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(LucideAngularModule.pick({
      LayoutGrid, Plus, Image, FolderOpen, X, ArrowLeft, Box, Trello, Share2, Calendar, User, AlertCircle, Menu, Search, Lock, Star, MoreHorizontal, Kanban, ChartGantt, Filter, ArrowUpDown, Zap, ChevronDown, FileText, HelpCircle, Info
    }))
  ]
};
