/*! DDR Calc | https://github.com/Andrew67/ddr-calc */
/* Contains Capacitor-related functionality that doesn't fit elsewhere */
"use strict";

// Note: this module should load last
(async function initCapacitorModule() {
  const App = window.Capacitor.Plugins.App;
  // Handle the Android back button.
  // Capacitor's default handler correctly uses `history.back()`, which
  // works well with this app. However, it leaves users stuck by not minimizing
  // the app when the stack is empty. This code restores that.
  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) history.back();
    else App.minimizeApp();
  });

  // Handle deep link launches.
  // Because the app deep links use `?`, the web app could assume the page is
  // being freshly loaded, and only inspect the parameters once.
  // However, Capacitor apps can re-foreground and receive this lighter event.
  // To avoid major refactors at this time, we re-implement some of the launch
  // logic here.
  App.addListener("appUrlOpen", ({ url }) => {
    if (!url.includes("?")) return;
    const urlParams = new URLSearchParams(url.substring(url.indexOf("?")));

    if (urlParams.get("mode") === "target-bpm") state.mode = MODE.TARGETBPM;
    else if (urlParams.get("mode") === "speed-mod") state.mode = MODE.SPEEDMOD;

    if (urlParams.has("df")) {
      state.ddrFinderThemeEnabled = true;
      localStorage[setAllowingLoss](KEY_DDRFINDER_THEME_UNLOCKED, "true");
    }

    commit();
  });

  loadNextModule();
})();
