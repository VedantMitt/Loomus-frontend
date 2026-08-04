package com.campusconnect.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.WebSettings;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Request native Android location permissions on launch
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                },
                LOCATION_PERMISSION_REQUEST_CODE
            );
        }

        // 2. Enable WebView Geolocation and configure BridgeWebChromeClient to auto-allow WebView location prompts
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings webSettings = this.bridge.getWebView().getSettings();
            webSettings.setGeolocationEnabled(true);
            webSettings.setGeolocationDatabasePath(this.getFilesDir().getPath());
            webSettings.setDatabaseEnabled(true);
            webSettings.setDomStorageEnabled(true);

            this.bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(this.bridge) {
                @Override
                public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                    callback.invoke(origin, true, false);
                }
            });
        }
    }
}
