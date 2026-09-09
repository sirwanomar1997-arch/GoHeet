import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native packaging config for the iOS / Android builds of GoHeet.
 * The web app is unaffected by this file.
 *
 * Local workflow (needs Xcode / Android Studio on your own machine):
 *   npm run build
 *   npx cap add ios && npx cap add android
 *   npx cap sync
 *   npx cap open ios      # or: npx cap open android
 */
const config: CapacitorConfig = {
  appId: "app.goheet.mobile",
  appName: "GoHeet",
  webDir: ".output/public",
  // Native shells load the hosted GoHeet build so server functions keep working.
  server: {
    url: "https://goheet.lovable.app",
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
  },
  ios: {
    contentInset: "never",
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#000000",
  },
  android: {
    backgroundColor: "#000000",
allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 900,
      backgroundColor: "#000000",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
