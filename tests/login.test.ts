import { test, expect } from '@mobilewright/test';
import { LoginPage } from './pages/login.page';

test.describe('Login screen', () => {
  test('renders the expected elements on initial load', async ({ screen }) => {
    const login = new LoginPage(screen);

    await expect(login.logo()).toBeVisible();
    await expect(login.welcomeHeading()).toBeVisible();
    await expect(login.subtitle()).toBeVisible();
    await expect(login.emailInput()).toBeVisible();
    await expect(login.passwordInput()).toBeVisible();
    await expect(login.signInButton()).toBeVisible();
    await expect(login.forgotPasswordLink()).toBeVisible();
    await expect(login.signUpLink()).toBeVisible();
  });

  test('signs in with the default account and leaves the login screen', async ({ screen }) => {
    const login = new LoginPage(screen);

    await login.dismissHintIfVisible();
    await login.signIn();

    // Brief settle to let the post-tap transition stabilise and avoid the
    // transient mobilecli "no XML content found in uiautomator dump" error
    // while the activity is animating.
    await new Promise((r) => setTimeout(r, 1500));

    await expect(login.signInButton()).not.toBeVisible({ timeout: 15_000 });
  });

  test('dismisses the instructional banner', async ({ screen }) => {
    const login = new LoginPage(screen);

    await expect(login.hintBanner()).toBeVisible();
    // The legacy APK exposes no separate X icon; the banner's content-desc
    // documents `Long press to dismiss all hints`, which is the only working
    // gesture (`tap()` is a no-op here).
    await login.hintBanner().longPress();
    await expect(login.hintBanner()).not.toBeVisible();
  });

  // TODO (future iterations):
  //   - show/hide password toggle: verify content-desc swap "Show password" ↔ "Hide password"
  //   - forgot password navigation: needs the target screen's identifying element
  //   - sign-up navigation: needs the target screen's identifying element
  //   - invalid credentials: needs the app's error UI (text/resource-id)
});
