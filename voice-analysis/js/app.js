const APP_VERSION = '1.0.0';

class VoiceAnalysisApp {
    constructor() {
        this.version = APP_VERSION;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.audioData = [];
        this.recordingStartTime = null;
        this.currentPrompt = '';
        this.currentResults = null;
        
        // Real-time analysis data
        this.realTimeData = {
            energyLevels: [],
            silencePeriods: [],
            frequencyData: []
        };
        
        // Analysis settings
        this.analysisInterval = window.innerWidth <= 768 ? 200 : 100;
        this.silenceThreshold = 0.01;
        this.maxRecordingTime = 60000; // 60 seconds
        
        // State management
        this.currentState = 'idle'; // idle, requesting, recording, processing, results
        
        this.init();
    }
    
    init() {
        console.log(`SYN10 Voice Analysis v${this.version} initializing...`);
        
        this.setupElements();
        this.setupEventListeners();
        
        // Load prompt immediately
        setTimeout(() => {
            this.loadDailyPrompt();
        }, 200);
        
        this.checkMicrophonePermission();
        this.setupKeyboardShortcuts();
        this.setupPWA();
        
        console.log(`SYN10 Voice Analysis v${this.version} initialized`);
    }
    
    setupElements() {
        // Main elements
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.timer = document.getElementById('timer');
        this.micStatus = document.getElementById('micStatus');
        
        // FIXED: Correct element IDs
        this.promptText = document.getElementById('dailyPrompt');
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
        if (!this.audioVisualizer) return;
        
        // Create 8 audio bars
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
        console.log('Setting up event listeners...');
        
        // Recording controls with multiple selectors
        this.setupRecordingControls();
        this.setupNavigationControls();
        this.setupResultsControls();
        this.setupPromptControls();
        this.setupModalControls();
        this.setupGenericButtonHandlers();
        
        console.log('All event listeners set up');
    }
    
