package com.desipdf.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                // Register Javascript Interface for offline file saving and sharing
                // Do not override setWebChromeClient to preserve Capacitor's native file picker
                webView.addJavascriptInterface(new AndroidBridge(this), "AndroidBridge");
            }
        } catch (Exception e) {
            e.printStackTrace();
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
        public void saveAndShareFile(String base64Data, String filename, String mimeType) {
            try {
                // Clean base64 string if it contains data URI prefix
                if (base64Data.contains(",")) {
                    base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
                }
                byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);

                // 1. Save to app cache directory for FileProvider sharing
                File cacheDir = new File(context.getCacheDir(), "documents");
                if (!cacheDir.exists()) cacheDir.mkdirs();
                File sharedFile = new File(cacheDir, filename);
                FileOutputStream fos = new FileOutputStream(sharedFile);
                fos.write(decodedBytes);
                fos.flush();
                fos.close();

                // 2. Also save to public Downloads directory if accessible
                try {
                    File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (downloadsDir != null && downloadsDir.exists()) {
                        File publicFile = new File(downloadsDir, filename);
                        FileOutputStream pubFos = new FileOutputStream(publicFile);
                        pubFos.write(decodedBytes);
                        pubFos.flush();
                        pubFos.close();
                    }
                } catch (Exception ignored) {}

                // 3. Launch native Android Share / Open Sheet
                Uri fileUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    sharedFile
                );

                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType(mimeType != null && !mimeType.isEmpty() ? mimeType : "application/pdf");
                shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                Intent chooser = Intent.createChooser(shareIntent, "Open or Save: " + filename);
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(chooser);

                runOnUiThread(() -> Toast.makeText(context, "Saved: " + filename, Toast.LENGTH_LONG).show());

            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() -> Toast.makeText(context, "Export error: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        }
    }
}
