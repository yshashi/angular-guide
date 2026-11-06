---
title: Mobile Apps with Angular 📱
description: Choose between a responsive PWA and an Ionic/Capacitor mobile app, and learn what Angular can share across web and native projects.
sidebar:
  order: 9
---

Angular applications primarily target the web. To ship a mobile experience, choose between a responsive website/PWA and a native app shell that hosts web UI. The right option depends on device features, offline requirements, app-store distribution and the experience your users expect.

## Choose an approach

| Approach | What you ship | Good fit |
|---|---|---|
| Responsive Angular app | A website that adapts to phone screens | Content, dashboards and apps where installation is optional |
| Progressive web app | A website that can be installed and selectively work offline | Apps that benefit from an app-like experience without app-store distribution |
| Ionic with Capacitor | Angular UI in a native WebView, with plugins for device capabilities | Teams that want web skills with app-store packaging and access to supported device APIs |
| Native application framework | Native UI rendered by a mobile-specific framework | Apps requiring native UI behavior or platform capabilities that a WebView cannot meet |

Angular does not itself compile an Angular website into a native UI. Ionic/Capacitor packages web content in a native shell; evaluate performance, plugin support and platform requirements before choosing it.

## Start with a mobile-friendly Angular app

Build semantic, responsive UI first:

- Use native form controls, visible labels and keyboard-accessible navigation.
- Use flexible layouts and avoid fixed-width content.
- Keep touch targets comfortably sized and provide clear focus styles.
- Handle poor connectivity and loading states.
- Test at narrow viewport widths and with keyboard navigation.

For installability and offline behavior, see [Progressive Web App](/projects/pwa/).

## Add a native shell

For an Ionic/Capacitor application, follow the current installation instructions from the [Ionic Angular documentation](https://ionicframework.com/docs/angular/overview) and the [Capacitor documentation](https://capacitorjs.com/docs). Package names and setup commands can change independently of Angular, so use the documentation that matches your chosen versions rather than copying an old Angular CLI command.

Keep platform-specific integrations behind Angular services. Components should depend on an app-facing interface, not directly on a plugin:

```ts
export interface DeviceCamera {
  takePhoto(): Promise<string | null>;
}
```

Provide a browser implementation for web development and a Capacitor-backed implementation for native builds. Use a provider token to select the implementation at bootstrap.

## Test on devices

- Start with browser and responsive-layout tests.
- Run on both iOS and Android if you ship both platforms.
- Test permission denial, revoked permissions and unavailable hardware.
- Test offline transitions, app resume and interrupted requests.
- Check the current Capacitor plugin's supported platform versions.
- Verify privacy disclosures and platform store requirements before release.

## Next steps

- [Progressive Web App](/projects/pwa/)
- [Deployment Strategies](/deployment/strategies/)
- [Accessibility Best Practices](/resources/best-practices/)
