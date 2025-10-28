package com.myhealthplus.app;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.content.res.Configuration;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Let Android handle the system bars spacing automatically
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, true);
        
        // Set status bar style based on current theme
        updateStatusBarStyle();
    }
    
    private void updateStatusBarStyle() {
        // Check if system is in dark mode
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean isDarkMode = nightModeFlags == Configuration.UI_MODE_NIGHT_YES;
        
        View decorView = getWindow().getDecorView();
        if (isDarkMode) {
            // Dark mode: use light icons (white) on dark background
            decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        } else {
            // Light mode: use dark icons on light background
            decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
            );
        }
    }
}
