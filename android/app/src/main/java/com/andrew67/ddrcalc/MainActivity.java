/*
 * Copyright (c) 2025 Andrés Cordero
 * Web: https://github.com/Andrew67/ddr-calc
 * LICENSE: GPLv3
 *     https://github.com/Andrew67/ddr-calc/blob/master/LICENSE
 */

package com.andrew67.ddrcalc;

import android.content.res.Configuration;

import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        final var isLightMode = (newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK) !=
                Configuration.UI_MODE_NIGHT_YES;
        final var window = getWindow();
        final var windowInsetsController =
                new WindowInsetsControllerCompat(window, window.getDecorView());
        windowInsetsController.setAppearanceLightStatusBars(isLightMode);

        // Only applies when running on Android < 15 without edge-to-edge
        final var white = getResources().getColor(R.color.white, null);
        final var almostBlack = getResources().getColor(R.color.almostBlack, null);
        window.setStatusBarColor(isLightMode ? white : almostBlack);
    }

}
