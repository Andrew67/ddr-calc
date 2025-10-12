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
        var windowInsetsController =
                new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        windowInsetsController.setAppearanceLightStatusBars(
                (newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK) !=
                        Configuration.UI_MODE_NIGHT_YES
        );
    }

}
