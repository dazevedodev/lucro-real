package br.com.lucroreal.app;

import android.os.Bundle;
import br.com.lucroreal.app.bubble.FloatingBubblePlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingBubblePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
