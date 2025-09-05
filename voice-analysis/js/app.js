/**
 * SYN10 Voice Analysis Application
 * Main application controller
 */

class SYN10App {
    constructor() {
        this.currentSection = 'voice-recording';
        this.voiceAnalyzer = null;
        this.recordingTimer = null;
        this.recordingDuration = 0;
        
        this.dailyPrompts = [
            "Describe your ideal way to relax and unwind after a busy day.",
            "What are three things you're grateful for today?",
            "Tell me about a recent accomplishment that made you proud.",
            "Describe your perfect morning routine.",
            "What's something new you learned recently?",
            "Share a memory that always makes you smile.",
            "What are your goals for the rest of this week?",
            "Describe a place where you feel most peaceful.",
            "What's the best advice you've ever received?",
            "Tell me about someone who inspires you and why."
        ];
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.voiceAnalyzer = new VoiceAnalyzer();
        this.setupEventListeners();
        this.loadDailyPrompt();
        this.updateDashboard();
        
        // Show initial section
        this.showSection('voice-recording');
        
        console.log('SYN10 Voice Analysis App initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation
        document.getElementById('dashboardLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('dashboard');
        });

        // Recording controls
        document.getElementById('recordBtn')?.addEventListener('click', () => {
            this.startRecording();
        });

        document.getElementById('stopBtn')?.addEventListener('click', () => {
            this.stopRecording();
        });

        // Prompt controls
        document.getElementById('newPromptBtn')?.addEventListener('click', () => {
            this.loadNewPrompt();
        });

        // Results controls
        document.getElementById('saveResultsBtn')?.addEventListener('click', () => {
            this.saveResults();
        });

        document.getElementById('recordAgainBtn')?.addEventListener('click', () => {
            this.showSection('voice-recording');
        });
    }

