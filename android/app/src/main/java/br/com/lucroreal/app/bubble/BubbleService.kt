package br.com.lucroreal.app.bubble

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import br.com.lucroreal.app.MainActivity
import br.com.lucroreal.app.R
import java.util.Locale
import kotlin.math.abs

/**
 * Serviço em foreground que desenha a bolha flutuante (estilo Chat Heads) e
 * o mini-formulário de registro de corrida sobre outros apps.
 */
class BubbleService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var sessionStore: SessionStore

    private var bubbleView: View? = null
    private var formView: View? = null
    private var speechRecognizer: SpeechRecognizer? = null
    private var activeMicTarget: EditText? = null

    private var bubbleParams: WindowManager.LayoutParams? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        sessionStore = SessionStore(this)
        // FOREGROUND_SERVICE_TYPE_SPECIAL_USE só existe a partir da API 34 —
        // em versões anteriores o overload de 2 argumentos (sem tipo) é o correto.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                buildNotification(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, buildNotification())
        }
        addBubble()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onDestroy() {
        isRunning = false
        removeForm()
        bubbleView?.let { runCatching { windowManager.removeView(it) } }
        bubbleView = null
        speechRecognizer?.destroy()
        speechRecognizer = null
        super.onDestroy()
    }

    // -------------------------------------------------------------------
    // Notificação (obrigatória para foreground service)
    // -------------------------------------------------------------------

    private fun buildNotification(): android.app.Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Lucro Real — bolha flutuante",
                NotificationManager.IMPORTANCE_MIN
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }

        val openAppIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Lucro Real")
            .setContentText("Bolha ativa para registrar corridas")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()
    }

    // -------------------------------------------------------------------
    // Bolha (view colapsada, arrastável)
    // -------------------------------------------------------------------

    private fun overlayType() =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

    private fun addBubble() {
        val view = LayoutInflater.from(this).inflate(R.layout.bubble_view, null)
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 300
        }

        var initialX = 0
        var initialY = 0
        var touchStartX = 0f
        var touchStartY = 0f
        var isDrag = false

        view.setOnTouchListener { v, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    touchStartX = event.rawX
                    touchStartY = event.rawY
                    isDrag = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = event.rawX - touchStartX
                    val dy = event.rawY - touchStartY
                    if (abs(dx) > 12 || abs(dy) > 12) isDrag = true
                    params.x = initialX + dx.toInt()
                    params.y = initialY + dy.toInt()
                    windowManager.updateViewLayout(view, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDrag) v.performClick()
                    true
                }
                else -> false
            }
        }

        view.setOnClickListener {
            if (formView == null) showForm() else removeForm()
        }

        windowManager.addView(view, params)
        bubbleView = view
        bubbleParams = params
    }

    // -------------------------------------------------------------------
    // Formulário expandido
    // -------------------------------------------------------------------

    private fun showForm() {
        if (formView != null) return

        val view = LayoutInflater.from(this).inflate(R.layout.bubble_form, null)
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            overlayType(),
            // 0 = sem FLAG_NOT_FOCUSABLE: precisa ser focável de verdade pros
            // EditText abrirem o teclado normalmente (a bolha colapsada usa
            // FLAG_NOT_FOCUSABLE pra não roubar foco do app por baixo; aqui não).
            0,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = bubbleParams?.x ?: 0
            y = (bubbleParams?.y ?: 300) + 70
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        }

        val etValor = view.findViewById<EditText>(R.id.et_valor)
        val etKm = view.findViewById<EditText>(R.id.et_km)
        val tvStatus = view.findViewById<TextView>(R.id.tv_status)
        val btnMicValor = view.findViewById<ImageButton>(R.id.btn_mic_valor)
        val btnMicKm = view.findViewById<ImageButton>(R.id.btn_mic_km)
        val btnFechar = view.findViewById<Button>(R.id.btn_fechar)
        val btnRegistrar = view.findViewById<Button>(R.id.btn_registrar)

        btnMicValor.setOnClickListener { startVoiceInput(etValor) }
        btnMicKm.setOnClickListener { startVoiceInput(etKm) }
        btnFechar.setOnClickListener { removeForm() }
        btnRegistrar.setOnClickListener {
            submitRide(etValor, etKm, tvStatus, btnRegistrar)
        }

        windowManager.addView(view, params)
        formView = view
        bubbleView?.visibility = View.GONE
    }

    private fun removeForm() {
        formView?.let { runCatching { windowManager.removeView(it) } }
        formView = null
        bubbleView?.visibility = View.VISIBLE
    }

    // -------------------------------------------------------------------
    // Envio da corrida
    // -------------------------------------------------------------------

    private fun submitRide(etValor: EditText, etKm: EditText, tvStatus: TextView, btnRegistrar: Button) {
        val valor = etValor.text.toString().replace(",", ".").toDoubleOrNull()
        val km = etKm.text.toString().replace(",", ".").toDoubleOrNull()

        if (valor == null || valor < 0 || km == null || km <= 0) {
            tvStatus.text = "Preencha valor e km corretamente."
            tvStatus.visibility = View.VISIBLE
            return
        }

        val session = sessionStore.load()
        if (session == null) {
            tvStatus.text = "Faça login no app pra registrar corridas."
            tvStatus.visibility = View.VISIBLE
            return
        }

        btnRegistrar.isEnabled = false
        tvStatus.visibility = View.GONE

        RideApiClient.postRide(session, valor, km) { result ->
            btnRegistrar.isEnabled = true
            when (result) {
                is RideApiClient.RideResult.Success -> {
                    Toast.makeText(
                        this,
                        "Corrida registrada — lucro R$ ${String.format(Locale("pt", "BR"), "%.2f", result.netProfit)}",
                        Toast.LENGTH_SHORT
                    ).show()
                    etValor.text.clear()
                    etKm.text.clear()
                    removeForm()
                }
                is RideApiClient.RideResult.SessionReplaced -> {
                    // token/sessão morreu — tenta renovar 1x antes de desistir
                    RideApiClient.refreshAccessToken(
                        session,
                        callback = { newAccessToken, newRefreshToken ->
                            sessionStore.updateAccessToken(newAccessToken, newRefreshToken)
                            tvStatus.text = "Tente registrar de novo."
                            tvStatus.visibility = View.VISIBLE
                        },
                        onFailure = {
                            tvStatus.text = result.message
                            tvStatus.visibility = View.VISIBLE
                        }
                    )
                }
                is RideApiClient.RideResult.Error -> {
                    tvStatus.text = result.message
                    tvStatus.visibility = View.VISIBLE
                }
            }
        }
    }

    // -------------------------------------------------------------------
    // Voz — reconhece fala em pt-BR e extrai o primeiro número encontrado.
    // Limitação conhecida: só entende números já transcritos como dígitos
    // pelo reconhecedor (ex.: "25"), não números por extenso (ex.: "vinte
    // e cinco"). Na prática o reconhecedor do Android normaliza a maioria
    // dos casos comuns pra dígito.
    // -------------------------------------------------------------------

    private fun startVoiceInput(target: EditText) {
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            Toast.makeText(this, "Conceda a permissão de microfone no app.", Toast.LENGTH_SHORT).show()
            return
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            Toast.makeText(this, "Reconhecimento de voz indisponível neste aparelho.", Toast.LENGTH_SHORT).show()
            return
        }

        activeMicTarget = target
        speechRecognizer?.destroy()
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onResults(results: android.os.Bundle) {
                    val matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    val text = matches?.firstOrNull() ?: ""
                    val number = extractNumber(text)
                    if (number != null) {
                        activeMicTarget?.setText(number)
                    } else {
                        Toast.makeText(this@BubbleService, "Não entendi um número em \"$text\".", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onError(error: Int) {
                    Toast.makeText(this@BubbleService, "Não consegui ouvir, tente de novo.", Toast.LENGTH_SHORT).show()
                }

                override fun onReadyForSpeech(params: android.os.Bundle?) {}
                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}
                override fun onPartialResults(partialResults: android.os.Bundle?) {}
                override fun onEvent(eventType: Int, params: android.os.Bundle?) {}
            })

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, "pt-BR")
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            }
            startListening(intent)
        }
    }

    private fun extractNumber(text: String): String? {
        val match = Regex("""\d+([.,]\d+)?""").find(text) ?: return null
        return match.value.replace(",", ".")
    }

    companion object {
        private const val CHANNEL_ID = "lucro_real_bubble"
        private const val NOTIFICATION_ID = 4821

        @Volatile
        var isRunning: Boolean = false
            private set

        fun start(context: Context) {
            val intent = Intent(context, BubbleService::class.java)
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, BubbleService::class.java))
        }
    }
}
