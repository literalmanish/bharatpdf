package com.desipdf.app;

import android.Manifest;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Request runtime storage & camera permissions on app launch
        requestAppPermissions();

        // 2. Register Javascript Interface for offline file saving and sharing
        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                webView.addJavascriptInterface(new AndroidBridge(this), "AndroidBridge");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void requestAppPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();

        // Camera permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.CAMERA);
        }

        // Storage permissions based on Android version
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // Android 13+
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_MEDIA_IMAGES);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_MEDIA_VIDEO);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_MEDIA_AUDIO);
            }
        } else { // Android 12 and below
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }
        }

        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsNeeded.toArray(new String[0]), PERMISSION_REQUEST_CODE);
        }
    }

    public class AndroidBridge {
        private final Context context;

        public AndroidBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> Toast.makeText(context, message, Toast.LENGTH_SHORT).show());
        }

        @JavascriptInterface
        public void requestStoragePermissions() {
            runOnUiThread(() -> requestAppPermissions());
        }

        @JavascriptInterface
        public boolean hasStoragePermissions() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                return ContextCompat.checkSelfPermission(context, Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED;
            } else {
                return ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
            }
        }

        @JavascriptInterface
        public void saveAndShareFile(String base64Data, String filename, String mimeType) {
            try {
                if (base64Data == null || base64Data.isEmpty()) {
                    showToast("No data to save");
                    return;
                }

                // Clean base64 string if it contains data URI prefix
                if (base64Data.contains(",")) {
                    base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
                }
                byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
                String mime = (mimeType != null && !mimeType.isEmpty()) ? mimeType : "application/pdf";

                // 1. Save to app cache directory for FileProvider sharing
                File cacheDir = new File(context.getCacheDir(), "documents");
                if (!cacheDir.exists()) cacheDir.mkdirs();
                File sharedFile = new File(cacheDir, filename);
                FileOutputStream fos = new FileOutputStream(sharedFile);
                fos.write(decodedBytes);
                fos.flush();
                fos.close();

                // 2. Save directly to public Downloads / MediaStore so user can find it in their phone files
                saveToPublicStorage(filename, mime, decodedBytes);

                // 3. Launch native Android Share / Open Sheet
                Uri fileUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    sharedFile
                );

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType(mime);
                shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(shareIntent, "Open or Save: " + filename);
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(chooser);

                runOnUiThread(() -> Toast.makeText(context, "Saved to Downloads: " + filename, Toast.LENGTH_LONG).show());

            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() -> Toast.makeText(context, "Export error: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        }

        private void saveToPublicStorage(String filename, String mimeType, byte[] data) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    // Android 10+ MediaStore Downloads
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/DesiPDF");

                    Uri uri = context.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri != null) {
                        OutputStream os = context.getContentResolver().openOutputStream(uri);
                        if (os != null) {
                            os.write(data);
                            os.flush();
                            os.close();
                        }
                    }
                } else {
                    // Android 9 and below
                    File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    File desiDir = new File(downloadsDir, "DesiPDF");
                    if (!desiDir.exists()) desiDir.mkdirs();
                    File dest = new File(desiDir, filename);
                    FileOutputStream fos = new FileOutputStream(dest);
                    fos.write(data);
                    fos.flush();
                    fos.close();
                }
            } catch (Exception e) {
                // Also write to external files dir as fallback
                try {
                    File extDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (extDir != null) {
                        File fallbackFile = new File(extDir, filename);
                        FileOutputStream fos = new FileOutputStream(fallbackFile);
                        fos.write(data);
                        fos.flush();
                        fos.close();
                    }
                } catch (Exception ignored) {}
            }
        }
    }
}
