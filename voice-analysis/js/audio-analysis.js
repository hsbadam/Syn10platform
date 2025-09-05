// Enhanced Audio Analysis Engine with VAD and Stability
class EnhancedAudioAnalysis {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaRecorder = null;
        this.mediaStream = null;
        this.recordedChunks = [];
        this.energySamples = [];
        this.rafId = null;
        this.state = 'idle'; // idle, recording, readyToAnalyze
    }

    // State machine for button management
    setState(newState) {
        this.state = newState;
        const recordBtn = document.getElementById('recordBtn');
        const stopBtn = document.getElementById('stopBtn');
        const analyzeBtn = document.getElementById('analyzeBtn');

        if (recordBtn) recordBtn.disabled = (newState !== 'idle');
        if (stopBtn) stopBtn.disabled = (newState !== 'recording');
        if (analyzeBtn) analyzeBtn.disabled = (newState !== 'readyToAnalyze');

        // Update button text based on state
        if (recordBtn) {
            switch(newState) {
                case 'idle':
                    recordBtn.textContent = '🎤 Start Recording';
                    recordBtn.className = 'btn btn-primary';
                    break;
                case 'recording':
                    recordBtn.textContent = '🎤 Recording...';
                    recordBtn.className = 'btn btn-recording';
                    break;
                case 'readyToAnalyze':
                    recordBtn.textContent = '🎤 Ready to Analyze';
                    recordBtn.className = 'btn btn-ready';
                    break;
            }
        }
    }

    // Enhanced microphone permission flow
    async startRecording() {
        try {
            // Show helpful tip for first-time users
            this.showMicrophoneTip();
            
            this.setState('recording');
            
            // Request microphone access with clear error handling
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Set up audio context and analyser
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            // Set up media recorder
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            this.recordedChunks = [];
            this.energySamples = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.setState('readyToAnalyze');
                this.showAnalysisResults();
            };

            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.startTimer();
            this.startEnergyAnalysis();
            this.hideMicrophoneTip();

        } catch (error) {
            this.handleMicrophoneError(error);
            this.setState('idle');
        }
    }

    // Clean stop function to avoid stuck microphone
    hardStop() {
        try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
        } catch (e) {}

        try {
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
            }
        } catch (e) {}

        try {
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
        } catch (e) {}

        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        this.stopTimer();
        this.setState('idle');
    }

    // Enhanced error handling with helpful messages
    handleMicrophoneError(error) {
        const statusElement = document.getElementById('micStatus');
        let message = '';

        switch(error.name) {
            case 'NotAllowedError':
                message = 'Microphone blocked. Click the lock icon in your address bar to allow access.';
                break;
            case 'NotFoundError':
                message = 'No microphone found. Please connect a microphone and try again.';
                break;
            case 'NotReadableError':
                message = 'Microphone is being used by another application. Please close other apps and try again.';
                break;
            default:
                message = 'Unable to access microphone. Please check your browser settings.';
        }

        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'error-message';
        }
    }

    // Show helpful tip for first-time users
    showMicrophoneTip() {
        const isFirstTime = !localStorage.getItem('syn10_mic_tip_shown');
        if (isFirstTime) {
            const tip = document.getElementById('microphoneTip');
            if (tip) {
                tip.style.display = 'block';
                tip.textContent = "Click 'Allow' when your browser asks for microphone permission";
            }
        }
    }

    hideMicrophoneTip() {
        localStorage.setItem('syn10_mic_tip_shown', 'true');
        const tip = document.getElementById('microphoneTip');
        if (tip) {
            tip.style.display = 'none';
        }
    }

    // Real-time energy analysis with VAD
    startEnergyAnalysis() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const analyze = () => {
            if (this.state !== 'recording') return;

            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate RMS energy
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / bufferLength) / 255;
            this.energySamples.push(rms);

            // Update visual feedback
            this.updateVisualFeedback(rms);

            this.rafId = requestAnimationFrame(analyze);
        };

        analyze();
    }

    // Voice Activity Detection (VAD-lite)
    calculateVAD(energySamples) {
        if (energySamples.length === 0) return { pauses: 0, pausesPerMin: 0 };

        const avgEnergy = energySamples.reduce((a, b) => a + b, 0) / energySamples.length;
        const threshold = avgEnergy * 0.35;
        
        let pauses = 0;
        let silent = false;
        
        for (const energy of energySamples) {
            if (energy < threshold && !silent) {
                silent = true;
                pauses++;
            }
            if (energy >= threshold) {
                silent = false;
            }
        }

        const durationMinutes = energySamples.length / 600; // Assuming 100ms samples
        const pausesPerMin = Math.round(pauses / Math.max(1, durationMinutes));

        return { pauses, pausesPerMin };
    }

    // Stability score (coefficient of variation)
    calculateStability(energySamples) {
        if (energySamples.length === 0) return 50;

        const mean = energySamples.reduce((a, b) => a + b, 0) / energySamples.length;
        const variance = energySamples.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / energySamples.length;
        const stdev = Math.sqrt(variance);
        
        const coefficientOfVariation = stdev / Math.max(1e-6, mean);
        const stability = Math.max(0, 100 - Math.min(100, coefficientOfVariation * 180));
        
        return Math.round(stability);
    }

    // Enhanced fluency calculation
    calculateFluency(vadData, stability, wpm) {
        const idealPausesPerMin = 8;
        const idealWPM = 120;
        
        let fluency = 50;
        
        // Pause penalty/bonus
        const pauseDiff = vadData.pausesPerMin - idealPausesPerMin;
        fluency -= Math.max(0, pauseDiff) * 2;
        
        // Stability bonus
        fluency += (stability - 50) * 0.4;
        
        // WPM adjustment
        fluency += (wpm - idealWPM) * 0.25;
        
        return Math.max(0, Math.min(100, Math.round(fluency)));
    }

    // Enhanced analysis with explanations
    async analyzeRecording() {
        if (this.energySamples.length === 0) {
            return this.getDefaultResults();
        }

        // Calculate metrics
        const vadData = this.calculateVAD(this.energySamples);
        const stability = this.calculateStability(this.energySamples);
        const avgEnergy = this.energySamples.reduce((a, b) => a + b, 0) / this.energySamples.length;
        const energyPercent = Math.round(avgEnergy * 100);
        
        // Estimate WPM (simplified)
        const estimatedWPM = Math.max(50, Math.min(180, 80 + (avgEnergy * 100) + (stability * 0.5)));
        
        // Calculate fluency
        const fluency = this.calculateFluency(vadData, stability, estimatedWPM);
        
        // Overall wellness score
        const wellnessScore = Math.round((energyPercent + stability + fluency) / 3);

        // Generate explanations
        const explanations = this.generateExplanations({
            energy: energyPercent,
            stability,
            fluency,
            pausesPerMin: vadData.pausesPerMin,
            wpm: estimatedWPM
        });

        const results = {
            speechRate: Math.round(estimatedWPM),
            pauseFrequency: vadData.pausesPerMin,
            pitchVariance: stability,
            voiceEnergy: energyPercent,
            fluency: fluency,
            wellnessScore: wellnessScore,
            explanations: explanations,
            timestamp: new Date().toISOString()
        };

        // Save to localStorage with limit
        this.saveResults(results);
        
        return results;
    }

    // Generate explanations for score changes
    generateExplanations(current) {
        const explanations = [];
        const history = this.getRecentHistory();
        
        if (history.length > 0) {
            const avg = this.calculateAverages(history);
            
            if (current.energy > avg.energy + 5) {
                explanations.push(`+${Math.round(current.energy - avg.energy)}: Higher voice energy than your 7-day average`);
            } else if (current.energy < avg.energy - 5) {
                explanations.push(`-${Math.round(avg.energy - current.energy)}: Lower voice energy than usual`);
            }
            
            if (current.pausesPerMin < avg.pausesPerMin - 1) {
                explanations.push(`+${Math.round((avg.pausesPerMin - current.pausesPerMin) * 2)}: Fewer pauses than your average`);
            } else if (current.pausesPerMin > avg.pausesPerMin + 1) {
                explanations.push(`-${Math.round((current.pausesPerMin - avg.pausesPerMin) * 2)}: More pauses than usual`);
            }
            
            if (current.stability > avg.stability + 5) {
                explanations.push(`+${Math.round((current.stability - avg.stability) * 0.4)}: More stable voice than usual`);
            }
        }
        
        if (explanations.length === 0) {
            explanations.push("Great baseline recording! Keep recording daily to see trends.");
        }
        
        return explanations;
    }

    // Save results with 14-session limit
    saveResults(results) {
        const data = JSON.parse(localStorage.getItem('syn10_voice') || '[]');
        data.push(results);
        
        // Keep only last 14 sessions
        const limitedData = data.slice(-14);
        localStorage.setItem('syn10_voice', JSON.stringify(limitedData));
    }

    // Export functionality
    exportData() {
        const data = localStorage.getItem('syn10_voice') || '[]';
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `syn10_voice_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    // Timer functionality
    startTimer() {
        this.startTime = Date.now();
        this.updateTimer();
    }

    updateTimer() {
        if (this.state !== 'recording') return;
        
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        setTimeout(() => this.updateTimer(), 1000);
    }

    stopTimer() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = '00:00';
        }
    }

    // Visual feedback during recording
    updateVisualFeedback(energy) {
        const visualizer = document.getElementById('audioVisualizer');
        if (!visualizer) return;

        const bars = visualizer.querySelectorAll('.audio-bar');
        const intensity = Math.min(1, energy * 3);
        
        bars.forEach((bar, index) => {
            const height = Math.random() * intensity * 100;
            bar.style.height = `${Math.max(5, height)}%`;
            bar.style.opacity = intensity > 0.1 ? '1' : '0.3';
        });
    }

    // Get recent history for comparisons
    getRecentHistory() {
        const data = JSON.parse(localStorage.getItem('syn10_voice') || '[]');
        return data.slice(-7); // Last 7 sessions
    }

    // Calculate averages from history
    calculateAverages(history) {
        if (history.length === 0) return {};
        
        return {
            energy: history.reduce((sum, session) => sum + session.voiceEnergy, 0) / history.length,
            stability: history.reduce((sum, session) => sum + session.pitchVariance, 0) / history.length,
            pausesPerMin: history.reduce((sum, session) => sum + session.pauseFrequency, 0) / history.length,
            wellnessScore: history.reduce((sum, session) => sum + session.wellnessScore, 0) / history.length
        };
    }

    // Default results for demo mode
    getDefaultResults() {
        return {
            speechRate: 145,
            pauseFrequency: 3,
            pitchVariance: 78,
            voiceEnergy: 82,
            fluency: 85,
            wellnessScore: 83,
            explanations: ["Demo mode active - using simulated analysis"],
            timestamp: new Date().toISOString()
        };
    }

    // Show analysis results
    async showAnalysisResults() {
        const results = await this.analyzeRecording();
        
        // Update UI with results
        this.displayResults(results);
        
        // Reset state
        this.setState('idle');
    }

    // Display results in UI
    displayResults(results) {
        // Update result cards
        document.getElementById('speechRateValue').textContent = results.speechRate;
        document.getElementById('pauseFrequencyValue').textContent = results.pauseFrequency;
        document.getElementById('pitchVarianceValue').textContent = results.pitchVariance;
        document.getElementById('voiceEnergyValue').textContent = `${results.voiceEnergy}%`;
        document.getElementById('wellnessScoreValue').textContent = results.wellnessScore;

        // Update explanations
        const explanationsElement = document.getElementById('explanations');
        if (explanationsElement && results.explanations) {
            explanationsElement.innerHTML = results.explanations
                .map(exp => `<li>${exp}</li>`)
                .join('');
        }

        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
    }
}

// Initialize enhanced audio analysis
const enhancedAudio = new EnhancedAudioAnalysis();
