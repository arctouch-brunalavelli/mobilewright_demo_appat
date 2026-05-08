import { defineConfig } from 'mobilewright';

export default defineConfig({
    platform: 'android',

    bundleId: 'com.arctouch.arctouch_demo_app',
    deviceName: /Pixel/,

    timeout: 10000,
});