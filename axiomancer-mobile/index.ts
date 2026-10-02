// App entry point. Bare-RN bootstrap: `registerRootComponent` handles
// `AppRegistry.registerComponent` (native) and mounting into `#root` (web)
// itself; navigation comes from `@/lib/platform/router` (react-navigation),
// wired inside
// `app/_layout.tsx`'s own `<NavigationContainer>`, not from a router
// package driving app bootstrap.
import { registerRootComponent } from 'expo';

import RootLayout from './app/_layout';

registerRootComponent(RootLayout);
