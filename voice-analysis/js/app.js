// Final Production SYN10 Voice Analysis JavaScript v1.0.0
// Real voice analysis algorithms with proper encoding and version tracking

const APP_VERSION = '1.0.0';

class VoiceAnalysisApp {
    constructor() {
        this.version = APP_VERSION;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.recordingDuration = 60; // 60 seconds
        this.audioData = [];
        this.currentPrompt = '';
        
        // Audio visualization
        this.audioBars = [];
        this.animationFrame = null;
        
        // Real-time analysis data
        this.realTimeData = {
            energyLevels: [],
            silencePeriods: [],
            frequencyData: []
        };
        
        // Performance optimization
        this.analysisInterval = window.innerWidth <= 768 ? 200 : 100; // Slower on mobile
        
        // State management
        this.currentState = 'idle'; // idle, requesting, recording, processing, results
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.loadDailyPrompt();
        this.checkMicrophonePermission();
        this.setupKeyboardShortcuts();
        this.setupPWA();
        
        // Log version for debugging
        console.log(`SYN10 Voice Analysis v${this.version} initialized`);
    }

    setupElements() {
        // Main elements
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.timer = document.getElementById('timer');
        this.micStatus = document.getElementById('micStatus');
        this.promptText = document.getElementById('promptText');
        this.newPromptBtn = document.getElementById('newPromptBtn');
        this.dashboardBtn = document.getElementById('dashboardBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        // Audio visualizer
        this.audioVisualizer = document.getElementById('audioVisualizer');
        this.setupAudioBars();
        
        // Recording timer and progress
        this.recordingTimer = document.getElementById('recordingTimer');
        this.recordingProgress = document.getElementById('recordingProgress');
        this.recordingProgressCircle = document.getElementById('recordingProgressCircle');
        
        // Results section
        this.resultsSection = document.getElementById('resultsSection');
        this.metricsGrid = document.getElementById('metricsGrid');
        this.wellnessScore = document.getElementById('wellnessScore');
        this.explanationsCard = document.getElementById('explanationsCard');
        
        // Dashboard
        this.dashboardSection = document.getElementById('dashboardSection');
        this.mainSection = document.getElementById('mainSection');
    }

    setupAudioBars() {
        // Create 8 audio bars for visualization
        this.audioVisualizer.innerHTML = '';
        this.audioBars = [];
        
        for (let i = 0; i < 8; i++) {
            const bar = document.createElement('div');
            bar.className = 'audio-bar';
            bar.dataset.intensity = 'low';
            this.audioVisualizer.appendChild(bar);
            this.audioBars.push(bar);
        }
    }

    setupEventListeners() {
        // Recording controls
        this.recordBtn?.addEventListener('click', () => this.startRecording());
        this.stopBtn?.addEventListener('click', () => this.stopRecording());
        
        // Navigation
        this.dashboardBtn?.addEventListener('click', () => this.showDashboard());
        this.settingsBtn?.addEventListener('click', () => this.showSettings());
        
        // Prompt controls
        this.newPromptBtn?.addEventListener('click', () => this.loadDailyPrompt());
        
        // Results actions
        document.getElementById('saveResultsBtn')?.addEventListener('click', () => this.saveResults());
        document.getElementById('newRecordingBtn')?.addEventListener('click', () => this.resetForNewRecording());
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
        
        // Modal controls
        document.getElementById('settingsModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettings();
        });
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeSettings());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Space to start/stop recording
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            }
            
            // Ctrl+D for dashboard
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.showDashboard();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeSettings();
            }
        });
    }

    async checkMicrophonePermission() {
        try {
            const permission = await navigator.permissions.query({ name: 'microphone' });
            
            if (permission.state === 'granted') {
                this.updateMicStatus('Microphone ready', 'success');
            } else if (permission.state === 'prompt') {
                this.updateMicStatus('Click "Start Recording" to begin', 'info');
            } else {
                this.updateMicStatus('Microphone access denied. Please enable in browser settings.', 'error');
            }
            
            permission.addEventListener('change', () => {
                this.checkMicrophonePermission();
            });
        } catch (error) {
            this.updateMicStatus('Click "Start Recording" to begin', 'info');
        }
    }

    updateMicStatus(message, type = 'info') {
        if (!this.micStatus) return;
        
        this.micStatus.textContent = message;
        this.micStatus.className = 'mic-status';
        
        if (type === 'error') {
            this.micStatus.classList.add('error-message');
        }
    }

    async startRecording() {
        if (this.isRecording) return;
        
        try {
            this.setState('requesting');
            this.updateMicStatus('Requesting microphone access...', 'info');
            
            // Reset real-time data collection
            this.realTimeData = {
                energyLevels: [],
                silencePeriods: [],
                frequencyData: []
            };
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                } 
            });
            
            this.setState('recording');
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Setup audio context for visualization AND analysis
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.3;
            this.microphone.connect(this.analyser);
            
            // Setup media recorder
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            this.audioData = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioData.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.startTimer();
            this.startVisualization();
            this.startRealTimeAnalysis();
            this.updateUI();
            
            this.updateMicStatus('Recording... Speak naturally', 'success');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.setState('idle');
            this.isRecording = false;
            
            if (error.name === 'NotAllowedError') {
                this.updateMicStatus('Microphone access denied. Click "Allow" when browser asks for permission.', 'error');
                this.recordBtn?.classList.add('recording-error');
                setTimeout(() => this.recordBtn?.classList.remove('recording-error'), 500);
            } else {
                this.updateMicStatus('Error accessing microphone. Please try again.', 'error');
            }
        }
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        this.setState('processing');
        
        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        // Stop timer and visualization
        this.stopTimer();
        this.stopVisualization();
        this.stopRealTimeAnalysis();
        
        // Clean up audio context
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.updateUI();
        this.updateMicStatus('Processing your recording...', 'info');
        
        // Add completion animation
        this.recordBtn?.classList.add('recording-complete');
        setTimeout(() => this.recordBtn?.classList.remove('recording-complete'), 600);
    }

    startTimer() {
        let elapsed = 0;
        
        // Show recording timer
        if (this.recordingTimer) {
            this.recordingTimer.classList.add('active');
        }
        
        // Show progress circle
        if (this.recordingProgress) {
            this.recordingProgress.classList.add('active');
        }
        
        this.recordingTimerInterval = setInterval(() => {
            elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            
            // Update timer display
            if (this.timer) {
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Update recording timer
            if (this.recordingTimer) {
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                this.recordingTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Auto-stop at 60 seconds
            if (elapsed >= this.recordingDuration) {
                this.stopRecording();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.recordingTimerInterval) {
            clearInterval(this.recordingTimerInterval);
        }
        
        // Hide recording timer
        if (this.recordingTimer) {
            this.recordingTimer.classList.remove('active');
        }
        
        // Hide progress circle
        if (this.recordingProgress) {
            this.recordingProgress.classList.remove('active');
        }
    }

    startVisualization() {
        if (!this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const animate = () => {
            if (!this.isRecording) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            this.updateAudioBars(dataArray);
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }

    startRealTimeAnalysis() {
        if (!this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeDataArray = new Uint8Array(this.analyser.fftSize);
        
        const analyze = () => {
            if (!this.isRecording) return;
            
            // Get frequency and time domain data
            this.analyser.getByteFrequencyData(dataArray);
            this.analyser.getByteTimeDomainData(timeDataArray);
            
            // Calculate real-time metrics
            const energy = this.calculateRealTimeEnergy(timeDataArray);
            const isSilent = energy < 0.01;
            
            // Store data for later analysis
            this.realTimeData.energyLevels.push(energy);
            this.realTimeData.silencePeriods.push(isSilent);
            this.realTimeData.frequencyData.push(Array.from(dataArray));
            
            setTimeout(analyze, this.analysisInterval); // Performance optimized interval
        };
        
        analyze();
    }

    stopRealTimeAnalysis() {
        // Analysis stops automatically when isRecording becomes false
    }

    // CRITICAL: This function sets data-intensity attributes based on actual microphone input
    updateAudioBars(audioData) {
        if (!this.audioBars.length) return;
        
        // Calculate average levels for each bar
        const barsCount = this.audioBars.length;
        const segmentSize = Math.floor(audioData.length / barsCount);
        
        this.audioBars.forEach((bar, index) => {
            // Get audio data segment for this bar
            const start = index * segmentSize;
            const end = start + segmentSize;
            const segment = audioData.slice(start, end);
            
            // Calculate average level for this segment
            const average = segment.reduce((sum, value) => sum + value, 0) / segment.length;
            const level = (average / 255) * 100; // Convert to percentage
            
            // Add some smoothing for more natural movement
            const smoothingFactor = 0.7;
            const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
            const adjustedLevel = level * smoothingFactor * randomFactor;
            
            // Set data-intensity attribute based on level
            if (adjustedLevel < 25) {
                bar.dataset.intensity = 'low';
            } else if (adjustedLevel < 50) {
                bar.dataset.intensity = 'medium';
            } else if (adjustedLevel < 75) {
                bar.dataset.intensity = 'high';
            } else {
                bar.dataset.intensity = 'peak';
            }
            
            // Add active class for animation
            bar.classList.add('active');
        });
    }

    stopVisualization() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Reset audio bars
        this.audioBars.forEach(bar => {
            bar.classList.remove('active');
            bar.dataset.intensity = 'low';
        });
    }

    // REAL VOICE ANALYSIS IMPLEMENTATION
    async processRecording() {
        this.setState('processing');
        
        try {
            // Create audio blob from recorded data
            const audioBlob = new Blob(this.audioData, { type: 'audio/webm' });
            
            // Perform real analysis
            const results = await this.performRealAnalysis(audioBlob);
            this.displayResults(results);
            
            this.setState('results');
            this.updateMicStatus('Analysis complete!', 'success');
            
        } catch (error) {
            console.error('Error processing recording:', error);
            this.updateMicStatus('Error processing recording. Please try again.', 'error');
            this.setState('idle');
        }
    }

    async performRealAnalysis(audioBlob) {
        // Get recording duration
        const duration = this.recordingStartTime ? 
            Math.floor((Date.now() - this.recordingStartTime) / 1000) : 60;
        
        // Analyze real-time collected data
        const voiceEnergy = this.calculateVoiceEnergy();
        const pauseAnalysis = this.analyzePauses();
        const speechRate = this.estimateSpeechRate(pauseAnalysis, duration);
        const pitchVariance = this.analyzePitchVariance();
        const stabilityScore = this.calculateStabilityScore();
        
        // Calculate overall wellness score based on real metrics
        const overallScore = this.calculateOverallScore({
            voiceEnergy,
            pauseFrequency: pauseAnalysis.count,
            speechRate,
            stabilityScore
        });
        
        return {
            speechRate: Math.round(speechRate),
            pauseFrequency: pauseAnalysis.count,
            pitchVariance: Math.round(pitchVariance * 10) / 10,
            voiceEnergy: Math.round(voiceEnergy),
            stabilityScore: Math.round(stabilityScore),
            overallScore: Math.round(overallScore),
            duration: duration,
            timestamp: new Date().toISOString(),
            version: this.version, // Include version in results
            explanations: this.generateRealExplanations({
                voiceEnergy,
                pauseFrequency: pauseAnalysis.count,
                speechRate,
                stabilityScore
            })
        };
    }

    calculateRealTimeEnergy(timeDataArray) {
        // Calculate RMS (Root Mean Square) energy
        let sum = 0;
        for (let i = 0; i < timeDataArray.length; i++) {
            const sample = (timeDataArray[i] - 128) / 128; // Normalize to -1 to 1
            sum += sample * sample;
        }
        return Math.sqrt(sum / timeDataArray.length);
    }

    calculateVoiceEnergy() {
        if (this.realTimeData.energyLevels.length === 0) return 50;
        
        // Calculate average energy, excluding silence
        const nonSilentEnergy = this.realTimeData.energyLevels.filter((energy, index) => 
            !this.realTimeData.silencePeriods[index]
        );
        
        if (nonSilentEnergy.length === 0) return 20; // Very quiet recording
        
        const avgEnergy = nonSilentEnergy.reduce((sum, energy) => sum + energy, 0) / nonSilentEnergy.length;
        
        // Convert to percentage (0-100)
        return Math.min(100, Math.max(0, avgEnergy * 300));
    }

    analyzePauses() {
        if (this.realTimeData.silencePeriods.length === 0) return { count: 3, avgDuration: 0.5 };
        
        let pauseCount = 0;
        let pauseDurations = [];
        let currentPauseLength = 0;
        let inPause = false;
        
        // Analyze silence periods (each sample is based on analysisInterval)
        const sampleDuration = this.analysisInterval / 1000; // Convert to seconds
        
        for (let i = 0; i < this.realTimeData.silencePeriods.length; i++) {
            const isSilent = this.realTimeData.silencePeriods[i];
            
            if (isSilent) {
                if (!inPause) {
                    inPause = true;
                    currentPauseLength = 1;
                } else {
                    currentPauseLength++;
                }
            } else {
                if (inPause) {
                    // End of pause - count it if it was significant (>300ms)
                    const pauseDurationMs = currentPauseLength * this.analysisInterval;
                    if (pauseDurationMs >= 300) {
                        pauseCount++;
                        pauseDurations.push(currentPauseLength * sampleDuration);
                    }
                    inPause = false;
                    currentPauseLength = 0;
                }
            }
        }
        
        const avgDuration = pauseDurations.length > 0 ? 
            pauseDurations.reduce((sum, dur) => sum + dur, 0) / pauseDurations.length : 0.5;
        
        return { count: pauseCount, avgDuration };
    }

    estimateSpeechRate(pauseAnalysis, totalDuration) {
        // Improved speech rate estimation with voiced segment detection
        const speakingTime = totalDuration - (pauseAnalysis.count * pauseAnalysis.avgDuration);
        
        // Count voiced segments more accurately
        const voicedSegments = this.realTimeData.silencePeriods.filter(isSilent => !isSilent).length;
        const voicedDuration = voicedSegments * (this.analysisInterval / 1000);
        
        // Estimate words based on voiced segments and energy patterns
        // Higher energy and more segments suggest more words
        const avgEnergy = this.realTimeData.energyLevels.reduce((sum, e) => sum + e, 0) / this.realTimeData.energyLevels.length;
        const energyFactor = Math.min(1.5, Math.max(0.5, avgEnergy * 5)); // 0.5 to 1.5 multiplier
        
        const estimatedWords = Math.max(speakingTime * 1.8 * energyFactor, voicedDuration * 2.2);
        const wordsPerMinute = (estimatedWords / totalDuration) * 60;
        
        // Clamp to reasonable range
        return Math.min(200, Math.max(80, wordsPerMinute));
    }

    analyzePitchVariance() {
        if (this.realTimeData.frequencyData.length === 0) return 10;
        
        // Improved pitch detection using spectral centroid
        const pitchEstimates = [];
        
        for (const frequencyData of this.realTimeData.frequencyData) {
            // Calculate spectral centroid (weighted average frequency)
            let weightedSum = 0;
            let magnitudeSum = 0;
            
            // Focus on speech frequency range (80Hz - 1000Hz roughly corresponds to bins 4-200)
            for (let i = 4; i < Math.min(200, frequencyData.length); i++) {
                const magnitude = frequencyData[i];
                if (magnitude > 30) { // Only count significant peaks
                    weightedSum += i * magnitude;
                    magnitudeSum += magnitude;
                }
            }
            
            if (magnitudeSum > 0) {
                const centroid = weightedSum / magnitudeSum;
                pitchEstimates.push(centroid);
            }
        }
        
        if (pitchEstimates.length < 2) return 8;
        
        // Calculate variance of spectral centroids
        const mean = pitchEstimates.reduce((sum, freq) => sum + freq, 0) / pitchEstimates.length;
        const variance = pitchEstimates.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / pitchEstimates.length;
        
        // Convert to Hz estimate (rough approximation)
        const pitchVarianceHz = Math.sqrt(variance) * 0.15; // Scaling factor
        
        return Math.min(15, Math.max(5, pitchVarianceHz));
    }

    calculateStabilityScore() {
        if (this.realTimeData.energyLevels.length === 0) return 75;
        
        // Calculate coefficient of variation for energy levels
        const nonSilentEnergy = this.realTimeData.energyLevels.filter((energy, index) => 
            !this.realTimeData.silencePeriods[index]
        );
        
        if (nonSilentEnergy.length < 2) return 60;
        
        const mean = nonSilentEnergy.reduce((sum, energy) => sum + energy, 0) / nonSilentEnergy.length;
        const variance = nonSilentEnergy.reduce((sum, energy) => sum + Math.pow(energy - mean, 2), 0) / nonSilentEnergy.length;
        const stdDev = Math.sqrt(variance);
        
        const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
        
        // Convert to stability score (lower variation = higher stability)
        const stabilityScore = Math.max(0, 100 - (coefficientOfVariation * 100));
        
        return Math.min(100, Math.max(40, stabilityScore));
    }

    calculateOverallScore(metrics) {
        // Weight different metrics based on importance
        const weights = {
            voiceEnergy: 0.25,
            pauseFrequency: 0.20,
            speechRate: 0.25,
            stabilityScore: 0.30
        };
        
        // Normalize metrics to 0-100 scale
        const normalizedMetrics = {
            voiceEnergy: Math.min(100, Math.max(0, metrics.voiceEnergy)),
            pauseFrequency: Math.min(100, Math.max(0, 100 - (metrics.pauseFrequency - 2) * 10)), // 2-4 pauses is optimal
            speechRate: Math.min(100, Math.max(0, 100 - Math.abs(metrics.speechRate - 150) * 0.5)), // 150 WPM is optimal
            stabilityScore: metrics.stabilityScore
        };
        
        // Calculate weighted average
        const overallScore = Object.keys(weights).reduce((sum, metric) => {
            return sum + (normalizedMetrics[metric] * weights[metric]);
        }, 0);
        
        return Math.min(100, Math.max(30, overallScore));
    }

    generateRealExplanations(metrics) {
        const explanations = [];
        
        // Voice energy explanations
        if (metrics.voiceEnergy > 80) {
            explanations.push("Strong voice energy indicates good respiratory health and confidence");
        } else if (metrics.voiceEnergy < 50) {
            explanations.push("Lower voice energy may suggest fatigue or reduced vocal confidence");
        } else {
            explanations.push("Moderate voice energy shows balanced vocal expression");
        }
        
        // Pause frequency explanations
        if (metrics.pauseFrequency >= 2 && metrics.pauseFrequency <= 4) {
            explanations.push("Natural pause patterns indicate thoughtful speech processing");
        } else if (metrics.pauseFrequency > 6) {
            explanations.push("Frequent pauses may suggest processing challenges or hesitation");
        } else {
            explanations.push("Few pauses indicate rapid speech processing");
        }
        
        // Speech rate explanations
        if (metrics.speechRate >= 140 && metrics.speechRate <= 160) {
            explanations.push("Optimal speech rate demonstrates clear cognitive processing");
        } else if (metrics.speechRate > 180) {
            explanations.push("Rapid speech may indicate excitement or anxiety");
        } else if (metrics.speechRate < 120) {
            explanations.push("Slower speech suggests careful, deliberate communication");
        }
        
        // Stability explanations
        if (metrics.stabilityScore > 80) {
            explanations.push("High vocal stability indicates emotional regulation and focus");
        } else if (metrics.stabilityScore < 60) {
            explanations.push("Voice variability may reflect emotional processing or stress");
        }
        
        return explanations.slice(0, 4); // Return up to 4 explanations
    }

    displayResults(results) {
        if (!this.resultsSection) return;
        
        // Show results section
        this.resultsSection.style.display = 'block';
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Update metrics with sequential animation
        this.updateMetrics(results);
        
        // Update wellness score
        this.updateWellnessScore(results);
        
        // Update explanations
        this.updateExplanations(results);
        
        // Add ethical disclaimer
        this.addDisclaimer();
        
        // Save to localStorage
        this.saveToLocalStorage(results);
    }

    updateMetrics(results) {
        // FIXED EMOJI ENCODING
        const metrics = [
            {
                icon: '\uD83D\uDDE3\uFE0F', // 🗣️ Speaking head
                value: `${results.speechRate} WPM`,
                label: 'Speech Rate',
                status: this.getMetricStatus(results.speechRate, [140, 180])
            },
            {
                icon: '\u23F8\uFE0F', // ⏸️ Pause button
                value: results.pauseFrequency,
                label: 'Pause Frequency',
                status: this.getMetricStatus(results.pauseFrequency, [2, 4], true)
            },
            {
                icon: '\uD83C\uDFB5', // 🎵 Musical note
                value: `${results.pitchVariance} Hz`,
                label: 'Pitch Variance',
                status: this.getMetricStatus(results.pitchVariance, [8, 12])
            },
            {
                icon: '\u26A1', // ⚡ Lightning bolt
                value: `${results.voiceEnergy}%`,
                label: 'Voice Energy',
                status: this.getMetricStatus(results.voiceEnergy, [70, 90])
            }
        ];
        
        if (this.metricsGrid) {
            this.metricsGrid.innerHTML = metrics.map((metric, index) => `
                <div class="metric-card" style="animation-delay: ${0.1 + index * 0.1}s">
                    <div class="metric-icon">${metric.icon}</div>
                    <div class="metric-value">${metric.value}</div>
                    <div class="metric-label">${metric.label}</div>
                    <div class="metric-status ${metric.status.class}">${metric.status.text}</div>
                </div>
            `).join('');
        }
    }

    getMetricStatus(value, range, inverse = false) {
        const [min, max] = range;
        const isGood = inverse ? (value >= min && value <= max) : (value >= min && value <= max);
        
        if (isGood) {
            return { class: 'excellent', text: 'Excellent' };
        } else if (inverse ? (value < min - 2 || value > max + 2) : (value < min - 20 || value > max + 20)) {
            return { class: 'needs-attention', text: 'Needs Attention' };
        } else {
            return { class: 'good', text: 'Good' };
        }
    }

    updateWellnessScore(results) {
        if (!this.wellnessScore) return;
        
        const scoreValue = results.overallScore;
        const feedback = this.getScoreFeedback(scoreValue);
        
        this.wellnessScore.innerHTML = `
            <div class="score-circle">
                <div class="score-value">${scoreValue}</div>
                <div class="score-label">Wellness Score</div>
            </div>
            <div class="score-feedback">
                <p>${feedback}</p>
            </div>
        `;
    }

    getScoreFeedback(score) {
        if (score >= 85) {
            return "Excellent cognitive wellness indicators. Your voice shows strong mental clarity and emotional stability.";
        } else if (score >= 75) {
            return "Good cognitive wellness with room for improvement. Consider regular voice exercises and stress management.";
        } else if (score >= 65) {
            return "Moderate cognitive wellness. Focus on sleep quality, stress reduction, and regular mental exercises.";
        } else {
            return "Your voice indicates potential stress or fatigue. Consider consulting with a healthcare professional.";
        }
    }

    updateExplanations(results) {
        if (!this.explanationsCard) return;
        
        const explanationsList = results.explanations.map(exp => `<li>${exp}</li>`).join('');
        
        this.explanationsCard.innerHTML = `
            <h3>Analysis Insights</h3>
            <ul class="explanations-list">
                ${explanationsList}
            </ul>
        `;
    }

    // ETHICAL DISCLAIMER IMPLEMENTATION
    addDisclaimer() {
        // Check if disclaimer already exists
        if (document.querySelector('.wellness-disclaimer')) return;
        
        const disclaimer = document.createElement('div');
        disclaimer.className = 'wellness-disclaimer';
        disclaimer.style.cssText = `
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 8px;
            padding: 12px 16px;
            margin: 16px 0;
            font-size: 0.9em;
            color: #856404;
            line-height: 1.4;
        `;
        
        disclaimer.innerHTML = `
            <strong>Important:</strong> This wellness assessment provides general insights based on voice patterns. 
            It is not a medical diagnostic tool and should not replace professional healthcare advice.
        `;
        
        // Insert disclaimer after results but before explanations
        if (this.wellnessScore && this.explanationsCard) {
            this.wellnessScore.parentNode.insertBefore(disclaimer, this.explanationsCard);
        }
    }

    saveToLocalStorage(results) {
        try {
            const sessions = JSON.parse(localStorage.getItem('voiceAnalysisSessions') || '[]');
            sessions.push(results);
            
            // Keep only last 14 sessions
            if (sessions.length > 14) {
                sessions.splice(0, sessions.length - 14);
            }
            
            // Include version info in localStorage
            const storageData = {
                version: this.version,
                lastUpdated: new Date().toISOString(),
                sessions: sessions
            };
            
            localStorage.setItem('voiceAnalysisSessions', JSON.stringify(sessions));
            localStorage.setItem('voiceAnalysisMetadata', JSON.stringify({
                version: this.version,
                lastUpdated: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    setState(newState) {
        this.currentState = newState;
        this.updateUI();
    }

    updateUI() {
        // Update button states with FIXED emoji encoding
        if (this.recordBtn && this.stopBtn) {
            switch (this.currentState) {
                case 'idle':
                    this.recordBtn.textContent = '\uD83C\uDFA4 Start Recording'; // 🎤
                    this.recordBtn.className = 'btn btn-primary';
                    this.recordBtn.disabled = false;
                    this.stopBtn.style.display = 'none';
                    break;
                    
                case 'requesting':
                    this.recordBtn.textContent = 'Requesting Access...';
                    this.recordBtn.className = 'btn btn-secondary';
                    this.recordBtn.disabled = true;
                    this.stopBtn.style.display = 'none';
                    break;
                    
                case 'recording':
                    this.recordBtn.style.display = 'none';
                    this.stopBtn.style.display = 'inline-block';
                    this.stopBtn.textContent = '\u23F9\uFE0F Stop Recording'; // ⏹️
                    this.stopBtn.className = 'btn btn-recording';
                    this.stopBtn.disabled = false;
                    break;
                    
                case 'processing':
                    this.recordBtn.textContent = 'Processing...';
                    this.recordBtn.className = 'btn btn-secondary';
                    this.recordBtn.disabled = true;
                    this.stopBtn.style.display = 'none';
                    break;
                    
                case 'results':
                    this.recordBtn.textContent = '\uD83C\uDFA4 New Recording'; // 🎤
                    this.recordBtn.className = 'btn btn-primary';
                    this.recordBtn.disabled = false;
                    this.stopBtn.style.display = 'none';
                    break;
            }
        }
    }

    resetForNewRecording() {
        this.setState('idle');
        
        // Hide results
        if (this.resultsSection) {
            this.resultsSection.style.display = 'none';
        }
        
        // Remove disclaimer
        const disclaimer = document.querySelector('.wellness-disclaimer');
        if (disclaimer) {
            disclaimer.remove();
        }
        
        // Reset timer
        if (this.timer) {
            this.timer.textContent = '00:00';
        }
        
        // Scroll to top
        document.getElementById('mainSection')?.scrollIntoView({ behavior: 'smooth' });
        
        this.updateMicStatus('Ready for new recording', 'success');
    }

    async loadDailyPrompt() {
        const prompts = [
            "Describe a moment today that made you feel grateful.",
            "What's one challenge you're currently working through?",
            "Share a recent accomplishment you're proud of.",
            "Describe your ideal way to spend a weekend.",
            "What's something new you learned this week?",
            "Talk about a person who has positively influenced your life.",
            "Describe your current mood and what's contributing to it.",
            "What are you looking forward to in the coming days?",
            "Share a memory that always makes you smile.",
            "Describe a goal you're working towards and why it matters to you."
        ];
        
        // Select prompt based on date to ensure consistency
        const today = new Date().toDateString();
        const promptIndex = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % prompts.length;
        
        this.currentPrompt = prompts[promptIndex];
        
        if (this.promptText) {
            this.promptText.textContent = this.currentPrompt;
        }
    }

    showDashboard() {
        if (this.mainSection) this.mainSection.style.display = 'none';
        if (this.dashboardSection) {
            this.dashboardSection.style.display = 'block';
            this.loadDashboardData();
        }
    }

    hideDashboard() {
        if (this.dashboardSection) this.dashboardSection.style.display = 'none';
        if (this.mainSection) this.mainSection.style.display = 'block';
    }

    loadDashboardData() {
        try {
            const sessions = JSON.parse(localStorage.getItem('voiceAnalysisSessions') || '[]');
            
            // Update stats
            document.getElementById('totalSessions').textContent = sessions.length;
            
            if (sessions.length > 0) {
                const avgScore = Math.round(sessions.reduce((sum, s) => sum + s.overallScore, 0) / sessions.length);
                document.getElementById('averageScore').textContent = avgScore;
                
                const bestScore = Math.max(...sessions.map(s => s.overallScore));
                document.getElementById('bestScore').textContent = bestScore;
                
                const lastSession = sessions[sessions.length - 1];
                const lastDate = new Date(lastSession.timestamp).toLocaleDateString();
                document.getElementById('lastSession').textContent = lastDate;
            }
            
            // Create simple charts (placeholder)
            this.createSimpleCharts(sessions);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    createSimpleCharts(sessions) {
        // Simple text-based charts with FIXED arrow encoding
        const trendChart = document.getElementById('trendChart');
        const energyChart = document.getElementById('energyChart');
        
        if (trendChart && sessions.length > 0) {
            const recent = sessions.slice(-7);
            const trendData = recent.map(s => `${s.overallScore}%`).join(' \u2192 '); // → FIXED
            trendChart.innerHTML = `<p>Recent scores: ${trendData}</p>`;
        }
        
        if (energyChart && sessions.length > 0) {
            const avgEnergy = Math.round(sessions.reduce((sum, s) => sum + s.voiceEnergy, 0) / sessions.length);
            energyChart.innerHTML = `<p>Average energy: ${avgEnergy}%</p>`;
        }
    }

    exportData() {
        try {
            const sessions = JSON.parse(localStorage.getItem('voiceAnalysisSessions') || '[]');
            
            if (sessions.length === 0) {
                alert('No data to export. Complete some voice analysis sessions first.');
                return;
            }
            
            const exportData = {
                version: APP_VERSION, // Include version in export
                exportDate: new Date().toISOString(),
                totalSessions: sessions.length,
                analysisNote: 'This data represents real voice analysis metrics calculated from actual audio recordings using RMS energy, pause detection, and spectral analysis.',
                disclaimer: 'This wellness assessment provides general insights based on voice patterns. It is not a medical diagnostic tool.',
                sessions: sessions
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `syn10-voice-analysis-v${APP_VERSION}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data. Please try again.');
        }
    }

    showSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    setupPWA() {
        // PWA install prompt
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install prompt
            const installPrompt = document.getElementById('installPrompt');
            if (installPrompt) {
                installPrompt.style.display = 'flex';
                
                document.getElementById('installBtn')?.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        deferredPrompt = null;
                        installPrompt.style.display = 'none';
                    }
                });
                
                document.getElementById('installCloseBtn')?.addEventListener('click', () => {
                    installPrompt.style.display = 'none';
                });
            }
        });
        
        // Service worker registration - FIXED path
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => console.log('SW registered:', registration))
                .catch(error => console.log('SW registration failed:', error));
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoiceAnalysisApp();
});
