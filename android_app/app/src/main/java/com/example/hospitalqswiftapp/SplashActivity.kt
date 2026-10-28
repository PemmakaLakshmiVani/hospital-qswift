package com.example.hospitalqswiftapp

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.example.hospitalqswiftapp.databinding.ActivitySplashBinding

class SplashActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySplashBinding
    private val handler = Handler(Looper.getMainLooper())
    private var isLaunched = false

    private val launchRunnable = Runnable {
        launchMainApp()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Automatically launch MainActivity after 2 seconds
        handler.postDelayed(launchRunnable, 2000)

        // Allow immediate tap to enter app
        binding.btnEnterApp.setOnClickListener {
            launchMainApp()
        }
    }

    private fun launchMainApp() {
        if (isLaunched) return
        isLaunched = true
        handler.removeCallbacks(launchRunnable)
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("OPEN_SIGN_IN", false)
        }
        startActivity(intent)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(launchRunnable)
    }
}
