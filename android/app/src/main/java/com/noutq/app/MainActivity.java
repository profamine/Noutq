package com.noutq.app;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — gestion des permissions Android au runtime.
 *
 * Stratégie :
 *   • Au 1er lancement : demande uniquement RECORD_AUDIO (nécessaire immédiatement
 *     pour SpeechSetupScreen). La caméra est demandée contextuellement via
 *     requestCameraPermission() quand l'utilisateur accède au scanner QR.
 *   • Refus définitif : AlertDialog → Paramètres de l'application.
 */
public class MainActivity extends BridgeActivity {

    private static final int PERMISSIONS_REQUEST_CODE    = 1001;
    private static final int CAMERA_PERMISSION_CODE      = 1002;
    private static final String PREFS_NAME               = "NoutqPrefs";
    private static final String PREF_PERMISSIONS_REQUESTED = "permissionsRequested";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestInitialPermission();
    }

    // ── Permission initiale : uniquement RECORD_AUDIO au 1er lancement ─────────

    private void requestInitialPermission() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        boolean alreadyRequested = prefs.getBoolean(PREF_PERMISSIONS_REQUESTED, false);

        if (alreadyRequested) {
            // Lancement suivant : re-demander si l'utilisateur a révoqué le micro.
            recheckMicPermission();
            return;
        }

        // Premier lancement : demander le micro (nécessaire pour SpeechSetupScreen).
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{ Manifest.permission.RECORD_AUDIO },
                PERMISSIONS_REQUEST_CODE
            );
        }

        prefs.edit().putBoolean(PREF_PERMISSIONS_REQUESTED, true).apply();
    }

    private void recheckMicPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{ Manifest.permission.RECORD_AUDIO },
                PERMISSIONS_REQUEST_CODE
            );
        }
    }

    // ── Permission caméra contextuelle (appelée depuis le bridge Capacitor) ─────

    /**
     * Demande la permission CAMERA au moment où l'utilisateur souhaite
     * scanner un QR code pédagogique. N'est jamais demandée au démarrage.
     */
    public void requestCameraPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            // Déjà accordée — rien à faire.
            return;
        }
        ActivityCompat.requestPermissions(
            this,
            new String[]{ Manifest.permission.CAMERA },
            CAMERA_PERMISSION_CODE
        );
    }

    // ── Résultat des demandes de permissions ────────────────────────────────────

    @Override
    public void onRequestPermissionsResult(
        int requestCode,
        @NonNull String[] permissions,
        @NonNull int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode != PERMISSIONS_REQUEST_CODE
                && requestCode != CAMERA_PERMISSION_CODE) return;

        for (int i = 0; i < permissions.length; i++) {
            boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;

            if (!granted) {
                // Refus définitif : shouldShowRequestPermissionRationale() renvoie false
                // après un refus "Ne plus demander" (ou premier refus sur Android 11+).
                boolean canExplain = ActivityCompat.shouldShowRequestPermissionRationale(
                    this, permissions[i]
                );
                if (!canExplain) {
                    showSettingsDialog();
                }
            }
            // Capacitor propage automatiquement le résultat au WebView.
        }
    }

    // ── Dialog de redirection vers les Paramètres ───────────────────────────────

    private void showSettingsDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Permission requise")
            .setMessage(
                "Cette fonctionnalité nécessite une permission. " +
                "Activez-la dans les Paramètres de l'application."
            )
            .setPositiveButton("Ouvrir les Paramètres", (dialog, which) -> {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.fromParts("package", getPackageName(), null));
                startActivity(intent);
            })
            .setNegativeButton("Annuler", (dialog, which) -> dialog.dismiss())
            .show();
    }
}
