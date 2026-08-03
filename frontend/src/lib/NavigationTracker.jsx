import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { pagesConfig } from '@/pages.config';

// Page-view analytics previously went through base44.appLogs.logUserInApp.
// Per the Phase 2 migration plan, this is intentionally a no-op for now -
// deferred past MVP. Swap in a real analytics call here (e.g. your own
// POST /api/analytics/pageview, or a third-party tool) when ready.
export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    useEffect(() => {
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(
                key => key.toLowerCase() === pathSegment.toLowerCase()
            );
            pageName = matchedKey || null;
        }

        if (isAuthenticated && pageName) {
            // no-op placeholder - see comment above
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}
