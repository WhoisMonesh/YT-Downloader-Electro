package com.universalmediamobile

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest

class YtDlpModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        Thread(Runnable {
            try {
                YoutubeDL.getInstance().init(reactContext)
                
                // Initialize FFmpeg only if the library class is present
                try {
                    // The junkfood02 fork changed the package name from ffmpeg_android to ffmpeg
                    val ffmpegClass = Class.forName("com.yausername.ffmpeg.FFmpeg")
                    val getInstance = ffmpegClass.getMethod("getInstance")
                    val ffmpegInstance = getInstance.invoke(null)
                    val initMethod = ffmpegClass.getMethod("init", android.content.Context::class.java)
                    initMethod.invoke(ffmpegInstance, reactContext)
                } catch (cnfe: ClassNotFoundException) {
                    // FFmpeg library not present — skip initialization
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }).start()
    }

    override fun getName(): String {
        return "YtDlp"
    }

    @ReactMethod
    fun analyzeUrl(url: String, promise: Promise) {
        Thread(Runnable {
            try {
                val request = YoutubeDLRequest(url)
                request.addOption("-J")
                request.addOption("--no-warnings")
                val response = YoutubeDL.getInstance().execute(request)
                promise.resolve(response.out)
            } catch (e: Exception) {
                promise.reject("YtDlpError", e.message)
            }
        }).start()
    }

    @ReactMethod
    fun startDownload(url: String, outputPath: String, formatExt: String, quality: String, promise: Promise) {
        Thread(Runnable {
            try {
                val request = YoutubeDLRequest(url)
                request.addOption("-o", outputPath)
                
                if (quality == "best" || quality == "bestvideo+bestaudio") {
                    request.addOption("-f", "bestvideo[ext=$formatExt]+bestaudio[ext=m4a]/best[ext=$formatExt]/best")
                    request.addOption("--merge-output-format", formatExt)
                } else if (quality == "audio") {
                    request.addOption("-x")
                    request.addOption("--audio-format", formatExt)
                } else {
                    request.addOption("-f", "$quality[ext=$formatExt]")
                }
                
                val response = YoutubeDL.getInstance().execute(request)
                promise.resolve(response.out)
            } catch (e: Exception) {
                promise.reject("YtDlpError", e.message)
            }
        }).start()
    }
}
