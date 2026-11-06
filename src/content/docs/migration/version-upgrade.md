---
title: Version Upgrade Guide 🔄
description: Upgrade to Angular 22 with ng update — requirements, every v21→v22 and v20→v21 breaking change, automatic migrations, and the version support table.
sidebar:
  order: 1
---

Staying on a supported Angular version gets you security fixes, faster builds and the newest APIs. Thanks to `ng update`, most upgrades are a single command plus a review of what changed. This guide shows the safe process and lists **every breaking change and automatic migration** for the last two majors, so you know exactly what to expect.

**What you'll learn**

- How Angular versions and support windows work (and what changed in v22)
- Node.js, TypeScript and RxJS requirements per version
- The step-by-step `ng update` process — one major at a time
- Every v21 → v22 breaking change and the migrations that fix them
- Every v20 → v21 breaking change (zoneless default, `BootstrapContext`, Vitest …)
- How to handle third-party libraries and failed upgrades

## How Angular versions work

Angular follows semantic versioning: **major.minor.patch** (for example `22.2.4`).

| Release | What it contains | Effort to update |
|---|---|---|
| Major (22.0) | New features and planned breaking changes | `ng update` + review |
| Minor (22.2) | New features, fully backward compatible | Usually none |
| Patch (22.2.4) | Bug fixes | None |

**Release cadence.** Starting with v22, Angular ships **one major version per year** with 4–6 minors in between (until v21 it was a major every six months). Each major is supported for **24 months**: 12 months of active support followed by 12 months of long-term support (LTS, critical and security fixes only).

### Supported versions (November 2026)

| Version | Status | Released | Active support ends | LTS ends |
|---|---|---|---|---|
| **22.x** | Active | 2026-06-03 | 2027-06 | 2028-06 |
| 21.x | LTS | 2025-11-19 | 2026-06-03 | 2027-06 |
| 20.x | LTS | 2025-05-28 | 2025-11-19 | **2026-11-28** |
| 19 and older | ❌ Unsupported | — | — | — |

The next major, **v23, is planned for around June 2027**. If you're on v20, its LTS ends at the end of November 2026 — upgrade now.

### Version requirements

| Angular | Node.js | TypeScript | RxJS |
|---|---|---|---|
| **22.x** | `^22.22.3` \|\| `^24.15.0` \|\| `^26.0.0` | `>=6.0 <6.1` | `^6.5.3` \|\| `^7.4.0` |
| 21.x | `^20.19.0` \|\| `^22.12.0` \|\| `^24.0.0` | `>=5.9 <6.0` | `^6.5.3` \|\| `^7.4.0` |
| 20.2.x – 20.3.x | `^20.19.0` \|\| `^22.12.0` \|\| `^24.0.0` | `>=5.8 <6.0` | `^6.5.3` \|\| `^7.4.0` |
| 20.0.x – 20.1.x | `^20.19.0` \|\| `^22.12.0` \|\| `^24.0.0` | `>=5.8 <5.9` | `^6.5.3` \|\| `^7.4.0` |

:::caution[Upgrade Node.js first]
Angular 22 **drops Node 20**. Update your machine, CI images and Dockerfiles to Node 24 (or 22.22.3+ / 26) *before* running `ng update`, or the update fails with an engine error. `ng update` installs the right TypeScript version for you.
:::

## The golden rule: one major at a time

`ng update` only supports moving **one major version per step**. To go from v20 to v22, run the update to v21, verify, commit, then update to v22:

```bash
ng update @angular/core@21 @angular/cli@21   # 20 → 21, then build, test, commit
ng update @angular/core@22 @angular/cli@22   # 21 → 22, then build, test, commit
```

Each major's migrations expect the code shape produced by the previous one — skipping a version means skipping migrations.

