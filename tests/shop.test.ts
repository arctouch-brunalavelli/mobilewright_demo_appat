import { test, expect } from '@mobilewright/test';
import { LoginPage } from './pages/login.page';
import { ShopPage } from './pages/shop.page';

test.describe('Shop screen', () => {
    test.beforeEach(async ({ screen }) => {
        await new LoginPage(screen).signIn();

        // Brief settle to let the post-login transition stabilise and avoid
        // the transient mobilecli "no XML content found in uiautomator dump"
        // error while the activity is still animating. Matches the existing
        // pattern in login.test.ts.
        await new Promise((r) => setTimeout(r, 2000));
    });

    test('renders the expected elements on initial load', async ({ screen }) => {
        const shop = new ShopPage(screen);

        await expect(shop.logo()).toBeVisible();
        await expect(shop.searchInput()).toBeVisible();
        await expect(shop.layoutToggle()).toBeVisible();
        await expect(shop.selectedCategoryFilter('All')).toBeVisible();
        await expect(shop.resultCount()).toBeVisible();
        await expect(shop.productCard('Laptop Pro 16"')).toBeVisible();
        await expect(shop.productCard('Wireless Headphones')).toBeVisible();
        await expect(shop.tab('Shop')).toBeVisible();
        await expect(shop.tab('Cart')).toBeVisible();
        await expect(shop.tab('Profile')).toBeVisible();
        await expect(shop.tab('Settings')).toBeVisible();
    });

    test('shows the initial result count of "Showing 10 of 30 products"', async ({ screen }) => {
        await expect(
            screen.getByLabel('Showing 10 of 30 products', { exact: false }),
        ).toBeVisible();
    });

    test('searches by product name and filters the visible list', async ({ screen }) => {
        const shop = new ShopPage(screen);

        await shop.searchProducts('Laptop');

        await expect(shop.productCard('Laptop Pro 16"')).toBeVisible();
        await expect(shop.productCard('Wireless Headphones')).not.toBeVisible();
    });

    test('clearing the search restores the full list', async ({ screen }) => {
        const shop = new ShopPage(screen);

        await shop.searchProducts('Laptop');
        await expect(shop.productCard('Wireless Headphones')).not.toBeVisible();

        await shop.clearSearch();

        await expect(shop.productCard('Wireless Headphones')).toBeVisible();
    });

    test('selecting a category marks it as selected and unselects "All"', async ({ screen }) => {
        const shop = new ShopPage(screen);

        await expect(shop.selectedCategoryFilter('All')).toBeVisible();

        await shop.selectCategory('Electronics');

        await expect(shop.selectedCategoryFilter('Electronics')).toBeVisible();
        await expect(shop.selectedCategoryFilter('All')).not.toBeVisible();
    });

    test('selecting "All" restores the default category filter', async ({ screen }) => {
        const shop = new ShopPage(screen);

        await shop.selectCategory('Electronics');
        await expect(shop.selectedCategoryFilter('Electronics')).toBeVisible();

        await shop.selectCategory('All');

        await expect(shop.selectedCategoryFilter('All')).toBeVisible();
        await expect(shop.selectedCategoryFilter('Electronics')).not.toBeVisible();
    });

    test('bottom tab navigation leaves Shop and returns to it', async ({ screen }) => {
        const shop = new ShopPage(screen);

        for (const tabName of ['Cart', 'Profile', 'Settings'] as const) {
            await shop.switchTab(tabName);
            await expect(shop.searchInput()).not.toBeVisible();

            await shop.switchTab('Shop');
            await expect(shop.searchInput()).toBeVisible();
        }
    });

    test('tapping a product card opens the detail screen', async ({ screen }) => {
        const shop = new ShopPage(screen);

        await shop.openProductDetail('Laptop Pro 16"');

        // Anchor by the absence of a Shop-only element. Once we capture the
        // detail screen's accessibility tree, swap this for a positive
        // assertion (e.g. a "Back" or product-title element).
        await expect(shop.searchInput()).not.toBeVisible();
    });
});
