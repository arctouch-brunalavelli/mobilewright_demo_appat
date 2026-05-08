# mobilewright-demo

End-to-end mobile UI automation for the **ArcTouch demo app** (`com.arctouch.arctouch_demo_app`) on Android, built with [mobilewright](https://www.npmjs.com/package/mobilewright) — a Playwright-style framework for native mobile testing.

---

## Why mobilewright?

Tooling decisions are the foundation of a maintainable suite. Here is what was chosen, and why:

| Decision | Choice | Rationale |
|---|---|---|
| **Test framework** | `mobilewright` + `@mobilewright/test` | Playwright-style API (`getByLabel`, `getByRole`, `expect(...).toBeVisible()`), built-in **auto-waiting**, runs natively on iOS/Android via [`mobilecli`](https://github.com/mobile-next/mobilecli). No Selenium/WebDriver server, no XPath, no flaky `sleep()` calls. |
| **Language** | TypeScript | Strong typing on the Page Object layer catches selector typos at compile-time; the runner supports `.ts` natively, no transpile step. |
| **Test runner** | `npx mobilewright test` | Built on top of Playwright Test, so it inherits parallelism, retries, HTML reports, and screenshot-on-failure for free. |
| **Design pattern** | Page Object Model (POM) | Encapsulates "what" each screen contains and "how" actions are performed, so tests stay readable and selector changes touch exactly one file. |
| **Selector strategy** | `getByLabel` (content-desc) primary, `getByText` for static headings, `getByType` only when nothing else identifies an element | The `mobilecli` Android driver currently surfaces `content-desc` as `node.label` but does **not** expose Android `resource-id` values, so `getByTestId(...)` does not match Android resource-ids today. Content-descriptions also reflect accessibility quality, which is good for the app to enforce. |
| **Device target** | Local Android emulator (Pixel) | Fastest iteration loop. The same tests run unchanged on real devices via `mobilecli`, and on hosted real devices via [mobile-use.com](https://mobile-use.com). |
| **Inspector** | Throwaway test file (`tests/_inspect.test.ts`) that dumps the live accessibility tree | Re-uses the existing runner & config (no extra deps), and produces ground-truth `node.label` / `node.type` / `node.text` values — the same view mobilewright queries against. Filtered out of normal runs via `testIgnore: '**/_*.test.ts'`. |

---

## Project structure

```
mobilewright-demo/
├── mobilewright.config.ts        # platform, app bundle id, device matcher, timeouts
├── package.json
├── tests/
│   ├── _inspect.test.ts          # dumps the live accessibility tree (excluded from default runs)
│   ├── login.test.ts             # login screen specs
│   ├── example.test.ts           # initial scaffold (will be removed)
│   ├── smoke.test.ts             # placeholder for cross-app smoke checks
│   ├── navigation.test.ts        # placeholder for top-level navigation specs
│   └── pages/
│       ├── login.page.ts         # Page Object: selectors + composite actions for login
│       └── home.page.ts          # placeholder for home screen
└── test-results/                 # generated artifacts (screenshots on failure, etc.)
```

**Convention:** test files are `*.test.ts`. Files starting with `_` (underscore) are excluded from default runs; run them explicitly by passing the path.

---

## Prerequisites

| | Version | Notes |
|---|---|---|
| **Node.js** | ≥ 18 | Tested on Node 24 |
| **Android SDK** | API 34+ | `ANDROID_HOME` must be set |
| **ADB** | any modern | `adb devices` should list your emulator/device |
| **An Android emulator** | Pixel-named AVD (any API ≥ 34) | The config matches `/Pixel/` against device names |
| **The app** | `com.arctouch.arctouch_demo_app` installed on the emulator | Install manually via Android Studio, or add `installApps: ['./apps/arctouch.apk']` to the config |

Verify everything is wired up:

```bash
npx mobilewright doctor       # checks Node, ADB, Android SDK, emulators
npx mobilewright devices      # lists devices visible to mobilewright
adb shell pm list packages | grep arctouch    # confirms the app is installed
```

---

## Setup

```bash
git clone <this repo>
cd mobilewright-demo
npm install
```

That installs `mobilewright`, `@mobilewright/test`, and (transitively) `mobilecli`. There is no separate server to run — `mobilewright test` auto-starts `mobilecli` on `ws://localhost:12000/ws` and shuts it down at the end of the run.

---

## Running tests

```bash
# Run every test in the suite
npx mobilewright test

# Run only the login screen specs
npx mobilewright test tests/login.test.ts

# Filter by test name
npx mobilewright test --grep "Login screen"

# Generate and open the HTML report (recommended for first run; includes screenshot-on-failure)
npx mobilewright test --reporter html
npx mobilewright show-report

# Run the live-screen inspector (dumps accessibility tree to test-results/inspect/)
npx mobilewright test tests/_inspect.test.ts --reporter list
```

Before running, make sure:

1. The Pixel emulator is **booted** (`emulator -avd <name>` or via Android Studio).
2. The ArcTouch demo app is **installed** on it.
3. (Optional, for a clean state) Reset app data: `adb shell pm clear com.arctouch.arctouch_demo_app`.

The `device` fixture from `@mobilewright/test` automatically terminates and re-launches the app **before each test**, so every test starts on a fresh login screen — no manual setup/teardown needed in the specs themselves.

---

## Configuration (`mobilewright.config.ts`)

```typescript
export default defineConfig({
  platform: 'android',
  bundleId: 'com.arctouch.arctouch_demo_app',
  deviceName: /Pixel/,
  timeout: 10000,
  testIgnore: '**/_*.test.ts',
});
```

| Field | Purpose |
|---|---|
| `platform` | Selects the device launcher (`android` or `ios`). |
| `bundleId` | App package id used by the `device` fixture to terminate + relaunch. Note: the field is named after iOS terminology, but for Android it holds the package name. |
| `deviceName` | RegExp matched against device names returned by `mobilecli`. `/Pixel/` matches any Pixel emulator/device. |
| `timeout` | Per-test timeout in ms. Mobile fixtures can be slow on cold starts; `30_000` is a safer floor. |
| `testIgnore` | Glob of files to skip during default runs (here: anything starting with `_`). |

For the full option list, see the [mobilewright docs](https://www.npmjs.com/package/mobilewright).

---

## Writing a new test

The recommended flow:

1. **Inspect first.** Run `npx mobilewright test tests/_inspect.test.ts --reporter list` while the screen of interest is foregrounded. Capture the printed `<type> label="..." text="..."` lines and the screenshot saved to `test-results/inspect/`.
2. **Pick selectors** in this priority order: `getByLabel` (content-desc) → `getByText` (visible text) → `getByRole` → `getByType`. Avoid coordinate-based taps unless absolutely necessary.
3. **Add a Page Object** under `tests/pages/<screen>.page.ts` that exposes locators and composite actions. Keep it free of assertions.
4. **Write the test** under `tests/<feature>.test.ts`. Tests should describe behavior, not mechanics.

Minimal Page Object example:

```typescript
import type { Locator, Screen } from 'mobilewright';

export class HomePage {
  constructor(private readonly screen: Screen) {}

  greeting(): Locator { return this.screen.getByLabel('Welcome banner'); }
  logoutButton(): Locator { return this.screen.getByLabel('Log out'); }

  async logout(): Promise<void> { await this.logoutButton().tap(); }
}
```

Minimal test example:

```typescript
import { test, expect } from '@mobilewright/test';
import { HomePage } from './pages/home.page';

test('greeting is visible after login', async ({ screen }) => {
  const home = new HomePage(screen);
  await expect(home.greeting()).toBeVisible();
});
```

---

## Known issues and gotchas

- **Resource-id selectors don't match.** `mobilecli` does not currently expose Android `resource-id` values via the protocol, so `screen.getByTestId('login_email_input')` will not match anything on Android. Use `getByLabel` (content-desc) instead. This may change as `mobilecli` evolves.
- **`uiautomator dump` returns empty XML during transitions.** Surfaces as `RpcError: failed to get uiautomator dump`. Typically self-resolves within ~1–2 seconds; assertions that poll (`expect(...).toBeVisible()`, `locator.waitFor(...)`) ride this out, but a one-shot `getViewHierarchy()` call mid-transition can fail. If you see this, add a small settle pause after the triggering action.
- **`could not verify "<bundleId>" reached foreground` warning.** Known `mobilecli` warning on some Android devices; the framework "proceeds anyway" and tests usually still work.
- **Cold device fixture setup is slow.** First run can take 15–25 s before the first test executes (mobilecli + agent install + emulator handshake). Keep `timeout` ≥ `30_000` ms.

---

## Roadmap

- [ ] Bring the login suite to green (selector strategy fix in progress).
- [ ] Build out `home.page.ts` + a real "left login → home rendered" assertion in the happy path.
- [ ] Add show/hide password toggle, forgot-password navigation, sign-up navigation, and negative-credential tests.
- [ ] Wire `npm test` to `mobilewright test` and add an `npm run test:report` script.
- [ ] Add a CI workflow that boots an emulator and runs the suite.
- [ ] (Stretch) iOS project entry in `projects:` for cross-platform parity.

---

## License

ISC (see `package.json`).
