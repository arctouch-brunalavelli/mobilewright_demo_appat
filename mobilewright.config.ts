import { defineConfig } from 'mobilewright';

export default defineConfig({
    platform: 'android',

    bundleId: 'com.arctouch.arctouch_demo_app',
    deviceName: /Pixel/,

    timeout: 60_000,

    // Temporarily disabled so `_inspect.test.ts` can run.
    // Re-enable once we've finished collecting selector data.
    // testIgnore: '**/_*.test.ts',
});