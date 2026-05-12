import type { Locator, Screen } from 'mobilewright';

/**
 * Page Object for the ArcTouch demo app login screen (legacy APK).
 *
 * Ground truth was captured via `tests/_inspect.test.ts` (see
 * `test-results/inspect/tree.txt`). Key facts:
 *
 *   - mobilecli reports Android types as fully-qualified class names
 *     (e.g. `android.widget.EditText`, not `EditText`). This means
 *     `getByType('EditText')` and `getByRole('textfield')` do NOT match on
 *     this driver. Always prefer `getByLabel`.
 *
 *   - The two EditText inputs DO expose content-desc as a multi-line label:
 *       Email:    "Email input field\nEmail"
 *       Password: "Password input field\nPassword"
 *     We match the content-desc prefix with substring (`{ exact: false }`).
 *
 *   - The instructional banner has no separate dismiss element in the tree.
 *     Its own content-desc documents the dismissal gesture:
 *     "Long press to dismiss all hints." We use `longPress()` accordingly.
 *
 *   - The ArcTouch logo appears twice (ImageView + outer View wrapper).
 *     We pin it with `.first()` to keep the locator deterministic.
 *
 * Selector priority: getByLabel (exact when unique, substring otherwise) →
 * getByText (for static headings) → ordinal indexing as a last resort.
 */
export class LoginPage {
  /** Default credentials shown in the in-app instructional banner. */
  static readonly DEFAULT_EMAIL = 'testing@arctouch.com';
  static readonly DEFAULT_PASSWORD = 'QA1234';

  constructor(private readonly screen: Screen) {}

  logo(): Locator               { return this.screen.getByLabel('ArcTouch logo').first(); }
  welcomeHeading(): Locator     { return this.screen.getByLabel('Welcome'); }
  subtitle(): Locator           { return this.screen.getByLabel('Sign in to continue'); }

  hintBanner(): Locator         { return this.screen.getByLabel('Instructional hint:', { exact: false }); }

  emailInput(): Locator         { return this.screen.getByLabel('Email input field', { exact: false }); }
  passwordInput(): Locator      { return this.screen.getByLabel('Password input field', { exact: false }); }
  passwordToggle(): Locator     { return this.screen.getByLabel('Show password'); }

  signInButton(): Locator       { return this.screen.getByLabel('Sign in button'); }
  forgotPasswordLink(): Locator { return this.screen.getByLabel('Forgot password link'); }
  signUpLink(): Locator         { return this.screen.getByLabel('Create account link'); }

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

  /**
   * The legacy APK does not expose the dismiss icon as a separate node.
   * The banner's own content-desc documents `Long press to dismiss all hints`,
   * so we long-press the banner itself.
   */
  async dismissHintIfVisible(): Promise<void> {
    if (await this.hintBanner().isVisible()) {
      await this.hintBanner().longPress();
    }
  }
}