    /**
     * Show a specific section
     */
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.main-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        if (sectionId === 'dashboard') {
            document.getElementById('dashboardLink')?.classList.add('active');
            this.updateDashboard();
        }
    }

    /**
     * Load daily prompt
     */
    loadDailyPrompt() {
        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('syn10_prompt_date');
        const savedIndex = localStorage.getItem('syn10_prompt_index');
        
        let promptIndex;
        
        if (savedDate === today && savedIndex !== null) {
            // Use saved prompt for today
            promptIndex = parseInt(savedIndex);
        } else {
            // Generate new prompt for today
            promptIndex = Math.floor(Math.random() * this.dailyPrompts.length);
            localStorage.setItem('syn10_prompt_date', today);
            localStorage.setItem('syn10_prompt_index', promptIndex.toString());
        }
        
        const promptElement = document.getElementById('dailyPrompt');
        if (promptElement) {
            promptElement.textContent = this.dailyPrompts[promptIndex];
        }
    }

    /**
     * Load new prompt
     */
    loadNewPrompt() {
        const currentIndex = parseInt(localStorage.getItem('syn10_prompt_index') || '0');
        const newIndex = (currentIndex + 1) % this.dailyPrompts.length;
        
        localStorage.setItem('syn10_prompt_index', newIndex.toString());
        
        const promptElement = document.getElementById('dailyPrompt');
        if (promptElement) {
            promptElement.textContent = this.dailyPrompts[newIndex];
        }
    }

    /**
     * Start voice recording
     */
    async startRecording() {
        try {
            const recordBtn = document.getElementById('recordBtn');
            const stopBtn = document.getElementById('stopBtn');
            
            // Update UI
            if (recordBtn) {
                recordBtn.disabled = true;
                recordBtn.classList.add('recording');
                recordBtn.querySelector('.btn-text').textContent = 'Recording...';
            }
            
            if (stopBtn) {
                stopBtn.disabled = false;
            }
            
            // Check if demo mode is active
            if (window.demoMode && window.demoMode.isActive()) {
                // Use demo mode
                this.recordingDuration = 0;
                this.recordingTimer = setInterval(() => {
                    this.recordingDuration++;
                    this.updateTimer();
                }, 1000);
                
                // Simulate recording with progress
                await window.demoMode.simulateRecording(
                    (progress) => {
                        // Update visualizer based on progress
                        this.updateDemoVisualizer(progress);
                    },
                    (results) => {
                        // Stop timer and show results
                        if (this.recordingTimer) {
                            clearInterval(this.recordingTimer);
                            this.recordingTimer = null;
                        }
                        this.resetRecordingUI();
                        this.displayResults(results);
                        this.showSection('results');
                    }
                );
            } else {
                // Use real recording
                await this.voiceAnalyzer.startRecording();
                
                // Start timer
                this.recordingDuration = 0;
                this.recordingTimer = setInterval(() => {
                    this.recordingDuration++;
                    this.updateTimer();
                    
                    // Auto-stop at 60 seconds
                    if (this.recordingDuration >= 60) {
                        this.stopRecording();
                    }
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Failed to start recording. Please check your microphone permissions.');
            this.resetRecordingUI();
        }
    }

    /**
     * Stop voice recording
     */
    async stopRecording() {
        try {
            // Stop timer
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }

            // Stop recording and get results
            const results = await this.voiceAnalyzer.stopRecording();
            
            // Reset UI
            this.resetRecordingUI();
            
            // Display results
            this.displayResults(results);
            this.showSection('results');
            
        } catch (error) {
            console.error('Error stopping recording:', error);
            this.showError('Failed to process recording. Please try again.');
            this.resetRecordingUI();
        }
    }

    /**
     * Reset recording UI
     */
    resetRecordingUI() {
        const recordBtn = document.getElementById('recordBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (recordBtn) {
            recordBtn.disabled = false;
            recordBtn.classList.remove('recording');
            recordBtn.querySelector('.btn-text').textContent = 'Start Recording';
        }
        
        if (stopBtn) {
            stopBtn.disabled = true;
        }
        
        // Reset timer
        this.recordingDuration = 0;
        this.updateTimer();
        
        // Reset visualizer
        document.querySelectorAll('.voice-bar').forEach(bar => {
            bar.style.height = '20px';
            bar.classList.remove('active');
        });
    }

    /**
     * Update timer display
     */
    updateTimer() {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            const minutes = Math.floor(this.recordingDuration / 60);
            const seconds = this.recordingDuration % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    /**
     * Update demo visualizer with simulated audio activity
     */
    updateDemoVisualizer(progress) {
        const visualizerBars = document.querySelectorAll('.voice-bar');
        if (!visualizerBars.length) return;
        
        visualizerBars.forEach((bar, index) => {
            // Create realistic audio visualization pattern
            const baseHeight = 20;
            const maxHeight = 60;
            const frequency = (index + 1) * 0.5;
            const amplitude = Math.sin(progress * Math.PI * 4 + frequency) * 0.5 + 0.5;
            const randomVariation = Math.random() * 0.3;
            
            const height = baseHeight + (maxHeight - baseHeight) * amplitude * (0.7 + randomVariation);
            bar.style.height = `${height}px`;
            bar.classList.toggle('active', amplitude > 0.3);
        });
    }

    /**
     * Display analysis results
     */
    displayResults(results) {
        // Update metric values
        document.getElementById('speechRate').textContent = results.speechRate;
        document.getElementById('pauseFreq').textContent = results.pauseFrequency;
        document.getElementById('pitchVar').textContent = results.pitchVariance.toFixed(1);
        document.getElementById('voiceEnergy').textContent = `${results.voiceEnergy}%`;
        document.getElementById('overallScore').textContent = results.overallScore;

        // Update status indicators
        this.updateMetricStatus('speechRateStatus', results.speechRate, [120, 160]);
        this.updateMetricStatus('pauseFreqStatus', results.pauseFrequency, [2, 6], true);
        this.updateMetricStatus('pitchVarStatus', results.pitchVariance, [5, 15]);
        this.updateMetricStatus('voiceEnergyStatus', results.voiceEnergy, [60, 85]);

        // Generate and display feedback
        const feedback = this.generateFeedback(results);
        document.getElementById('scoreFeedback').textContent = feedback;
    }

    /**
     * Update metric status indicator
     */
    updateMetricStatus(elementId, value, range, inverse = false) {
        const element = document.getElementById(elementId);
        if (!element) return;

        let status, text;
        
        if (inverse) {
            // Lower values are better (like pause frequency)
            if (value <= range[0]) {
                status = 'excellent';
                text = 'Excellent';
            } else if (value <= range[1]) {
                status = 'good';
                text = 'Good';
            } else {
                status = 'monitor';
                text = 'Monitor';
            }
        } else {
            // Higher values are better
            if (value >= range[1]) {
                status = 'excellent';
                text = 'Excellent';
            } else if (value >= range[0]) {
                status = 'good';
                text = 'Good';
            } else {
                status = 'monitor';
                text = 'Monitor';
            }
        }

        element.className = `metric-status ${status}`;
        element.textContent = text;
    }

    /**
     * Generate personalized feedback
     */
    generateFeedback(results) {
        const feedback = [];
        
        if (results.speechRate < 120) {
            feedback.push("Your speech rate is slower than average. Consider recording when you feel more energetic.");
        } else if (results.speechRate > 160) {
            feedback.push("Great speech fluency detected!");
        }
        
        if (results.pauseFrequency > 6) {
            feedback.push("Very few pauses detected. Great speech fluency!");
        } else if (results.pauseFrequency < 2) {
            feedback.push("Consider taking natural pauses while speaking.");
        }
        
        if (results.voiceEnergy < 60) {
            feedback.push("Voice energy seems low. Make sure you're in a quiet environment and speaking clearly.");
        } else if (results.voiceEnergy > 85) {
            feedback.push("Excellent voice energy levels.");
        }
        
        if (results.overallScore >= 80) {
            feedback.push("Outstanding cognitive wellness indicators!");
        } else if (results.overallScore >= 70) {
            feedback.push("Good cognitive wellness patterns detected.");
        } else {
            feedback.push("Consider factors like sleep, stress, or time of day that might affect your speech patterns.");
        }
        
        return feedback.join(" ");
    }

    /**
     * Save results
     */
    saveResults() {
        // Get current results
        const results = {
            speechRate: parseInt(document.getElementById('speechRate').textContent),
            pauseFrequency: parseInt(document.getElementById('pauseFreq').textContent),
            pitchVariance: parseFloat(document.getElementById('pitchVar').textContent),
            voiceEnergy: parseInt(document.getElementById('voiceEnergy').textContent.replace('%', '')),
            overallScore: parseInt(document.getElementById('overallScore').textContent)
        };

        const feedback = document.getElementById('scoreFeedback').textContent;

        // Save to local storage
        this.voiceAnalyzer.saveSession(results, feedback);
        
        // Show success message
        this.showSuccess('Results saved successfully!');
        
        // Update dashboard
        this.updateDashboard();
    }

    /**
     * Update dashboard with historical data
     */
    updateDashboard() {
        let historicalData = this.voiceAnalyzer.getHistoricalData();
        
        // If no real data and demo mode is active, use demo data
        if (historicalData.length === 0 && window.demoMode && window.demoMode.isActive()) {
            historicalData = window.demoMode.generateHistoricalData();
        }
        
        if (historicalData.length === 0) {
            this.showEmptyDashboard();
            return;
        }
        
        this.updateWeeklyStats(historicalData);
        this.createCharts(historicalData);
    }

    /**
     * Show empty dashboard state
     */
    showEmptyDashboard() {
        document.getElementById('weeklySessions').textContent = '0';
        document.getElementById('weeklyAverage').textContent = '--';
        document.getElementById('bestDay').textContent = '--';
    }

    /**
     * Update weekly statistics
     */
    updateWeeklyStats(data) {
        const weekData = data.slice(-7);
        
        document.getElementById('weeklySessions').textContent = weekData.length;
        
        if (weekData.length > 0) {
            const avgScore = weekData.reduce((sum, session) => sum + session.results.overallScore, 0) / weekData.length;
            document.getElementById('weeklyAverage').textContent = Math.round(avgScore);
            
            // Find best day
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const bestSession = weekData.reduce((best, session) => 
                session.results.overallScore > best.results.overallScore ? session : best
            );
            const bestDay = new Date(bestSession.timestamp).getDay();
            document.getElementById('bestDay').textContent = dayNames[bestDay];
        }
    }

    /**
     * Create dashboard charts
     */
    createCharts(data) {
        this.createSpeechRateChart(data);
        this.createEnergyChart(data);
    }

    /**
     * Create speech rate trend chart
     */
    createSpeechRateChart(data) {
        const ctx = document.getElementById('speechChart');
        if (!ctx) return;

        const chartData = data.slice(-7).map(session => session.results.speechRate);
        const labels = data.slice(-7).map(session => {
            const date = new Date(session.timestamp);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Speech Rate (WPM)',
                    data: chartData,
                    borderColor: '#43E6D6',
                    backgroundColor: 'rgba(67, 230, 214, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(67, 230, 214, 0.1)'
                        },
                        ticks: {
                            color: '#B8C5C4'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(67, 230, 214, 0.1)'
                        },
                        ticks: {
                            color: '#B8C5C4'
                        }
                    }
                }
            }
        });
    }

    /**
     * Create voice energy chart
     */
    createEnergyChart(data) {
        const ctx = document.getElementById('energyChart');
        if (!ctx) return;

        const chartData = data.slice(-7).map(session => session.results.voiceEnergy);
        const labels = data.slice(-7).map(session => {
            const date = new Date(session.timestamp);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Voice Energy (%)',
                    data: chartData,
                    backgroundColor: 'rgba(67, 230, 214, 0.8)',
                    borderColor: '#43E6D6',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(67, 230, 214, 0.1)'
                        },
                        ticks: {
                            color: '#B8C5C4'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(67, 230, 214, 0.1)'
                        },
                        ticks: {
                            color: '#B8C5C4'
                        }
                    }
                }
            }
        });
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Create and show success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #00FFA3, #43E6D6);
            color: #000814;
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create and show error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #FF6B6B, #FF8E53);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: 600;
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.syn10App = new SYN10App();
});
