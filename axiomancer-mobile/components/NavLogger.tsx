/**
 * Null-rendering route observer — logs every expo-router path change to
 * the AXM Log `nav` domain so agents can reconstruct the navigation
 * timeline (docs/logging.md). Mounted once in the root layout.
 */

import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { getLogger } from '@mechanics';

export function NavLogger(): null {
    const pathname = usePathname();
    useEffect(() => {
        try {
            getLogger().info('nav', 'route-changed', { pathname });
        } catch { /* logging never breaks play */ }
    }, [pathname]);
    return null;
}
