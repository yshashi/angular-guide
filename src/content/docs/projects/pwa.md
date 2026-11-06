---
title: Progressive Web App 📱
description: Turn an Angular 22 app into a progressive web app with the service worker, asset and data caching, update notifications and offline UX.
sidebar:
  order: 8
---

Progressive web apps can be installed and can cache selected resources for offline use. Angular's service worker is one option for an Angular app; it is not a replacement for designing explicit offline states or synchronizing data safely.

## Add service-worker support

```bash
ng add @angular/pwa
```

The schematic adds the service-worker package, registers it for production builds and creates a starter `ngsw-config.json` and web manifest. Inspect the generated files and build configuration after the command.

The Angular service worker is intended primarily for production builds. To try it locally, build and serve the output with the service-worker configuration enabled; a regular development `ng serve` does not behave like a deployed PWA.

## Configure asset and data caching

`ngsw-config.json` can define `assetGroups` for app-shell resources and `dataGroups` for HTTP data. Keep groups narrow and select a cache policy that matches the data:

```json title="ngsw-config.json (illustrative excerpt)"
{
  "assetGroups": [
    {
      "name": "app-shell",
      "installMode": "prefetch",
      "resources": {
        "files": ["/index.html", "/*.css", "/*.js"]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "public-catalog",
      "urls": ["/api/public/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 50,
        "maxAge": "1h",
        "timeout": "5s"
      }
    }
  ]
}
```

This is a pattern to adapt, not a complete replacement for the generated configuration. Confirm patterns against the service-worker schema in your project and do not cache authenticated or sensitive responses as public data.

## Notify users when a new version is available

Inject `SwUpdate` and subscribe to `versionUpdates`. Tell the user an update is ready, then reload after they choose to apply it:

```ts
import { Service, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

@Service()
export class AppUpdateService {
  private readonly updates = inject(SwUpdate);

  constructor() {
    this.updates.versionUpdates
      .pipe(filter((event) => event.type === 'VERSION_READY'))
      .subscribe(() => {
        // Expose an "Update available" notification to the app UI.
      });
  }

  async activateUpdate(): Promise<void> {
    if (await this.updates.activateUpdate()) location.reload();
  }
}
```

In a larger app, expose update state with `toSignal()` or a signal in a service and let an accessible notification provide an explicit **Refresh** button. `SwUpdate` is useful only when the service worker is enabled.

## Show offline state

For basic connectivity status, listen to the browser's `online` and `offline` events and expose the state in the UI. Connectivity does not guarantee that the API is reachable, so handle request failures as well.

## Push notifications

Angular provides `SwPush` for service-worker push subscriptions and messages. Push also requires a push service and server-side code to issue and authorize messages. Ask for permission after a user action, explain what notifications are for, and provide a way to unsubscribe. Do not send sensitive information in notification payloads.

## Test and deploy

- Test installability and offline behavior in a production build.
- Use browser developer tools to inspect service-worker registration and caches.
- Test version updates across two builds.
- Verify HTTPS, manifest icons, app name and theme color.
- Treat browser storage and cached data as untrusted; do not cache private responses accidentally.

## Next steps

- [Deployment Strategies](/deployment/strategies/)
- [HTTP Client](/beginner/http/)
- [SSR Introduction](/ssr/introduction/)
