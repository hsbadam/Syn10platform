// Enhanced Audio Analysis Engine with Advanced VAD and Speech Complexity
class EnhancedAudioAnalysis {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaRecorder = null;
        this.mediaStream = null;
        this.recordedChunks = [];
        this.energySamples = [];
        this.rafId = null;
        this.state = 'idle';
        
        // Advanced VAD properties
        this.vadConfig = {
            energyThreshold: -35, // dB
            zeroCrossingThreshold: 0.25,
            spectralEntropyThreshold: 0.6,
            hangoverFrames: 10,
            minSpeechDuration: 100 // ms
        };
        
        this.vadState = {
            isSpeaking: false,
            hangoverCount: 0,
            speechSegments: [],
            silenceSegments: []
        };
        
        // Speech complexity tracking
        this.complexityData = {
            spectralCentroids: [],
            spectralRolloffs: [],
            spectralFlux: [],
            formantEstimates: []
        };
        
        // User baseline
        this.userBaseline = this.loadUserBaseline();
        this.sessionData = [];
    }

    // Load user-specific baseline from localStorage
    loadUserBaseline() {
        const stored = localStorage.getItem('syn10_voice_baseline');
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            avgEnergy: null,
            avgPitchVariance: null,
            avgSpeechRate: null,
            pausePattern: null,
            recordings: 0,
            established: false
        };
    }

    // Save user baseline
    saveUserBaseline() {
        localStorage.setItem('syn10_voice_baseline', JSON.stringify(this.userBaseline));
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
            this.showMicrophoneTip();
            
            this.setState('recording');
            
            // Request microphone access with enhanced settings
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
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
            this.complexityData = {
                spectralCentroids: [],
                spectralRolloffs: [],
                spectralFlux: [],
                formantEstimates: []
            };
            this.vadState.speechSegments = [];
            this.vadState.silenceSegments = [];

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
            this.mediaRecorder.start(100);
            this.startTimer();
            this.startAdvancedAnalysis();
            this.hideMicrophoneTip();

        } catch (error) {
            this.handleMicrophoneError(error);
            this.setState('idle');
        }
    }

    // Advanced real-time analysis with VAD
    startAdvancedAnalysis() {
        const bufferLength = this.analyser.frequencyBinCount;
        const timeDomainData = new Uint8Array(bufferLength);
        const frequencyData = new Uint8Array(bufferLength);
        let previousSpectrum = new Float32Array(bufferLength);

        const analyze = () => {
            if (this.state !== 'recording') return;

            // Get time and frequency domain data
            this.analyser.getByteTimeDomainData(timeDomainData);
            this.analyser.getByteFrequencyData(frequencyData);
            
            // Advanced Voice Activity Detection
            const vadResult = this.performAdvancedVAD(timeDomainData, frequencyData);
            
            // Extract speech complexity features
            const complexityFeatures = this.extractComplexityFeatures(frequencyData, previousSpectrum);
            
            // Store results
            this.energySamples.push(vadResult.energy);
            this.complexityData.spectralCentroids.push(complexityFeatures.centroid);
            this.complexityData.spectralRolloffs.push(complexityFeatures.rolloff);
            this.complexityData.spectralFlux.push(complexityFeatures.flux);
            
            // Update visualizer
            this.updateVisualFeedback(vadResult.energy);
            
            // Save previous spectrum for flux calculation
            previousSpectrum = new Float32Array(frequencyData);
            
            this.rafId = requestAnimationFrame(analyze);
        };

        analyze();
    }

    // Advanced Voice Activity Detection
    performAdvancedVAD(timeDomain, frequency) {
        // 1. Calculate frame energy
        const energy = this.calculateFrameEnergy(timeDomain);
        
        // 2. Count zero crossings
        const zeroCrossings = this.countZeroCrossings(timeDomain);
        
        // 3. Calculate spectral entropy
        const spectralEntropy = this.calculateSpectralEntropy(frequency);
        
        // 4. Multi-factor VAD decision
        const energyActive = energy > this.vadConfig.energyThreshold;
        const zcActive = zeroCrossings > this.vadConfig.zeroCrossingThreshold * timeDomain.length;
        const entropyActive = spectralEntropy > this.vadConfig.spectralEntropyThreshold;
        
        // Weighted decision (energy is most important)
        const vadScore = (energyActive * 0.5) + (zcActive * 0.25) + (entropyActive * 0.25);
        const isSpeech = vadScore > 0.5;
        
        // Update VAD state with hangover
        this.updateVADState(isSpeech);
        
        return {
            energy: energy,
            zeroCrossings: zeroCrossings,
            spectralEntropy: spectralEntropy,
            isSpeech: this.vadState.isSpeaking,
            confidence: vadScore
        };
    }

    // Calculate frame energy in dB
    calculateFrameEnergy(frame) {
        let sum = 0;
        for (let i = 0; i < frame.length; i++) {
            const normalized = (frame[i] - 128) / 128;
            sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / frame.length);
        return 20 * Math.log10(rms + 1e-10);
    }

    // Count zero crossings
    countZeroCrossings(frame) {
        let crossings = 0;
        let previousSign = (frame[0] - 128) >= 0;
        
        for (let i = 1; i < frame.length; i++) {
            const currentSign = (frame[i] - 128) >= 0;
            if (currentSign !== previousSign) {
                crossings++;
            }
            previousSign = currentSign;
        }
        
        return crossings;
    }

    // Calculate spectral entropy
    calculateSpectralEntropy(spectrum) {
        let sum = 0;
        for (let i = 0; i < spectrum.length; i++) {
            sum += spectrum[i];
        }
        
        if (sum === 0) return 0;
        
        let entropy = 0;
        for (let i = 0; i < spectrum.length; i++) {
            if (spectrum[i] > 0) {
                const p = spectrum[i] / sum;
                entropy -= p * Math.log2(p);
            }
        }
        
        // Normalize entropy (0-1)
        return entropy / Math.log2(spectrum.length);
    }

    // Update VAD state with hangover mechanism
    updateVADState(isSpeech) {
        const timestamp = Date.now();
        
        if (isSpeech) {
            if (!this.vadState.isSpeaking) {
                // Speech onset
                this.vadState.isSpeaking = true;
                this.vadState.speechSegments.push({ start: timestamp, end: null });
            }
            this.vadState.hangoverCount = this.vadConfig.hangoverFrames;
        } else {
            if (this.vadState.hangoverCount > 0) {
                this.vadState.hangoverCount--;
            } else if (this.vadState.isSpeaking) {
                // Speech offset
                this.vadState.isSpeaking = false;
                const lastSegment = this.vadState.speechSegments[this.vadState.speechSegments.length - 1];
                if (lastSegment) {
                    lastSegment.end = timestamp;
                }
                this.vadState.silenceSegments.push({ start: timestamp });
            }
        }
    }

    // Extract speech complexity features
    extractComplexityFeatures(spectrum, previousSpectrum) {
        // Spectral centroid (brightness)
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < spectrum.length; i++) {
            weightedSum += i * spectrum[i];
            magnitudeSum += spectrum[i];
        }
        
        const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
        
        // Spectral rolloff (85th percentile frequency)
        const rolloffThreshold = magnitudeSum * 0.85;
        let cumulativeSum = 0;
        let rolloff = spectrum.length - 1;
        
        for (let i = 0; i < spectrum.length; i++) {
            cumulativeSum += spectrum[i];
            if (cumulativeSum >= rolloffThreshold) {
                rolloff = i;
                break;
            }
        }
        
        // Spectral flux (change between frames)
        let flux = 0;
        for (let i = 0; i < spectrum.length; i++) {
            const diff = spectrum[i] - previousSpectrum[i];
            flux += diff > 0 ? diff * diff : 0;
        }
        flux = Math.sqrt(flux);
        
        return {
            centroid: centroid,
            rolloff: rolloff,
            flux: flux
        };
    }

    // Calculate speech complexity score
    calculateSpeechComplexity() {
        if (this.complexityData.spectralCentroids.length === 0) {
            return { score: 0, confidence: 0 };
        }
        
        // Calculate phonetic diversity (spectral variation)
        const centroids = this.complexityData.spectralCentroids;
        const uniquePatterns = this.identifyUniqueSpectralPatterns(centroids);
        const diversity = uniquePatterns.length / centroids.length;
        
        // Calculate spectral dynamics
        const fluxValues = this.complexityData.spectralFlux;
        const avgFlux = fluxValues.reduce((a, b) => a + b, 0) / fluxValues.length;
        const dynamics = Math.min(avgFlux / 100, 1); // Normalize
        
        // Combine metrics
        const complexityScore = (diversity * 0.6 + dynamics * 0.4) * 100;
        
        return {
            score: Math.round(complexityScore),
            diversity: Math.round(diversity * 100),
            dynamics: Math.round(dynamics * 100),
            confidence: this.assessComplexityConfidence()
        };
    }

    // Identify unique spectral patterns
    identifyUniqueSpectralPatterns(centroids) {
        const patterns = [];
        const threshold = 50; // Frequency bin difference threshold
        
        for (const centroid of centroids) {
            let isUnique = true;
            for (const pattern of patterns) {
                if (Math.abs(centroid - pattern) < threshold) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) {
                patterns.push(centroid);
            }
        }
        
        return patterns;
    }

    // Assess confidence in complexity measurement
    assessComplexityConfidence() {
        const minSamples = 100;
        const sampleCount = this.complexityData.spectralCentroids.length;
        const snr = this.estimateSNR();
        
        let confidence = Math.min(sampleCount / minSamples, 1) * 0.5;
        confidence += Math.min(snr / 20, 1) * 0.5;
        
        return Math.round(confidence * 100);
    }

    // Estimate signal-to-noise ratio
    estimateSNR() {
        if (this.vadState.speechSegments.length === 0 || this.vadState.silenceSegments.length === 0) {
            return 10; // Default moderate SNR
        }
        
        const speechEnergy = this.energySamples.filter((_, i) => {
            // Simplified: assume speech during high energy
            return this.energySamples[i] > -30;
        });
        
        const noiseEnergy = this.energySamples.filter((_, i) => {
            return this.energySamples[i] <= -30;
        });
        
        if (speechEnergy.length > 0 && noiseEnergy.length > 0) {
            const avgSpeech = speechEnergy.reduce((a, b) => a + b) / speechEnergy.length;
            const avgNoise = noiseEnergy.reduce((a, b) => a + b) / noiseEnergy.length;
            return avgSpeech - avgNoise;
        }
        
        return 10;
    }

    // Enhanced analysis with user baseline
    async analyzeRecording() {
        if (this.energySamples.length === 0) {
            return this.getDefaultResults();
        }

        // Calculate basic metrics
        const vadData = this.calculateAdvancedVAD();
        const stability = this.calculateStability(this.energySamples);
        const avgEnergy = this.energySamples.reduce((a, b) => a + b, 0) / this.energySamples.length;
        const energyPercent = Math.round(this.normalizeEnergy(avgEnergy));
        
        // Calculate speech complexity
        const complexity = this.calculateSpeechComplexity();
        
        // Estimate WPM with improved algorithm
        const estimatedWPM = this.estimateImprovedWPM(vadData, complexity);
        
        // Calculate fluency
        const fluency = this.calculateFluency(vadData, stability, estimatedWPM);
        
        // Calculate cognitive load indicators
        const cognitiveLoad = this.estimateCognitiveLoad(vadData, complexity, stability);
        
        // Apply user baseline if established
        const adjustedMetrics = this.applyUserBaseline({
            speechRate: estimatedWPM,
            pauseFrequency: vadData.pausesPerMin,
            pitchVariance: stability,
            voiceEnergy: energyPercent,
            fluency: fluency,
            complexity: complexity.score,
            cognitiveLoad: cognitiveLoad.score
        });
        
        // Overall wellness score
        const wellnessScore = this.calculateWellnessScore(adjustedMetrics);

        // Update user baseline
        this.updateUserBaseline(adjustedMetrics);

        // Generate insights
        const explanations = this.generateInsights(adjustedMetrics);

        const results = {
            speechRate: Math.round(adjustedMetrics.speechRate),
            pauseFrequency: adjustedMetrics.pauseFrequency,
            pitchVariance: adjustedMetrics.pitchVariance,
            voiceEnergy: adjustedMetrics.voiceEnergy,
            fluency: adjustedMetrics.fluency,
            complexity: adjustedMetrics.complexity,
            cognitiveLoad: adjustedMetrics.cognitiveLoad,
            wellnessScore: wellnessScore,
            explanations: explanations,
            timestamp: new Date().toISOString()
        };

        // Save to localStorage
        this.saveResults(results);
        
        return results;
    }

    // Advanced VAD calculation with pause analysis
    calculateAdvancedVAD() {
        const speechSegments = this.vadState.speechSegments.filter(s => s.end !== null);
        const totalDuration = this.energySamples.length * 100; // ms
        
        let totalSpeechTime = 0;
        let pauses = 0;
        
        for (let i = 0; i < speechSegments.length; i++) {
            const segment = speechSegments[i];
            totalSpeechTime += segment.end - segment.start;
            
            if (i < speechSegments.length - 1) {
                const gap = speechSegments[i + 1].start - segment.end;
                if (gap > 300) { // Pause threshold: 300ms
                    pauses++;
                }
            }
        }
        
        const durationMinutes = totalDuration / 60000;
        const pausesPerMin = Math.round(pauses / Math.max(1, durationMinutes));
        const speechRatio = totalSpeechTime / totalDuration;
        
        return {
            pauses: pauses,
            pausesPerMin: pausesPerMin,
            speechRatio: speechRatio,
            totalSpeechTime: totalSpeechTime,
            segmentCount: speechSegments.length
        };
    }

    // Normalize energy to 0-100 scale
    normalizeEnergy(energyDb) {
        // Typical range: -50dB (quiet) to -10dB (loud)
        const normalized = ((energyDb + 50) / 40) * 100;
        return Math.max(0, Math.min(100, normalized));
    }

    // Improved WPM estimation
    estimateImprovedWPM(vadData, complexity) {
        // Base estimation from speech activity
        const baseWPM = 100 + (vadData.speechRatio * 50);
        
        // Adjust for complexity (more complex = likely faster)
        const complexityAdjustment = (complexity.score - 50) * 0.3;
        
        // Adjust for pauses
        const pauseAdjustment = Math.max(-20, Math.min(20, (4 - vadData.pausesPerMin) * 5));
        
        return Math.max(80, Math.min(200, baseWPM + complexityAdjustment + pauseAdjustment));
    }

    // Estimate cognitive load
    estimateCognitiveLoad(vadData, complexity, stability) {
        const indicators = {
            pauseRatio: vadData.pausesPerMin / 4, // Normalized to typical rate
            complexityDrop: Math.max(0, 50 - complexity.score) / 50,
            instability: Math.max(0, 50 - stability) / 50,
            speechRatio: 1 - vadData.speechRatio
        };
        
        // Weighted combination
        const loadScore = (
            indicators.pauseRatio * 0.3 +
            indicators.complexityDrop * 0.3 +
            indicators.instability * 0.2 +
            indicators.speechRatio * 0.2
        ) * 100;
        
        return {
            score: Math.round(Math.min(100, loadScore)),
            level: loadScore < 30 ? 'low' : loadScore < 60 ? 'moderate' : 'high',
            indicators: indicators
        };
    }

    // Apply user baseline adjustments
    applyUserBaseline(metrics) {
        if (!this.userBaseline.established) {
            return metrics;
        }
        
        const adjusted = { ...metrics };
        
        // Calculate deviations from baseline
        if (this.userBaseline.avgEnergy !== null) {
            const energyDeviation = metrics.voiceEnergy - this.userBaseline.avgEnergy;
            adjusted.voiceEnergy = Math.round(metrics.voiceEnergy + (energyDeviation * 0.2));
        }
        
        if (this.userBaseline.avgSpeechRate !== null) {
            const rateDeviation = metrics.speechRate - this.userBaseline.avgSpeechRate;
            adjusted.speechRate = Math.round(metrics.speechRate + (rateDeviation * 0.1));
        }
        
        return adjusted;
    }

    // Update user baseline
    updateUserBaseline(metrics) {
        this.userBaseline.recordings++;
        
        // Update rolling average
        const alpha = 0.1; // Learning rate
        
        if (this.userBaseline.avgEnergy === null) {
            this.userBaseline.avgEnergy = metrics.voiceEnergy;
        } else {
            this.userBaseline.avgEnergy = (1 - alpha) * this.userBaseline.avgEnergy + alpha * metrics.voiceEnergy;
        }
        
        if (this.userBaseline.avgSpeechRate === null) {
            this.userBaseline.avgSpeechRate = metrics.speechRate;
        } else {
            this.userBaseline.avgSpeechRate = (1 - alpha) * this.userBaseline.avgSpeechRate + alpha * metrics.speechRate;
        }
        
        if (this.userBaseline.avgPitchVariance === null) {
            this.userBaseline.avgPitchVariance = metrics.pitchVariance;
        } else {
            this.userBaseline.avgPitchVariance = (1 - alpha) * this.userBaseline.avgPitchVariance + alpha * metrics.pitchVariance;
        }
        
        // Mark as established after 7 recordings
        if (this.userBaseline.recordings >= 7) {
            this.userBaseline.established = true;
        }
        
        this.saveUserBaseline();
    }

    // Calculate overall wellness score
    calculateWellnessScore(metrics) {
        // Weighted combination of all factors
        const weights = {
            energy: 0.20,
            stability: 0.20,
            fluency: 0.15,
            complexity: 0.20,
            cognitiveLoad: 0.15,
            speechRate: 0.10
        };
        
        // Normalize cognitive load (lower is better)
        const normalizedLoad = 100 - metrics.cognitiveLoad;
        
        // Normalize speech rate (optimal around 150)
        const normalizedRate = 100 - Math.abs(metrics.speechRate - 150) * 0.5;
        
        const score = 
            metrics.voiceEnergy * weights.energy +
            metrics.pitchVariance * weights.stability +
            metrics.fluency * weights.fluency +
            metrics.complexity * weights.complexity +
            normalizedLoad * weights.cognitiveLoad +
            normalizedRate * weights.speechRate;
        
        return Math.round(Math.max(0, Math.min(100, score)));
    }

    // Generate insights based on analysis
    generateInsights(metrics) {
        const insights = [];
        
        // Energy insights
        if (metrics.voiceEnergy > 80) {
            insights.push("Excellent voice energy - you sound confident and clear");
        } else if (metrics.voiceEnergy < 50) {
            insights.push("Lower voice energy detected - try speaking from your diaphragm");
        }
        
        // Complexity insights
        if (metrics.complexity > 70) {
            insights.push("High speech complexity indicates good cognitive flexibility");
        } else if (metrics.complexity < 40) {
            insights.push("Speech patterns are simpler today - this is normal when tired");
        }
        
        // Cognitive load insights
        if (metrics.cognitiveLoad > 60) {
            insights.push("Higher cognitive load detected - consider taking breaks");
        } else if (metrics.cognitiveLoad < 30) {
            insights.push("Low cognitive load - your mind is working efficiently");
        }
        
        // Baseline comparisons
        if (this.userBaseline.established) {
            if (metrics.voiceEnergy > this.userBaseline.avgEnergy + 10) {
                insights.push(`Energy ${Math.round(metrics.voiceEnergy - this.userBaseline.avgEnergy)}% above your baseline`);
            }
            if (metrics.speechRate > this.userBaseline.avgSpeechRate + 15) {
                insights.push("Speaking faster than usual - excitement or stress?");
            }
        } else {
            insights.push(`${7 - this.userBaseline.recordings} more recordings needed to establish your baseline`);
        }
        
        return insights;
    }

    // Existing methods continue below...
    
    // Stability calculation (unchanged)
    calculateStability(energySamples) {
        if (energySamples.length === 0) return 50;

        const mean = energySamples.reduce((a, b) => a + b, 0) / energySamples.length;
        const variance = energySamples.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / energySamples.length;
        const stdev = Math.sqrt(variance);
        
        const coefficientOfVariation = stdev / Math.max(1e-6, Math.abs(mean));
        const stability = Math.max(0, 100 - Math.min(100, coefficientOfVariation * 180));
        
        return Math.round(stability);
    }

    // Fluency calculation (unchanged)
    calculateFluency(vadData, stability, wpm) {
        const idealPausesPerMin = 8;
        const idealWPM = 150;
        
        let fluency = 50;
        
        const pauseDiff = vadData.pausesPerMin - idealPausesPerMin;
        fluency -= Math.max(0, pauseDiff) * 2;
        
        fluency += (stability - 50) * 0.4;
        fluency += (wpm - idealWPM) * 0.25;
        
        return Math.max(0, Math.min(100, Math.round(fluency)));
    }

    // Other existing methods remain the same...
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

    updateVisualFeedback(energy) {
        const visualizer = document.getElementById('audioVisualizer');
        if (!visualizer) return;

        const bars = visualizer.querySelectorAll('.audio-bar');
        const intensity = this.normalizeEnergy(energy) / 100;
        
        bars.forEach((bar, index) => {
            const height = Math.random() * intensity * 100;
            bar.style.height = `${Math.max(5, height)}%`;
            bar.style.opacity = intensity > 0.1 ? '1' : '0.3';
        });
    }

    getRecentHistory() {
        const data = JSON.parse(localStorage.getItem('syn10_voice') || '[]');
        return data.slice(-7);
    }

    calculateAverages(history) {
        if (history.length === 0) return {};
        
        return {
            energy: history.reduce((sum, session) => sum + session.voiceEnergy, 0) / history.length,
            stability: history.reduce((sum, session) => sum + session.pitchVariance, 0) / history.length,
            pausesPerMin: history.reduce((sum, session) => sum + session.pauseFrequency, 0) / history.length,
            wellnessScore: history.reduce((sum, session) => sum + session.wellnessScore, 0) / history.length
        };
    }

    saveResults(results) {
        const data = JSON.parse(localStorage.getItem('syn10_voice') || '[]');
        data.push(results);
        
        const limitedData = data.slice(-14);
        localStorage.setItem('syn10_voice', JSON.stringify(limitedData));
    }

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

    getDefaultResults() {
        return {
            speechRate: 145,
            pauseFrequency: 3,
            pitchVariance: 78,
            voiceEnergy: 82,
            fluency: 85,
            complexity: 65,
            cognitiveLoad: 35,
            wellnessScore: 83,
            explanations: ["Demo mode active - using simulated analysis"],
            timestamp: new Date().toISOString()
        };
    }

    async showAnalysisResults() {
        const results = await this.analyzeRecording();
        this.displayResults(results);
        this.setState('idle');
    }

    displayResults(results) {
        // Update result cards
        document.getElementById('speechRateValue').textContent = results.speechRate;
        document.getElementById('pauseFrequencyValue').textContent = results.pauseFrequency;
        document.getElementById('pitchVarianceValue').textContent = results.pitchVariance;
        document.getElementById('voiceEnergyValue').textContent = `${results.voiceEnergy}%`;
        document.getElementById('wellnessScoreValue').textContent = results.wellnessScore;

        // Add complexity and cognitive load if elements exist
        if (document.getElementById('complexityValue')) {
            document.getElementById('complexityValue').textContent = `${results.complexity}%`;
        }
        if (document.getElementById('cognitiveLoadValue')) {
            document.getElementById('cognitiveLoadValue').textContent = `${results.cognitiveLoad}%`;
        }

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
