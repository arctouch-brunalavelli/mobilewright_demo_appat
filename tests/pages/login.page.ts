import type { Locator, Screen } from 'mobilewright';

/**
 * Page Object for the ArcTouch demo app login screen.
 *
 * Selector strategy (in priority order):
 *   1. getByTestId — Android resource-id (most stable across copy/UI changes)
 *   2. getByLabel  — content-desc fallback (used for elements without a resource-id
 *                    or where the visible text is the most meaningful identifier)
 *   3. getByText   — visible text (only for static headings/titles)
 */
export class LoginPage {
  /** Default credentials shown in the in-app instructional banner. */
  static readonly DEFAULT_EMAIL = 'testing@arctouch.com';
  static readonly DEFAULT_PASSWORD = 'QA1234';

  constructor(private readonly screen: Screen) {}

  logo(): Locator               { return this.screen.getByTestId('login_logo'); }
  welcomeHeading(): Locator     { return this.screen.getByText('Welcome'); }
  subtitle(): Locator           { return this.screen.getByText('Sign in to continue'); }

  hintBanner(): Locator         { return this.screen.getByTestId('instructional_banner'); }
  dismissHintButton(): Locator  { return this.screen.getByTestId('instructional_banner_dismiss_button'); }

  emailInput(): Locator         { return this.screen.getByTestId('login_email_input'); }
  passwordInput(): Locator      { return this.screen.getByTestId('login_password_input'); }
  passwordToggle(): Locator     { return this.screen.getByTestId('login_toggle_password_visibility'); }

  signInButton(): Locator       { return this.screen.getByTestId('login_sign_in_button'); }
  forgotPasswordLink(): Locator { return this.screen.getByTestId('login_forgot_password_link'); }
  signUpLink(): Locator         { return this.screen.getByTestId('login_create_account_link'); }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
  }

  async signIn(
    email: string = LoginPage.DEFAULT_EMAIL,
    password: string = LoginPage.DEFAULT_PASSWORD,
  ): Promise<void> {
    await this.fillCredentials(email, password);
    await this.signInButton().tap();
  }

  async dismissHintIfVisible(): Promise<void> {
    if (await this.hintBanner().isVisible()) {
      await this.dismissHintButton().tap();
    }
  }
}
