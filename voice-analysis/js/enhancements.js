/**
 * Demo Mode for SYN10 Voice Analysis
 * Provides simulated voice analysis results for testing and demonstration
 */

class DemoMode {
    constructor() {
        this.isEnabled = false;
        this.demoResults = [
            {
                speechRate: 145,
                pauseFrequency: 3,
                pitchVariance: 8.2,
                voiceEnergy: 75,
                overallScore: 82
            },
            {
                speechRate: 132,
                pauseFrequency: 5,
                pitchVariance: 12.1,
                voiceEnergy: 68,
                overallScore: 74
            },
            {
                speechRate: 158,
                pauseFrequency: 2,
                pitchVariance: 6.8,
                voiceEnergy: 85,
                overallScore: 88
            },
            {
                speechRate: 128,
                pauseFrequency: 7,
                pitchVariance: 15.3,
                voiceEnergy: 62,
                overallScore: 68
            },
            {
                speechRate: 142,
                pauseFrequency: 4,
                pitchVariance: 9.7,
                voiceEnergy: 78,
                overallScore: 79
            }
        ];
    }

    /**
     * Enable demo mode
     */
    enable() {
        this.isEnabled = true;
        console.log('Demo mode enabled - simulated voice analysis results will be used');
    }

    /**
     * Disable demo mode
     */
    disable() {
        this.isEnabled = false;
        console.log('Demo mode disabled - real microphone will be used');
    }

    /**
     * Check if demo mode is enabled
     */
    isActive() {
        return this.isEnabled;
    }

    /**
     * Get random demo results
     */
    getRandomResults() {
        const baseResult = this.demoResults[Math.floor(Math.random() * this.demoResults.length)];
        
        // Add some random variation to make it more realistic
        return {
            speechRate: Math.round(baseResult.speechRate + (Math.random() - 0.5) * 20),
            pauseFrequency: Math.max(0, Math.round(baseResult.pauseFrequency + (Math.random() - 0.5) * 2)),
            pitchVariance: Math.round((baseResult.pitchVariance + (Math.random() - 0.5) * 3) * 10) / 10,
            voiceEnergy: Math.max(0, Math.min(100, Math.round(baseResult.voiceEnergy + (Math.random() - 0.5) * 15))),
            overallScore: Math.max(0, Math.min(100, Math.round(baseResult.overallScore + (Math.random() - 0.5) * 10)))
        };
    }

    /**
     * Simulate recording process with realistic timing
     */
    async simulateRecording(onProgress, onComplete) {
        const duration = 3000; // 3 seconds for demo
        const steps = 30;
        const stepDuration = duration / steps;
        
        for (let i = 0; i <= steps; i++) {
            if (onProgress) {
                onProgress(i / steps);
            }
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
        
        // Generate demo results
        const results = this.getRandomResults();
        
        if (onComplete) {
            onComplete(results);
        }
        
        return results;
    }

    /**
     * Generate historical demo data for dashboard
     */
    generateHistoricalData(days = 7) {
        const data = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            const results = this.getRandomResults();
            const feedback = this.generateDemoFeedback(results);
            
            data.push({
                timestamp: date.toISOString(),
                results: results,
                feedback: feedback
            });
        }
        
        return data;
    }

    /**
     * Generate demo feedback based on results
     */
    generateDemoFeedback(results) {
        const feedbacks = [];
        
        if (results.speechRate >= 140) {
            feedbacks.push("Great speech fluency detected!");
        } else if (results.speechRate < 120) {
            feedbacks.push("Speech rate is a bit slow - consider recording when more alert.");
        }
        
        if (results.voiceEnergy >= 75) {
            feedbacks.push("Excellent voice energy levels.");
        } else if (results.voiceEnergy < 60) {
            feedbacks.push("Voice energy seems low - ensure good microphone positioning.");
        }
        
        if (results.overallScore >= 80) {
            feedbacks.push("Outstanding cognitive wellness indicators!");
        } else if (results.overallScore >= 70) {
            feedbacks.push("Good cognitive wellness patterns detected.");
        } else {
            feedbacks.push("Consider factors like sleep and stress that might affect speech patterns.");
        }
        
        return feedbacks.join(" ");
    }

    /**
     * Create demo notification
     */
    showDemoNotification() {
        const notification = document.createElement('div');
        notification.className = 'demo-notification';
        notification.innerHTML = `
            <div class="demo-content">
                <span class="demo-icon">🎭</span>
                <span class="demo-text">Demo Mode Active - Using simulated voice analysis</span>
                <button class="demo-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .demo-notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: linear-gradient(135deg, #FF6B6B, #FF8E53);
                color: white;
                padding: 15px 20px;
                border-radius: 25px;
                box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
                z-index: 2000;
                animation: slideInRight 0.3s ease;
            }
            
            .demo-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .demo-icon {
                font-size: 20px;
            }
            
            .demo-text {
                font-weight: 600;
                font-size: 14px;
            }
            
            .demo-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Show install app prompt
     */
    showInstallPrompt() {
        const installBanner = document.createElement('div');
        installBanner.className = 'install-banner';
        installBanner.innerHTML = `
            <div class="install-content">
                <span class="install-icon">📱</span>
                <span class="install-text">Install SYN10 for the best experience</span>
                <button class="install-btn" id="installAppBtn">Install</button>
                <button class="install-close" id="installClose">×</button>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .install-banner {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 15px 20px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
                z-index: 1500;
                animation: slideUp 0.3s ease;
            }
            
            .install-content {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .install-icon {
                font-size: 24px;
            }
            
            .install-text {
                flex: 1;
                font-weight: 600;
            }
            
            .install-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: 600;
            }
            
            .install-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                margin-left: 10px;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(installBanner);
        
        // Handle close button
        document.getElementById('installClose').addEventListener('click', () => {
            installBanner.remove();
        });
        
        // Handle install button
        document.getElementById('installAppBtn').addEventListener('click', () => {
            // This would trigger PWA install in a real scenario
            alert('PWA installation would be triggered here. For now, bookmark this page!');
            installBanner.remove();
        });
    }