:::tip
Use the interactive **[Angular Update Guide](https://angular.dev/update-guide)**: pick your current and target versions and app complexity, and it produces a checklist of manual steps. This page covers the same ground for v20 → v22 in more detail.
:::

## Step-by-step upgrade

### 1. Prepare

```bash
git status                      # start from a clean, committed state
node --version                  # v22.22.3+, v24.15+ or v26 for Angular 22
ng version                      # what you have now
npx ng test --no-watch          # tests green before you start
npx ng build                    # build green before you start
```

Also check that your key third-party libraries (component libraries, NgRx, i18n libraries, …) have released a version that supports the target Angular major.

### 2. See what can be updated

```bash
ng update
```

Without arguments, `ng update` lists the packages that have updates and the command to run for each.

### 3. Update Angular core and the CLI together

```bash
ng update @angular/core@22 @angular/cli@22
```

This command:

1. Updates `@angular/*` packages (and TypeScript, zone.js etc. if needed) in `package.json`
2. Installs the new versions
3. Runs **migration schematics** that rewrite your code for breaking changes
4. Formats the files it changed (with Prettier, if your project has it)

During the update you may be asked whether to run **optional migrations** (for example, switching to the `application` builder or migrating Karma to Vitest). You can say no and run them later.

### 4. Update other Angular-related packages

```bash
ng update @angular/material@22   # also updates @angular/cdk and related packages
ng update @ngrx/store             # third-party packages with ng update support
npm outdated                      # find the rest
```

### 5. Review, build, test

```bash
git diff                          # read what the migrations changed
npx ng build
npx ng test --no-watch
npx ng e2e                        # or npx playwright test
npx ng serve                      # click through key flows
```

Look for `TODO` comments left by migrations — they mark code the schematic couldn't convert safely.

### Useful `ng update` options

| Option | What it does |
|---|---|
| `--create-commits` | Creates a Git commit for the update and for **each** migration — great for reviewing |
| `--allow-dirty` | Allows updating with uncommitted changes (not recommended) |
| `--force` | Ignores peer-dependency mismatches (use only when a library lags behind) |
| `--next` | Updates to the next pre-release (`-next`, `-rc`) for early testing |
| `--migrate-only --name <migration>` | Re-runs one migration of a package without changing versions |
| `--migrate-only --from 21 --to 22` | Re-runs all migrations in a version range |
| `--verbose` | Prints detailed logs |

```bash
# Re-run the OnPush/Eager migration after reverting a file by mistake
ng update @angular/core --migrate-only --name change-detection-eager
```

:::note
`ng update` has **no `--dry-run` flag**. Use a clean branch plus `--create-commits` to review every change, and `git reset` if you want to start over.
:::

## Angular 21 → 22

### Automatic migrations run by `ng update`

| Migration (name) | What it changes | Why |
|---|---|---|
| `change-detection-eager` | Adds `changeDetection: ChangeDetectionStrategy.Eager` to components that had **no** `changeDetection`, and replaces `ChangeDetectionStrategy.Default` with `Eager` | Components are now **OnPush by default**; this keeps your app behaving exactly as before |
| `http-xhr-backend` | Adds `withXhr()` to `provideHttpClient()` where your app relied on `HttpXhrBackend` | `HttpClient` now uses the Fetch API by default |
| `strict-templates-default` | Adds `"strictTemplates": false` to `angularCompilerOptions` if you never set it | Strict template type checking is now **on by default** |
| `strict-safe-navigation-narrow` | Sets the `nullishCoalescingNotNullable` and `optionalChainNotNullable` extended diagnostics to `suppress` | Smarter null narrowing would otherwise surface many new warnings |
| `safe-optional-chaining` | Wraps existing template `?.` expressions in `$safeNavigationMigration(...)` | Template `?.` now returns `undefined` (like JavaScript) instead of `null` |
| `can-match-snapshot-required` | Adds the third `currentSnapshot` argument to direct `canMatch` call sites | The parameter is now required |
| `incremental-hydration` | Adds `withNoIncrementalHydration()` to `provideClientHydration()` if you didn't use incremental hydration | **Incremental hydration is now the default** |
| `model-output` | Fixes components that declare both a `model()` and a separate `@Output()` with the same `…Change` name | Duplicate outputs are now a compile error |
| `trust-proxy-headers` (CLI) | Adds `trustProxyHeaders: ['x-forwarded-host', 'x-forwarded-proto']` with a TODO to `AngularNodeAppEngine`/`AngularAppEngine` in `server.ts` | Proxy headers are now ignored unless trusted |
| `update-workspace-config` (CLI) | Renames `ssr.experimentalPlatform` to `ssr.platform` in `angular.json` | Option graduated |
| `add-istanbul-instrumenter` (CLI) | Adds `istanbul-lib-instrument` to `devDependencies` for Karma projects | It's now an optional peer dependency |
| `use-application-builder` (CLI, optional) | Moves Webpack `browser` builders to `@angular/build:application` | Webpack builders are deprecated |
| `migrate-karma-to-vitest` (CLI, optional) | Switches the legacy Karma test target to the `unit-test` builder with Vitest | Vitest is the default runner |

Most of these migrations **preserve old behaviour** so your app keeps working on day one. Plan follow-up work to adopt the new defaults (remove `Eager`, re-enable strict templates, remove `$safeNavigationMigration`) — see [Codebase Modernization](/migration/modernization/).

### Breaking changes explained

#### Components are OnPush by default

A component without a `changeDetection` property now uses `OnPush`. It re-renders only when an input changes, a template event fires, a signal it reads changes, an `async` pipe emits, or you call `markForCheck()`. Code that mutates plain fields from timers or callbacks stops updating the view.

The migration pins existing components to the old behaviour:

```ts ins={5}
@Component({
  selector: 'app-legacy-widget',
  template: `<p>{{ count }}</p>`,
  // Added by ng update: keep the pre-v22 "check every time" behaviour
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class LegacyWidget {
  count = 0;
}
```

`ChangeDetectionStrategy.Eager` (added in 21.2) is the new name for the old `Default`; **`Default` is deprecated**. New components need no `changeDetection` at all — OnPush is the default since v22. Once a component uses signals for its state, delete the `Eager` line.

#### `HttpClient` uses `fetch` by default

`provideHttpClient()` now uses `FetchBackend`. `withFetch()` is deprecated and can simply be deleted. Fetch can't report **upload** progress, so if you need upload progress events, opt back into XHR:

```ts
provideHttpClient(withXhr());
```

The `reportProgress` request option is deprecated — use `reportUploadProgress` and/or `reportDownloadProgress`:

```ts
this.http.post('/api/upload', formData, { observe: 'events', reportUploadProgress: true });
```

#### Strict templates and smarter null checks

- `strictTemplates` now defaults to `true`. The migration writes `"strictTemplates": false` into existing projects; remove it and fix the reported errors when you can.
- Safe navigation now narrows nullables correctly, which triggers the `nullishCoalescingNotNullable` and `optionalChainNotNullable` diagnostics on existing code (temporarily suppressed by the migration).
- In templates, `a?.b` now evaluates to `undefined` instead of `null` when `a` is nullish, matching JavaScript. The migration wraps existing expressions as `{{ $safeNavigationMigration(user?.name) }}` to keep the old `null` result. It's a temporary aid — remove it once your code doesn't depend on `null` vs `undefined`.

#### Router

- `paramsInheritanceStrategy` now defaults to **`'always'`**: child routes inherit params from all parents. Restore the old behaviour with `provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' }))`.
- The third `currentSnapshot` parameter of `CanMatchFn` and `CanMatch.canMatch` is now **required** in the types. Class guards must declare it:

```ts
@Service()
export class AdminMatchGuard implements CanMatch {
  private readonly auth = inject(AuthService);

  canMatch(route: Route, segments: UrlSegment[], currentSnapshot: PartialMatchRouteSnapshot): MaybeAsync<GuardResult> {
    return this.auth.isAdmin();
  }
}
```

- `provideRoutes()` was removed — use `provideRouter()` (or the `ROUTES` multi token).
- `TitleStrategy.getResolvedTitleForRoute` now returns `string | undefined` instead of `any`.

#### Removed APIs

| Removed | Use instead |
|---|---|
| `ComponentFactoryResolver`, `ComponentFactory` | `viewContainerRef.createComponent(MyComponent)` or `createComponent(MyComponent, {...})` |
| `createNgModuleRef` | `createNgModule` |
| `ChangeDetectorRef.checkNoChanges` | In tests, `fixture.detectChanges()` |
| HammerJS integration (`HammerModule`, gesture config) | Your own pointer-event handling or a gesture library |
| `provideRoutes()` | `provideRouter()` / `ROUTES` |
| `getAngularLib` / `setAngularLib` (upgrade) | `getAngularJSGlobal` / `setAngularJSGlobal` |

#### Smaller compiler and runtime changes

- Attributes prefixed with `data-` no longer bind to inputs or outputs.
- Binding the same input, output or `model` twice on one element is a compile error; so is an element matched by **multiple components**.
- The second argument of `ApplicationRef.bootstrap()` no longer accepts `any` — pass a non-null element or selector.
- Component styles are removed from the page when no host uses them anymore. Global CSS that accidentally relied on a component's styles may lose styling.
- `animate.leave` animations are no longer limited to the removed element (nested leave animations run, scoped to component boundaries), and `AnimationCallbackEvent.animationComplete` changed signature.
- Signal Forms: the `min` and `max` rules accept only numbers (or `null`), not strings.
- TypeScript **6.0** is required; TypeScript 5.9 is no longer supported.

#### CLI and tooling changes

- **Node.js 20 is no longer supported** (`^22.22.3 || ^24.15.0 || >=26`).
- `ng serve` gives the **`PORT` environment variable the highest priority**, overriding `--port` and `angular.json`.
- SSR: a request whose `Host` isn't in `allowedHosts` now gets **`400 Bad Request`** instead of falling back to client rendering. Configure `security.allowedHosts` in `angular.json` or the `NG_ALLOWED_HOSTS` env var (see [Deployment Strategies](/deployment/strategies/#configure-allowed-hosts)).
- The experimental `@angular-devkit/build-angular:jest` and `:web-test-runner` builders were removed; the `@angular-devkit/architect-cli` package was folded into `@angular-devkit/architect`.
- `istanbul-lib-instrument` is now an optional peer dependency (the migration adds it for Karma users).

### New deprecations in v22.x

| Deprecated | Replacement |
|---|---|
| `withFetch()` | Nothing — fetch is the default (delete it) |
| `reportProgress` option | `reportUploadProgress` / `reportDownloadProgress` |
| `ChangeDetectionStrategy.Default` | `ChangeDetectionStrategy.Eager` (or OnPush) |
| `withIncrementalHydration()` | Nothing — it's the default (`withNoIncrementalHydration()` to opt out) |
| `CommonEngine` (`@angular/ssr/node`) | `AngularNodeAppEngine` / `AngularAppEngine` |
| Webpack builders (`@angular-devkit/build-angular`, `build-webpack`, `@ngtools/webpack`) | `@angular/build` builders |
| `HttpClient.jsonp`, `HttpClientJsonpModule`, `withJsonpSupport` (22.1) | Regular HTTP requests (CORS) |
| `splitting` option of the unit-test builder (22.2) | Not needed with Vitest 5 |

### Optional: adopt `@Service()` (22.1+)

v22 added the `@Service()` decorator — a shorter `@Injectable({ providedIn: 'root' })`. It is **not** applied automatically by `ng update`; run it yourself when ready:

```bash
ng generate @angular/core:service
```

See [Codebase Modernization](/migration/modernization/#injectable--service) for details and limitations.

## Angular 20 → 21

### Highlights and breaking changes

**Zoneless by default.** New v21 projects don't include zone.js. Existing apps keep zone.js, but Angular no longer adds the zone-based scheduler implicitly — you must provide it. The v21 `ng update` migration adds it for you:

```ts title="app.config.ts"
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // ...
  ],
};
```

Leave it in place until you migrate to zoneless (see [Zoneless](/modern/zoneless/)). The `ignoreChangesOutsideZone` option was removed.

**SSR bootstrapping uses `BootstrapContext`.** Server bootstrap functions now receive a context instead of relying on a global platform. A migration updates `main.server.ts`:

```ts title="main.server.ts" del={1} ins={2-3}
const bootstrap = () => bootstrapApplication(App, config);
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(App, config, context);
export default bootstrap;
```

On the server, `getPlatform()` returns `null` and `destroyPlatform()` is a no-op.

**Vitest is the default test runner for new projects.** Existing Karma projects keep working on v21. To switch, use the optional v22 `migrate-karma-to-vitest` migration plus `ng g @schematics/angular:refactor-jasmine-vitest` (see [Codebase Modernization](/migration/modernization/#karma--jasmine--vitest)).

Other v21 changes:

- **TypeScript 5.9** required (5.8 dropped).
- **Host bindings are type-checked** by default. Fix the new errors or set `"typeCheckHostBindings": false` temporarily.
- Removed: `NgModuleFactory` (use `NgModule` classes), the component `moduleId` and `interpolation` options, `UpgradeAdapter` (use `@angular/upgrade/static`), and the `ApplicationConfig` export from `@angular/platform-browser` (import it from `@angular/core`).
- Router: `lastSuccessfulNavigation` is now a **signal** — call it: `router.lastSuccessfulNavigation()`. Navigations may take a few extra microtasks; tests should wait for navigation to finish.
- Tests: `TestBed` provides a fake `PlatformLocation` that supports the Navigation API, and errors are rethrown even when `provideZoneChangeDetection` is in TestBed providers.
- `ngComponentOutletContent` is typed `Node[][] | undefined`.
- Custom elements: signal inputs are read like plain properties (`el.myInput`, not `el.myInput()`).
- Forms: the new `FormArrayDirective` (`[formArray]`) can conflict with existing directives or inputs named `formArray`.
- The compiler errors when `emitDeclarationOnly` is enabled.
- CLI: `cnpm` is no longer auto-detected; Less `javascriptEnabled` is no longer supported.
- Deprecated: `HttpResponseBase.statusText`.

v21 also added the `ngclass-to-class`, `ngstyle-to-style`, `common-to-standalone` and `router-testing-module-migration` schematics — optional, run them with `ng generate` (see [Codebase Modernization](/migration/modernization/)).

## Coming from older versions

Upgrade one major at a time and follow the Update Guide for each step. The big themes you'll pass through:

| Version | Notable changes to expect |
|---|---|
| 17 | Built-in control flow (`@if`, `@for`), `@defer`, new `application` builder (esbuild + Vite) |
| 18 | Signal inputs/outputs/queries/`model()` matured, zoneless experimental, `@let` (18.1) |
| 19 | **Standalone is the default** (`standalone: false` added to NgModule-declared components by the migration), `linkedSignal`, `resource` (experimental), incremental hydration preview |
| 20 | `effect`, `linkedSignal`, `toSignal` stable; zoneless stable (20.2); `@angular/animations` deprecated (20.2) in favour of `animate.enter`/`animate.leave` |

## Third-party libraries

Libraries often release support for a new Angular major a few days or weeks later.

- Check each library's release notes or `peerDependencies` (`npm info <pkg> peerDependencies`).
- Prefer waiting for a compatible release over forcing the install.
- If you must proceed, `ng update ... --force` or an npm `overrides` entry can unblock you temporarily:

```json title="package.json (temporary!)"
{
  "overrides": {
    "some-angular-library": {
      "@angular/core": "$@angular/core"
    }
  }
}
```

:::caution
`--force`, `--legacy-peer-deps` and `overrides` hide real incompatibilities. Remove them as soon as the library ships official support.
:::

## Troubleshooting

| Problem | Fix |
|---|---|
| `ng update` refuses to run: "repository is not clean" | Commit or stash changes (or `--allow-dirty`) |
| Engine error / "Node.js version … is not supported" | Install Node 22.22.3+, 24.15+ or 26 |
| Peer dependency conflict with a library | Update that library first, or wait for a compatible release |
| A migration failed halfway | `git checkout .`, fix the reported file, then `ng update @angular/core --migrate-only --from 21 --to 22` |
| Many new template type errors | Expected after enabling strict templates — fix them, or keep `"strictTemplates": false` temporarily |
| Views don't update after the upgrade | A component lost `Eager` and relies on mutation — add `ChangeDetectionStrategy.Eager` or move state to signals |
| Upload progress events stopped | Add `withXhr()` to `provideHttpClient()` |
| SSR returns 400 | Add your domains to `allowedHosts` / `NG_ALLOWED_HOSTS` |
| Strange build errors | Delete `.angular/cache` and `node_modules`, then `npm install` |

## Post-upgrade checklist

- [ ] `ng build` succeeds (production configuration)
- [ ] Unit tests (`ng test`) and e2e tests pass
- [ ] App starts and key user flows work in the browser
- [ ] No new console errors or warnings in dev mode
- [ ] Reviewed migration diffs and `TODO` comments
- [ ] CI, Docker images and hosting use a supported Node version
- [ ] Bundle size is comparable (check the build summary and budgets)
- [ ] Planned follow-ups: remove `Eager`, re-enable strict templates, drop `$safeNavigationMigration`, adopt zoneless

## Key takeaways

- Upgrade one major at a time: `ng update @angular/core@22 @angular/cli@22`.
- Angular 22 needs Node 22.22.3+/24.15+/26 and TypeScript 6.0.
- From v22, majors ship yearly and each is supported for 24 months.
- The v22 migrations keep old behaviour (Eager change detection, XHR, non-strict templates, `null` safe navigation) — then you modernize at your own pace.
- Review every migration diff and run the full test suite before merging.

## Next steps

1. **[Codebase Modernization](/migration/modernization/)** — adopt OnPush, zoneless, Vitest and the other new defaults
2. **[Standalone Migration](/migration/standalone/)** — remove NgModules
3. **[Signals Migration](/migration/signals/)** — convert inputs, outputs and queries to signals
