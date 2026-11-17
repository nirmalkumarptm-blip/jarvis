package com.jarvis.assistant

import com.k2fsa.sherpa.onnx.KeywordSpotter
import com.k2fsa.sherpa.onnx.KeywordSpotterConfig
import com.k2fsa.sherpa.onnx.OnlineStream

internal class SherpaApiCheck {
    private var spotter: KeywordSpotter? = null
    private var stream: OnlineStream? = null
    private var config: KeywordSpotterConfig? = null
}
