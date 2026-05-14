import type { Locator, Screen } from 'mobilewright';

/**
 * Page Object for the ArcTouch demo app Shop tab (post-login landing).
 *
 * Ground truth was captured manually via `adb shell uiautomator dump`
 * while the Shop tab was foregrounded; the XML and screenshot live under
 * `test-results/inspect-shop/`. Key facts:
 *
 *   - All interactive elements expose `content-desc`; mobilecli surfaces
 *     it as `node.label`. We rely on `getByLabel` substring matching,
 *     same as `login.page.ts`.
 *
 *   - Category filters use a `"Category filter: <Name>"` content-desc,
 *     with `", selected"` appended on the currently-selected one. Selection
 *     state is read by matching the `", selected"` suffix.
 *
 *   - Bottom tabs use a `"<Name>\nTab N of 4"` content-desc. The `"\nTab"`
 *     fragment is shared across all four tab labels and disambiguates
 *     `getByLabel('Shop', …)` from any other element whose label happens
 *     to contain "Shop", and `getByLabel('Home', …)` from the `"Home"`
 *     category filter (the app has no "Home" tab — only Shop/Cart/Profile/
 *     Settings).
 *
 *   - The result-count text has a duplicated `content-desc`
 *     (`"Showing 10 of 30 products\nShowing 10 of 30 products"`) — the
 *     same Compose-semantics-merging quirk seen on the login hint banner.
 *     Substring matching handles it.
 *
 *   - The search field has no `content-desc`; mobilecli surfaces its
 *     Android `hint` (`"Search products input field\nSearch products..."`)
 *     as `node.label`, so `getByLabel('Search products input field')`
 *     resolves to the EditText — same trick as the login email/password
 *     inputs.
 *
 *   - The instructional hint banner on Shop has the same broken-dismiss
 *     pattern as on login (the inner "×" Button has an empty content-desc
 *     and is dropped by the flat mobilecli tree). Out of scope for these
 *     specs; the banner sits above all the elements we assert on, so it
 *     doesn't interfere.
 */
export class ShopPage {
    static readonly TABS = ['Shop', 'Cart', 'Profile', 'Settings'] as const;
    static readonly CATEGORIES = ['All', 'Electronics', 'Clothing', 'Home', 'Books'] as const;

    constructor(private readonly screen: Screen) {}

    logo(): Locator           { return this.screen.getByLabel('ArcTouch logo').first(); }
    searchInput(): Locator    { return this.screen.getByLabel('Search products input field', { exact: false }); }
    layoutToggle(): Locator   { return this.screen.getByLabel('Switch to list view'); }
    resultCount(): Locator    { return this.screen.getByLabel('Showing ', { exact: false }); }

    categoryFilter(name: string): Locator {
        return this.screen.getByLabel(`Category filter: ${name}`, { exact: false });
    }

    /** Same node as `categoryFilter` when the filter is currently selected; not visible otherwise. */
    selectedCategoryFilter(name: string): Locator {
        return this.screen.getByLabel(`Category filter: ${name}, selected`, { exact: false });
    }

    productCard(name: string): Locator {
        return this.screen.getByLabel(`Product card: ${name}`);
    }

    tab(name: string): Locator {
        return this.screen.getByLabel(`${name}\nTab`, { exact: false });
    }

    async searchProducts(query: string): Promise<void> {
        await this.searchInput().fill(query);
    }

    /**
     * Best-effort clear. mobilewright's `Locator.fill('')` is tap + `typeText('')`,
     * which only refocuses the field — it does NOT erase existing text. The
     * `HardwareButton` enum also has no DEL/CLEAR keycode. If this test fails
     * because the field still holds the previous query, that's the cause; a
     * proper fix needs either a `Locator.clear()` primitive in mobilewright or
     * a per-app clear-icon selector once the app exposes one.
     */
    async clearSearch(): Promise<void> {
        await this.searchInput().fill('');
    }

    async selectCategory(name: string): Promise<void> {
        await this.categoryFilter(name).tap();
    }

    async openProductDetail(name: string): Promise<void> {
        await this.productCard(name).tap();
    }

    async switchTab(name: string): Promise<void> {
        await this.tab(name).tap();
    }
}
