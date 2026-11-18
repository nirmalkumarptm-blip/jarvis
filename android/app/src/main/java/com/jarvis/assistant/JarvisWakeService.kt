package com.jarvis.assistant

import android.app.PendingIntent
import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.IBinder
import android.util.Log

class JarvisWakeService : Service() {

    companion object {
        private const val CHANNEL_ID = "jarvis_wake_channel"
        private const val NOTIFICATION_ID = 1001
        private const val TAG = "JARVIS_WAKE"
        private const val SAMPLE_RATE = 16000
    }

    @Volatile
    private var isRunning = false

    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int
    ): Int {

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            Log.e(TAG, "Microphone permission missing")
            stopSelf()
            return START_NOT_STICKY
        }

        try {
            val notification = createNotification()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }

            if (recordingThread == null) {
                recordingThread = Thread {
                    runWakeDetection()
                }.apply {
                    name = "JARVIS-Wake-Detection"
                    start()
                }
            }

        } catch (e: SecurityException) {
            Log.e(TAG, "Cannot start microphone service", e)
            stopSelf()
            return START_NOT_STICKY
        }

        return START_NOT_STICKY
    }

    private fun runWakeDetection() {
        var detector: SherpaApiCheck? = null
        var recorder: AudioRecord? = null

        try {
            Log.i(TAG, "Loading offline keyword model")

            detector = SherpaApiCheck()
            detector.initialize(assets)

            val minBuffer = AudioRecord.getMinBufferSize(
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            )

            if (minBuffer <= 0) {
                throw IllegalStateException(
                    "Invalid microphone buffer size: $minBuffer"
                )
            }

            recorder = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
                minBuffer * 2
            )

            if (recorder.state != AudioRecord.STATE_INITIALIZED) {
                throw IllegalStateException(
                    "Microphone initialization failed"
                )
            }

            audioRecord = recorder
            recorder.startRecording()
            isRunning = true

            Log.i(TAG, "Offline JARVIS detection started")

            val buffer = ShortArray(1600)

            while (isRunning) {
                val count = recorder.read(
                    buffer,
                    0,
                    buffer.size
                )

                if (count > 0) {
                    val samples = FloatArray(count) {
                        buffer[it] / 32768.0f
                    }

                    val keyword = detector.processAudio(samples)

                    if (keyword.isNotBlank()) {
                        Log.i(TAG, "Wake word detected: $keyword")
                        showWakeNotification()
                    }

                } else if (count < 0) {
                    Log.e(TAG, "Microphone read error: $count")
                    break
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Wake detection failed", e)
            e.printStackTrace()

        } finally {
            isRunning = false

            try {
                if (recorder?.recordingState ==
                    AudioRecord.RECORDSTATE_RECORDING
                ) {
                    recorder.stop()
                }
            } catch (_: Exception) {
            }

            recorder?.release()
            audioRecord = null

            detector?.release()

            recordingThread = null

            Log.i(TAG, "Wake detection stopped")
        }
    }

    private fun showWakeNotification() {
    val intent = Intent(this, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP
        action = "com.jarvis.assistant.WAKE_DETECTED"
    }

    val pendingIntent = PendingIntent.getActivity(
        this,
        1002,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or
                PendingIntent.FLAG_IMMUTABLE
    )

    val notification = Notification.Builder(this, CHANNEL_ID)
        .setContentTitle("JARVIS detected you")
        .setContentText("Tap to open JARVIS")
        .setSmallIcon(android.R.drawable.ic_btn_speak_now)
        .setContentIntent(pendingIntent)
        .setAutoCancel(true)
        .build()

    val manager = getSystemService(
        NotificationManager::class.java
    )

    manager.notify(1002, notification)
}

    override fun onDestroy() {
        isRunning = false

        try {
            audioRecord?.stop()
        } catch (_: Exception) {
        }

        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "JARVIS Wake Word",
                NotificationManager.IMPORTANCE_LOW
            )

            channel.description =
                "JARVIS offline wake word detection"

            val manager = getSystemService(
                NotificationManager::class.java
            )

            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("JARVIS is active")
                .setContentText("Offline wake word detection")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("JARVIS is active")
                .setContentText("Offline wake word detection")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setOngoing(true)
                .build()
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