    setupRecordingControls() {
        // Find record buttons multiple ways
        const recordButtons = [
            document.getElementById('recordBtn'),
            document.querySelector('.btn-primary'),
            ...document.querySelectorAll('button')
        ].filter(btn => btn && (
            btn.textContent.includes('Start Recording') || 
            btn.textContent.includes('🎤') ||
            btn.id === 'recordBtn'
        ));
        
        recordButtons.forEach(btn => {
            if (btn && !btn.hasAttribute('data-listener-added')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Record button clicked');
                    this.startRecording();
                });
                btn.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Stop buttons
        const stopButtons = [
            document.getElementById('stopBtn'),
            document.querySelector('.btn-secondary'),
            ...document.querySelectorAll('button')
        ].filter(btn => btn && (
            btn.textContent.includes('Stop') ||
            btn.textContent.includes('⏹️') ||
            btn.id === 'stopBtn'
        ));
        
        stopButtons.forEach(btn => {
            if (btn && !btn.hasAttribute('data-listener-added')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Stop button clicked');
                    this.stopRecording();
                });
                btn.setAttribute('data-listener-added', 'true');
            }
        });
    }
    
    setupNavigationControls() {
        // Dashboard buttons
        const dashboardButtons = [
            document.getElementById('dashboardBtn'),
            ...document.querySelectorAll('button')
        ].filter(btn => btn && (
            btn.textContent.includes('Dashboard') ||
            btn.id === 'dashboardBtn'
        ));
        
        dashboardButtons.forEach(btn => {
            if (btn && !btn.hasAttribute('data-listener-added')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Dashboard button clicked');
                    this.showDashboard();
                });
                btn.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Settings buttons
        const settingsButtons = [
            document.getElementById('settingsBtn'),
            ...document.querySelectorAll('button')
        ].filter(btn => btn && (
            btn.textContent.includes('Settings') ||
            btn.id === 'settingsBtn'
        ));
        
        settingsButtons.forEach(btn => {
            if (btn && !btn.hasAttribute('data-listener-added')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Settings button clicked');
                    this.showSettings();
                });
                btn.setAttribute('data-listener-added', 'true');
            }
        });
    }
    
    setupResultsControls() {
        // Save Results buttons
        const saveButtons = [
            document.getElementById('saveResultsBtn'),
            ...document.querySelectorAll('button')
        ].filter(btn => btn && (
            btn.textContent.includes('Save Results') ||
            btn.textContent.includes('Save') ||
            btn.id === 'saveResultsBtn'
        ));
        
        saveButtons.forEach(btn => {
            if (btn && !btn.hasAttribute('data-listener-added')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Save Results button clicked');
                    this.saveResults();
                });
                btn.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Record Again buttons
        const recordAgainButtons = [
            document.getElementById('newRecordingBtn'),
            document.getElementById('recordAgainBtn'),
            ...document.querySelectorAll('button')
        ].filter(btn => btn && (
            btn.textContent.includes('Record Again') ||
            btn.textContent.includes('New Recording') ||
            btn.id === 'newRecordingBtn' ||
            btn.id === 'recordAgainBtn'
        ));
        
        recordAgainButtons.forEach(btn => {
            if (btn && !btn.hasAttribute('data-listener-added')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Record Again button clicked');
                    this.resetForNewRecording();
                });
                btn.setAttribute('data-listener-added', 'true');
            }
        });
        
        // Export buttons
        const exportButtons = [
            document.getElementById('exportDataBtn'),
            ...document.querySelectorAll('button')
        ].filter(btn => btn && (
            btn.textContent.includes('Export') ||
            btn.id === 'exportDataBtn'
        ));
        
        exportButtons.forEach(btn => {
            if (btn && !btn.hasAttribute('data-listener-added')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Export Data button clicked');
                    this.exportData();
                });
                btn.setAttribute('data-listener-added', 'true');
            }
        });
    }
    
    setupPromptControls() {
        const promptButtons = [
            document.getElementById('newPromptBtn'),
            ...document.querySelectorAll('button')
        ].filter(btn => btn && (
            btn.textContent.includes('Get New Prompt') ||
            btn.textContent.includes('New Prompt') ||
            btn.id === 'newPromptBtn'
        ));
        
        promptButtons.forEach(btn => {
            if (btn && !btn.hasAttribute('data-listener-added')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('New Prompt button clicked');
                    this.loadDailyPrompt();
                });
                btn.setAttribute('data-listener-added', 'true');
            }
        });
    }
    
    setupModalControls() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target.id === 'settingsModal') {
                    this.closeSettings();
                }
            });
        }
        
        const closeButtons = [
            document.getElementById('closeSettingsBtn'),
            ...document.querySelectorAll('button')
        ].filter(btn => btn && (
            btn.textContent.includes('Close') ||
            btn.id === 'closeSettingsBtn'
        ));
        
        closeButtons.forEach(btn => {
            if (btn && !btn.hasAttribute('data-listener-added')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.closeSettings();
                });
                btn.setAttribute('data-listener-added', 'true');
            }
        });
    }
    
    setupGenericButtonHandlers() {
        document.querySelectorAll('button').forEach(button => {
            if (!button.hasAttribute('data-listener-added')) {
                const text = button.textContent.toLowerCase();
                
                if (text.includes('dashboard')) {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showDashboard();
                    });
                    button.setAttribute('data-listener-added', 'true');
                } else if (text.includes('settings')) {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showSettings();
                    });
                    button.setAttribute('data-listener-added', 'true');
                } else if (text.includes('save')) {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.saveResults();
                    });
                    button.setAttribute('data-listener-added', 'true');
                } else if (text.includes('record again') || text.includes('new recording')) {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.resetForNewRecording();
                    });
                    button.setAttribute('data-listener-added', 'true');
                }
            }
        });
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
            "Describe a goal you're working towards and why it matters to you.",
            "What's a skill you'd like to develop and why?",
            "Tell me about a place that brings you peace.",
            "What's something you're curious about right now?",
            "Describe a recent act of kindness you witnessed or experienced.",
            "What's a tradition or ritual that's meaningful to you?"
        ];
        
        const today = new Date();
        const dateString = today.toDateString();
        const randomSeed = Math.floor(Math.random() * 1000);
        const promptIndex = (dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + randomSeed) % prompts.length;
        
        this.currentPrompt = prompts[promptIndex];
        
        // Update prompt text
        if (this.promptText) {
            this.promptText.textContent = 'Loading new prompt...';
            setTimeout(() => {
                this.promptText.textContent = this.currentPrompt;
                console.log('Prompt updated:', this.currentPrompt);
            }, 500);
        } else {
            const promptElement = document.getElementById('dailyPrompt');
            if (promptElement) {
                promptElement.textContent = 'Loading new prompt...';
                setTimeout(() => {
                    promptElement.textContent = this.currentPrompt;
                }, 500);
            }
        }
    }
    
    async startRecording() {
        console.log('Starting recording...');
        
        this.setState('requesting');
        this.updateMicStatus('Requesting microphone access...', 'warning');
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            });
            
            this.setupAudioAnalysis(stream);
            this.setupMediaRecorder(stream);
            
            this.setState('recording');
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.audioData = [];
            this.realTimeData = {
                energyLevels: [],
                silencePeriods: [],
                frequencyData: []
            };
            
            this.mediaRecorder.start();
            this.startTimer();
            this.startRealTimeAnalysis();
            this.updateMicStatus('Recording... Speak naturally', 'success');
            
            // Auto-stop after 60 seconds
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }, this.maxRecordingTime);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.updateMicStatus('Microphone access denied', 'error');
            this.setState('idle');
            
            // Show demo mode
            this.showDemoMode();
        }
    }
    
    setupAudioAnalysis(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.analyser);
        
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
    }
    
    setupMediaRecorder(stream) {
        this.mediaRecorder = new MediaRecorder(stream);
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioData.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            this.processRecording();
        };
    }
    
    startTimer() {
        let seconds = 0;
        this.timerInterval = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            
            if (this.timer) {
                this.timer.textContent = timeString;
            }
            
            // Update progress circle
            const progress = (seconds / 60) * 100;
            if (this.recordingProgressCircle) {
                this.recordingProgressCircle.style.strokeDasharray = `${progress * 2.51}, 251`;
            }
            
            if (seconds >= 60) {
                this.stopRecording();
            }
        }, 1000);
    }
    
    startRealTimeAnalysis() {
        const analyzeAudio = () => {
            if (!this.isRecording || !this.analyser) return;
            
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate energy level
            const energy = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength / 255;
            this.realTimeData.energyLevels.push(energy);
            
            // Update audio visualizer
            this.updateAudioVisualizer(dataArray);
            
            // Check for silence
            if (energy < this.silenceThreshold) {
                this.realTimeData.silencePeriods.push(Date.now() - this.recordingStartTime);
            }
            
            // Store frequency data
            this.realTimeData.frequencyData.push([...dataArray]);
            
            setTimeout(analyzeAudio, this.analysisInterval);
        };
        
        analyzeAudio();
    }
    
    updateAudioVisualizer(dataArray) {
        if (!this.audioBars || this.audioBars.length === 0) return;
        
        const barCount = this.audioBars.length;
        const dataPerBar = Math.floor(dataArray.length / barCount);
        
        this.audioBars.forEach((bar, index) => {
            const startIndex = index * dataPerBar;
            const endIndex = startIndex + dataPerBar;
            const barData = dataArray.slice(startIndex, endIndex);
            const average = barData.reduce((sum, value) => sum + value, 0) / barData.length;
            
            const height = (average / 255) * 100;
            bar.style.height = `${Math.max(height, 5)}%`;
            
            // Set intensity class
            if (average > 150) {
                bar.dataset.intensity = 'high';
            } else if (average > 75) {
                bar.dataset.intensity = 'medium';
            } else {
                bar.dataset.intensity = 'low';
            }
        });
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        console.log('Stopping recording...');
        this.isRecording = false;
        this.setState('processing');
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Stop all audio tracks
        if (this.mediaRecorder && this.mediaRecorder.stream) {
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        
        this.updateMicStatus('Processing recording...', 'warning');
    }
    
    async processRecording() {
        console.log('Processing recording...');
        
        try {
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const recordingDuration = Date.now() - this.recordingStartTime;
            const results = this.analyzeVoiceData(recordingDuration);
            
            this.currentResults = results;
            this.displayResults(results);
            this.setState('results');
            
        } catch (error) {
            console.error('Error processing recording:', error);
            this.updateMicStatus('Error processing recording', 'error');
            this.setState('idle');
        }
    }
    
    analyzeVoiceData(duration) {
        const energyLevels = this.realTimeData.energyLevels;
        const silencePeriods = this.realTimeData.silencePeriods;
        const frequencyData = this.realTimeData.frequencyData;
        
        // Calculate metrics
        const avgEnergy = energyLevels.reduce((sum, level) => sum + level, 0) / energyLevels.length;
        const energyVariance = this.calculateVariance(energyLevels);
        const silenceRatio = silencePeriods.length / (duration / 1000);
        
        // Voice stability (lower variance = more stable)
        const stability = Math.max(0, 100 - (energyVariance * 1000));
        
        // Clarity based on frequency distribution
        const clarity = this.calculateClarity(frequencyData);
        
        // Pace based on energy changes
        const pace = this.calculatePace(energyLevels);
        
        // Confidence based on overall energy and stability
        const confidence = Math.min(100, (avgEnergy * 100 + stability) / 2);
        
        // Overall wellness score
        const wellnessScore = Math.round((stability + clarity + confidence) / 3);
        
        return {
            stability: Math.round(stability),
            clarity: Math.round(clarity),
            pace: Math.round(pace),
            confidence: Math.round(confidence),
            wellnessScore: wellnessScore,
            duration: Math.round(duration / 1000),
            avgEnergy: Math.round(avgEnergy * 100),
            silenceRatio: Math.round(silenceRatio * 100)
        };
    }
    
    calculateVariance(data) {
        const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
        const squaredDiffs = data.map(value => Math.pow(value - mean, 2));
        return squaredDiffs.reduce((sum, value) => sum + value, 0) / data.length;
    }
    
    calculateClarity(frequencyData) {
        if (frequencyData.length === 0) return 50;
        
        let totalClarity = 0;
        frequencyData.forEach(frame => {
            const lowFreq = frame.slice(0, 10).reduce((sum, val) => sum + val, 0);
            const midFreq = frame.slice(10, 30).reduce((sum, val) => sum + val, 0);
            const highFreq = frame.slice(30, 50).reduce((sum, val) => sum + val, 0);
            
            const total = lowFreq + midFreq + highFreq;
            if (total > 0) {
                const clarity = (midFreq / total) * 100;
                totalClarity += clarity;
            }
        });
        
        return totalClarity / frequencyData.length;
    }
    
    calculatePace(energyLevels) {
        if (energyLevels.length < 2) return 50;
        
        let changes = 0;
        for (let i = 1; i < energyLevels.length; i++) {
            if (Math.abs(energyLevels[i] - energyLevels[i-1]) > 0.1) {
                changes++;
            }
        }
        
        const changeRate = changes / energyLevels.length;
        return Math.min(100, Math.max(0, 50 + (changeRate - 0.3) * 100));
    }
    
    displayResults(results) {
        console.log('Displaying results:', results);
        
        // Hide main section, show results
        if (this.mainSection) this.mainSection.style.display = 'none';
        if (this.resultsSection) this.resultsSection.style.display = 'block';
        
        // Update wellness score
        if (this.wellnessScore) {
            this.wellnessScore.textContent = results.wellnessScore;
        }
        
        // Update metrics
        this.updateMetric('stability', results.stability);
        this.updateMetric('clarity', results.clarity);
        this.updateMetric('pace', results.pace);
        this.updateMetric('confidence', results.confidence);
        
        // Update explanations
        this.updateExplanations(results);
        
        this.updateMicStatus('Analysis complete', 'success');
    }
    
    updateMetric(metricName, value) {
        const metricElement = document.getElementById(`${metricName}Value`);
        const progressElement = document.getElementById(`${metricName}Progress`);
        
        if (metricElement) {
            metricElement.textContent = `${value}%`;
        }
        
        if (progressElement) {
            progressElement.style.width = `${value}%`;
        }
    }
    
    updateExplanations(results) {
        const explanations = {
            stability: this.getStabilityExplanation(results.stability),
            clarity: this.getClarityExplanation(results.clarity),
            pace: this.getPaceExplanation(results.pace),
            confidence: this.getConfidenceExplanation(results.confidence)
        };
        
        Object.entries(explanations).forEach(([metric, explanation]) => {
            const element = document.getElementById(`${metric}Explanation`);
            if (element) {
                element.textContent = explanation;
            }
        });
    }
    
    getStabilityExplanation(value) {
        if (value >= 80) return "Your voice shows excellent stability and control.";
        if (value >= 60) return "Good voice stability with minor fluctuations.";
        if (value >= 40) return "Moderate stability - consider breathing exercises.";
        return "Voice shows some instability - relaxation techniques may help.";
    }
    
    getClarityExplanation(value) {
        if (value >= 80) return "Excellent vocal clarity and articulation.";
        if (value >= 60) return "Good clarity with clear pronunciation.";
        if (value >= 40) return "Moderate clarity - focus on enunciation.";
        return "Consider speaking more slowly and clearly.";
    }
    
    getPaceExplanation(value) {
        if (value >= 80) return "Excellent speaking pace and rhythm.";
        if (value >= 60) return "Good pace with natural flow.";
        if (value >= 40) return "Moderate pace - try to maintain consistency.";
        return "Consider working on speech rhythm and timing.";
    }
    
    getConfidenceExplanation(value) {
        if (value >= 80) return "Your voice projects strong confidence.";
        if (value >= 60) return "Good confidence levels in your speech.";
        if (value >= 40) return "Moderate confidence - practice can help.";
        return "Consider confidence-building exercises.";
    }
    
    resetForNewRecording() {
        console.log('Resetting for new recording...');
        
        this.setState('idle');
        this.currentResults = null;
        this.audioData = [];
        this.realTimeData = {
            energyLevels: [],
            silencePeriods: [],
            frequencyData: []
        };
        
        // Reset UI
        if (this.timer) this.timer.textContent = '00:00';
        if (this.recordingProgressCircle) {
            this.recordingProgressCircle.style.strokeDasharray = '0, 251';
        }
        
        // Reset audio bars
        if (this.audioBars) {
            this.audioBars.forEach(bar => {
                bar.style.height = '5%';
                bar.dataset.intensity = 'low';
            });
        }
        
        // Show main section, hide results
        if (this.mainSection) this.mainSection.style.display = 'block';
        if (this.resultsSection) this.resultsSection.style.display = 'none';
        if (this.dashboardSection) this.dashboardSection.style.display = 'none';
        
        this.updateMicStatus('Ready to record', 'idle');
        
        // Load new prompt
        this.loadDailyPrompt();
    }
    
    saveResults() {
        if (!this.currentResults) {
            console.log('No results to save');
            return;
        }
        
        console.log('Saving results...');
        
        const timestamp = new Date().toISOString();
        const savedData = {
            timestamp,
            prompt: this.currentPrompt,
            results: this.currentResults,
            version: this.version
        };
        
        // Save to localStorage
        const existingData = JSON.parse(localStorage.getItem('voiceAnalysisHistory') || '[]');
        existingData.push(savedData);
        
        // Keep only last 50 recordings
        if (existingData.length > 50) {
            existingData.splice(0, existingData.length - 50);
        }
        
        localStorage.setItem('voiceAnalysisHistory', JSON.stringify(existingData));
        
        // Show success message
        this.showNotification('Results saved successfully!', 'success');
    }
    
    showDashboard() {
        console.log('Showing dashboard...');
        
        // Hide other sections
        if (this.mainSection) this.mainSection.style.display = 'none';
        if (this.resultsSection) this.resultsSection.style.display = 'none';
        
        // Show dashboard
        if (this.dashboardSection) {
            this.dashboardSection.style.display = 'block';
            this.loadDashboardData();
        }
    }
    
    loadDashboardData() {
        const history = JSON.parse(localStorage.getItem('voiceAnalysisHistory') || '[]');
        
        if (history.length === 0) {
            const dashboardContent = document.getElementById('dashboardContent');
            if (dashboardContent) {
                dashboardContent.innerHTML = '<p>No recordings yet. Start your first voice analysis!</p>';
            }
            return;
        }
        
        // Calculate averages
        const avgStability = Math.round(history.reduce((sum, item) => sum + item.results.stability, 0) / history.length);
        const avgClarity = Math.round(history.reduce((sum, item) => sum + item.results.clarity, 0) / history.length);
        const avgConfidence = Math.round(history.reduce((sum, item) => sum + item.results.confidence, 0) / history.length);
        const avgWellness = Math.round(history.reduce((sum, item) => sum + item.results.wellnessScore, 0) / history.length);
        
        // Update dashboard metrics
        this.updateDashboardMetric('avgStability', avgStability);
        this.updateDashboardMetric('avgClarity', avgClarity);
        this.updateDashboardMetric('avgConfidence', avgConfidence);
        this.updateDashboardMetric('avgWellness', avgWellness);
        
        // Show recent recordings
        this.displayRecentRecordings(history.slice(-5).reverse());
    }
    
    updateDashboardMetric(metricId, value) {
        const element = document.getElementById(metricId);
        if (element) {
            element.textContent = `${value}%`;
        }
    }
    
    displayRecentRecordings(recordings) {
        const container = document.getElementById('recentRecordings');
        if (!container) return;
        
        container.innerHTML = recordings.map(recording => {
            const date = new Date(recording.timestamp).toLocaleDateString();
            return `
                <div class="recording-item">
                    <div class="recording-date">${date}</div>
                    <div class="recording-score">Wellness: ${recording.results.wellnessScore}%</div>
                    <div class="recording-prompt">${recording.prompt.substring(0, 50)}...</div>
                </div>
            `;
        }).join('');
    }
    
    showSettings() {
        console.log('Showing settings...');
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'flex';
        }
    }
    
    closeSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    }
    
    exportData() {
        const history = JSON.parse(localStorage.getItem('voiceAnalysisHistory') || '[]');
        
        if (history.length === 0) {
            this.showNotification('No data to export', 'warning');
            return;
        }
        
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `voice-analysis-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Data exported successfully!', 'success');
    }
    
    showDemoMode() {
        console.log('Showing demo mode...');
        
        // Simulate demo recording
        this.setState('recording');
        this.updateMicStatus('Demo mode - Simulating recording...', 'warning');
        
        // Simulate timer
        let seconds = 0;
        const demoTimer = setInterval(() => {
            seconds++;
            if (this.timer) {
                this.timer.textContent = `00:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Simulate audio bars
            if (this.audioBars) {
                this.audioBars.forEach(bar => {
                    const height = Math.random() * 80 + 20;
                    bar.style.height = `${height}%`;
                    bar.dataset.intensity = height > 60 ? 'high' : height > 30 ? 'medium' : 'low';
                });
            }
            
            if (seconds >= 5) {
                clearInterval(demoTimer);
                this.showDemoResults();
            }
        }, 1000);
    }
    
    showDemoResults() {
        const demoResults = {
            stability: 75,
            clarity: 82,
            pace: 68,
            confidence: 79,
            wellnessScore: 76,
            duration: 5,
            avgEnergy: 65,
            silenceRatio: 15
        };
        
        this.currentResults = demoResults;
        this.displayResults(demoResults);
        this.setState('results');
    }
    
    setState(newState) {
        this.currentState = newState;
        console.log(`State changed to: ${newState}`);
        
        // Update UI based on state
        document.body.className = `state-${newState}`;
    }
    
    updateMicStatus(message, type = 'idle') {
        if (this.micStatus) {
            this.micStatus.textContent = message;
            this.micStatus.className = `mic-status ${type}`;
        }
        console.log(`Mic status: ${message} (${type})`);
    }
    
    showNotification(message, type = 'info') {
        console.log(`Notification: ${message} (${type})`);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    checkMicrophonePermission() {
        if (navigator.permissions) {
            navigator.permissions.query({name: 'microphone'}).then(permission => {
                console.log('Microphone permission:', permission.state);
                
                if (permission.state === 'denied') {
                    this.updateMicStatus('Microphone access denied', 'error');
                } else if (permission.state === 'granted') {
                    this.updateMicStatus('Ready to record', 'success');
                } else {
                    this.updateMicStatus('Click to start recording', 'idle');
                }
            });
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (this.currentState === 'idle') {
                    this.startRecording();
                } else if (this.currentState === 'recording') {
                    this.stopRecording();
                }
            }
            
            if (e.key === 'Escape') {
                if (this.currentState === 'recording') {
                    this.stopRecording();
                }
                this.closeSettings();
            }
        });
    }
    
    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/voice-analysis/sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(error => {
                    console.log('SW registration failed:', error);
                });
        }
        
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Show install button
            const installBtn = document.getElementById('installBtn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', () => {
                    this.deferredPrompt.prompt();
                    this.deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the install prompt');
                        }
                        this.deferredPrompt = null;
                    });
                });
            }
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Voice Analysis App...');
    window.voiceApp = new VoiceAnalysisApp();
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.voiceApp) {
            window.voiceApp = new VoiceAnalysisApp();
        }
    });
} else {
    if (!window.voiceApp) {
        window.voiceApp = new VoiceAnalysisApp();
    }
}
