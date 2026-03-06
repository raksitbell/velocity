import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    const { data: { session } } = await supabase.client.auth.getSession();

    if (session) {
        return true;
    }

    return router.createUrlTree(['/unauthorized']);
};