    /**
     * Simulate microphone permission check
     */
    async checkMicrophonePermission() {
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Randomly decide if microphone is "available" (for demo purposes)
        const micAvailable = Math.random() > 0.7; // 30% chance of real mic being available
        
        if (!micAvailable) {
            this.enable();
            this.showDemoNotification();
            console.log('Microphone not available - Demo mode activated');
        }
        
        return micAvailable;
    }

    /**
     * Generate realistic voice visualizer data
     */
    generateVisualizerData() {
        const bars = 8;
        const data = [];
        
        for (let i = 0; i < bars; i++) {
            // Create wave-like pattern
            const baseHeight = 20;
            const maxHeight = 80;
            const wave = Math.sin((Date.now() / 200) + (i * 0.5)) * 0.5 + 0.5;
            const randomness = Math.random() * 0.3;
            
            const height = baseHeight + (maxHeight - baseHeight) * wave * (0.7 + randomness);
            data.push(Math.round(height));
        }
        
        return data;
    }

    /**
     * Update visualizer with demo data
     */
    updateDemoVisualizer() {
        const bars = document.querySelectorAll('.voice-bar');
        if (!bars.length) return;
        
        const data = this.generateVisualizerData();
        
        bars.forEach((bar, index) => {
            if (data[index]) {
                bar.style.height = `${data[index]}px`;
                bar.classList.toggle('active', data[index] > 40);
            }
        });
    }

    /**
     * Start demo visualizer animation
     */
    startDemoVisualizer() {
        if (!this.isActive()) return;
        
        const interval = setInterval(() => {
            if (!this.isActive()) {
                clearInterval(interval);
                return;
            }
            this.updateDemoVisualizer();
        }, 100);
        
        return interval;
    }

    /**
     * Show feature comparison
     */
    showFeatureComparison() {
        const modal = document.createElement('div');
        modal.className = 'feature-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎭 Demo Mode vs Real Analysis</h3>
                    <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="feature-comparison">
                        <div class="feature-column">
                            <h4>Demo Mode (Current)</h4>
                            <ul>
                                <li>✅ Simulated voice analysis</li>
                                <li>✅ All features functional</li>
                                <li>✅ Sample data and charts</li>
                                <li>✅ No microphone needed</li>
                            </ul>
                        </div>
                        <div class="feature-column">
                            <h4>Real Analysis</h4>
                            <ul>
                                <li>🎤 Your actual voice</li>
                                <li>📊 Personalized insights</li>
                                <li>📈 Real progress tracking</li>
                                <li>🔬 Advanced AI analysis</li>
                            </ul>
                        </div>
                    </div>
                    <p class="modal-note">
                        <strong>Note:</strong> Allow microphone access to switch to real voice analysis. 
                        Your data stays 100% private on your device.
                    </p>
                </div>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .feature-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
            }
            
            .modal-content {
                background: #071B1A;
                border: 2px solid rgba(67, 230, 214, 0.3);
                border-radius: 20px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid rgba(67, 230, 214, 0.2);
            }
            
            .modal-header h3 {
                color: #43E6D6;
                margin: 0;
            }
            
            .modal-close {
                background: none;
                border: none;
                color: #43E6D6;
                font-size: 24px;
                cursor: pointer;
            }
            
            .modal-body {
                padding: 20px;
            }
            
            .feature-comparison {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .feature-column h4 {
                color: #43E6D6;
                margin-bottom: 15px;
            }
            
            .feature-column ul {
                list-style: none;
                padding: 0;
            }
            
            .feature-column li {
                padding: 8px 0;
                color: #E8F4F3;
            }
            
            .modal-note {
                background: rgba(67, 230, 214, 0.1);
                border: 1px solid rgba(67, 230, 214, 0.2);
                border-radius: 10px;
                padding: 15px;
                color: #E8F4F3;
                margin: 0;
            }
            
            @media (max-width: 768px) {
                .feature-comparison {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    }
}

// Create global demo mode instance
window.demoMode = new DemoMode();

// Auto-check microphone availability when page loads
window.addEventListener('load', async () => {
    try {
        // Try to access microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately
        console.log('Microphone available - real mode enabled');
    } catch (error) {
        console.log('Microphone not available - enabling demo mode');
        window.demoMode.enable();
        window.demoMode.showDemoNotification();
        
        // Show install prompt after a delay
        setTimeout(() => {
            window.demoMode.showInstallPrompt();
        }, 3000);
    }
});

// Add keyboard shortcut to toggle demo mode (for testing)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        if (window.demoMode.isActive()) {
            window.demoMode.disable();
            alert('Demo mode disabled - will use real microphone');
        } else {
            window.demoMode.enable();
            window.demoMode.showDemoNotification();
            alert('Demo mode enabled - will use simulated data');
        }
    }
});
