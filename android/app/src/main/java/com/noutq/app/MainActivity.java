package com.noutq.app;

import android.Manifest;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSIONS_REQUEST_CODE = 1001;
    private static final String PREFS_NAME = "NoutqPrefs";
    private static final String PREF_PERMISSIONS_REQUESTED = "permissionsRequested";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestAllPermissionsOnFirstLaunch();
    }

    private void requestAllPermissionsOnFirstLaunch() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        boolean alreadyRequested = prefs.getBoolean(PREF_PERMISSIONS_REQUESTED, false);

        if (alreadyRequested) {
            // Vérifier si des permissions ont été révoquées et les redemander
            checkAndRequestMissingPermissions();
            return;
        }

        // Premier lancement : demander toutes les permissions d'un coup
        List<String> permissionsToRequest = buildPermissionList();

        if (!permissionsToRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toArray(new String[0]),
                PERMISSIONS_REQUEST_CODE
            );
        }

        // Marquer comme déjà demandé
        prefs.edit().putBoolean(PREF_PERMISSIONS_REQUESTED, true).apply();
    }

    private void checkAndRequestMissingPermissions() {
        List<String> missing = new ArrayList<>();
        for (String perm : buildPermissionList()) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                missing.add(perm);
            }
        }
        if (!missing.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                missing.toArray(new String[0]),
                PERMISSIONS_REQUEST_CODE
            );
        }
    }

    @NonNull
    private List<String> buildPermissionList() {
        List<String> perms = new ArrayList<>();

        // Microphone — prononciation et reconnaissance vocale
        perms.add(Manifest.permission.RECORD_AUDIO);

        // Caméra — lecture de QR codes pédagogiques
        perms.add(Manifest.permission.CAMERA);

        // Localisation approximative — contenu adapté à la région
        perms.add(Manifest.permission.ACCESS_COARSE_LOCATION);

        // Stockage — selon la version Android
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+
            perms.add(Manifest.permission.READ_MEDIA_IMAGES);
            perms.add(Manifest.permission.READ_MEDIA_AUDIO);
            perms.add(Manifest.permission.POST_NOTIFICATIONS);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Android 10-12
            perms.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        } else {
            // Android 9 et inférieur
            perms.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            perms.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
        }

        // Filtrer les permissions déjà accordées
        List<String> needed = new ArrayList<>();
        for (String p : perms) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                needed.add(p);
            }
        }
        return needed;
    }

    @Override
    public void onRequestPermissionsResult(
        int requestCode,
        @NonNull String[] permissions,
        @NonNull int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode != PERMISSIONS_REQUEST_CODE) return;

        // Notifier le bridge Capacitor des résultats de permissions
        for (int i = 0; i < permissions.length; i++) {
            boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
            // Capacitor gère automatiquement la propagation vers le WebView
        }
    }
}
