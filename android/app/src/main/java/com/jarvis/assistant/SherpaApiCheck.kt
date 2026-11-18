package com.jarvis.assistant

import android.content.res.AssetManager
import com.k2fsa.sherpa.onnx.FeatureConfig
import com.k2fsa.sherpa.onnx.KeywordSpotter
import com.k2fsa.sherpa.onnx.KeywordSpotterConfig
import com.k2fsa.sherpa.onnx.OnlineModelConfig
import com.k2fsa.sherpa.onnx.OnlineStream
import com.k2fsa.sherpa.onnx.OnlineTransducerModelConfig

internal class SherpaApiCheck {

    private var spotter: KeywordSpotter? = null
    private var stream: OnlineStream? = null

    private val config = KeywordSpotterConfig(
        featConfig = FeatureConfig(
            sampleRate = 16000,
            featureDim = 80
        ),
        modelConfig = OnlineModelConfig(
            transducer = OnlineTransducerModelConfig(
                encoder = "jarvis-kws/encoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx",
                decoder = "jarvis-kws/decoder-epoch-12-avg-2-chunk-16-left-64.int8.onnx",
                joiner = "jarvis-kws/joiner-epoch-12-avg-2-chunk-16-left-64.int8.onnx"
            ),
            tokens = "jarvis-kws/tokens.txt",
            numThreads = 2,
            provider = "cpu",
            modelType = "zipformer2"
        ),
        keywordsFile = "jarvis-kws/keywords.txt"
    )

    fun initialize(assetManager: AssetManager) {
        spotter = KeywordSpotter(
            assetManager = assetManager,
            config = config
        )
        stream = spotter?.createStream()
    }

    fun processAudio(samples: FloatArray): String {
        val kws = spotter ?: return ""
        val audioStream = stream ?: return ""

        audioStream.acceptWaveform(samples, sampleRate = 16000)

        var detectedKeyword = ""

        while (kws.isReady(audioStream)) {
            kws.decode(audioStream)

            val result = kws.getResult(audioStream).keyword

            if (result.isNotBlank()) {
                detectedKeyword = result
                kws.reset(audioStream)
                break
            }
        }

        return detectedKeyword
    }

    fun release() {
        stream?.release()
        stream = null

        spotter?.release()
        spotter = null
    }
}
