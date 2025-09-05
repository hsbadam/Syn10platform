// Enhanced SYN10 Voice Analysis Application
class VoiceAnalysisApp {
    constructor() {
        this.audioAnalysis = new EnhancedAudioAnalysis();
        this.currentPrompt = '';
        this.prompts = [
            "Tell me about someone who inspires you and why.",
            "Describe your perfect day from start to finish.",
            "What's a skill you'd like to learn and why?",
            "Share a memory that always makes you smile.",
            "Describe a place where you feel most peaceful.",
            "What advice would you give to your younger self?",
            "Tell me about a book or movie that changed your perspective.",
            "Describe your ideal weekend activities.",
            "What are you most grateful for today?",
            "Share a goal you're working towards and why it matters to you."
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadNewPrompt();
        this.updateDashboard();
        this.checkFirstTimeUser();
        this.setupAccessibility();
    }

    setupEventListeners() {
        // Main recording controls
        const recordBtn = document.getElementById('recordBtn');
        const stopBtn = document.getElementById('stopBtn');
        const newPromptBtn = document.getElementById('newPromptBtn');
        const exportBtn = document.getElementById('exportBtn');
        const deleteDataBtn = document.getElementById('deleteDataBtn');

        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.startRecording());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopRecording());
        }

        if (newPromptBtn) {
            newPromptBtn.addEventListener('click', () => this.loadNewPrompt());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        if (deleteDataBtn) {
            deleteDataBtn.addEventListener('click', () => this.deleteAllData());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.toggleRecording();
            }
            if (e.code === 'KeyD' && e.ctrlKey) {
                e.preventDefault();
                this.showDashboard();
            }
        });

        // Navigation
        const dashboardBtn = document.getElementById('dashboardBtn');
        const settingsBtn = document.getElementById('settingsBtn');

        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', () => this.showDashboard());
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
    }

    async startRecording() {
        try {
            await this.audioAnalysis.startRecording();
            this.showRecordingUI();
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }

    stopRecording() {
        this.audioAnalysis.hardStop();
        this.hideRecordingUI();
        this.updateDashboard();
    }

    toggleRecording() {
        if (this.audioAnalysis.state === 'idle') {
            this.startRecording();
        } else if (this.audioAnalysis.state === 'recording') {
            this.stopRecording();
        }
    }

    loadNewPrompt() {
        const randomIndex = Math.floor(Math.random() * this.prompts.length);
        this.currentPrompt = this.prompts[randomIndex];
        
        const promptElement = document.getElementById('dailyPrompt');
        if (promptElement) {
            promptElement.textContent = this.currentPrompt;
        }
    }

    showRecordingUI() {
        const visualizer = document.getElementById('audioVisualizer');
        const timer = document.getElementById('timer');
        
        if (visualizer) {
            visualizer.style.display = 'flex';
        }
        
        if (timer) {
            timer.style.display = 'block';
        }
    }

    hideRecordingUI() {
        const visualizer = document.getElementById('audioVisualizer');
        
        if (visualizer) {
            visualizer.style.display = 'none';
        }
    }

    updateDashboard() {
        const history = this.getSessionHistory();
        
        // Update session count
        const sessionCountElement = document.getElementById('sessionCount');
        if (sessionCountElement) {
            sessionCountElement.textContent = history.length;
        }

        // Update streak
        const streakElement = document.getElementById('currentStreak');
        if (streakElement) {
            streakElement.textContent = this.calculateStreak(history);
        }

        // Update average score
        const avgScoreElement = document.getElementById('averageScore');
        if (avgScoreElement && history.length > 0) {
            const avgScore = Math.round(
                history.reduce((sum, session) => sum + session.wellnessScore, 0) / history.length
            );
            avgScoreElement.textContent = avgScore;
        }

        // Update charts
        this.updateCharts(history);
    }

    updateCharts(history) {
        if (history.length === 0) return;

        // Update speech rate trend chart
        this.updateTrendChart(history);
        
        // Update energy levels chart
        this.updateEnergyChart(history);
    }

    updateTrendChart(history) {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (history.length < 2) return;

        // Draw trend line
        ctx.strokeStyle = '#43E6D6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const maxScore = Math.max(...history.map(s => s.wellnessScore));
        const minScore = Math.min(...history.map(s => s.wellnessScore));
        const scoreRange = maxScore - minScore || 1;

        history.forEach((session, index) => {
            const x = (index / (history.length - 1)) * width;
            const y = height - ((session.wellnessScore - minScore) / scoreRange) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = '#43E6D6';
        history.forEach((session, index) => {
            const x = (index / (history.length - 1)) * width;
            const y = height - ((session.wellnessScore - minScore) / scoreRange) * height;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    updateEnergyChart(history) {
        const canvas = document.getElementById('energyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const barWidth = width / Math.min(history.length, 7);
        const recentHistory = history.slice(-7);

        recentHistory.forEach((session, index) => {
            const barHeight = (session.voiceEnergy / 100) * height;
            const x = index * barWidth;
            const y = height - barHeight;

            // Gradient fill
            const gradient = ctx.createLinearGradient(0, y, 0, height);
            gradient.addColorStop(0, '#43E6D6');
            gradient.addColorStop(1, '#12B7AA');

            ctx.fillStyle = gradient;
            ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
        });
    }

    calculateStreak(history) {
        if (history.length === 0) return 0;

        let streak = 1;
        const today = new Date().toDateString();
        
        // Check if user recorded today
        const lastSession = new Date(history[history.length - 1].timestamp);
        if (lastSession.toDateString() !== today) return 0;

        // Count consecutive days
        for (let i = history.length - 2; i >= 0; i--) {
            const sessionDate = new Date(history[i].timestamp);
            const expectedDate = new Date(lastSession);
            expectedDate.setDate(expectedDate.getDate() - (history.length - 1 - i));
            
            if (sessionDate.toDateString() === expectedDate.toDateString()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    getSessionHistory() {
        return JSON.parse(localStorage.getItem('syn10_voice') || '[]');
    }

    exportData() {
        this.audioAnalysis.exportData();
        this.showToast('Data exported successfully!', 'success');
    }

    deleteAllData() {
        if (confirm('Are you sure you want to delete all your voice analysis data? This cannot be undone.')) {
            localStorage.removeItem('syn10_voice');
            this.updateDashboard();
            this.showToast('All data deleted', 'info');
        }
    }

    showDashboard() {
        const mainSection = document.getElementById('mainSection');
        const dashboardSection = document.getElementById('dashboardSection');
        
        if (mainSection) mainSection.style.display = 'none';
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
            this.updateDashboard();
        }
    }

    showMainSection() {
        const mainSection = document.getElementById('mainSection');
        const dashboardSection = document.getElementById('dashboardSection');
        
        if (mainSection) mainSection.style.display = 'block';
        if (dashboardSection) dashboardSection.style.display = 'none';
    }

    showSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'flex';
        }
    }

    hideSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    }

    checkFirstTimeUser() {
        const isFirstTime = !localStorage.getItem('syn10_visited');
        if (isFirstTime) {
            this.showWelcomeMessage();
            localStorage.setItem('syn10_visited', 'true');
        }
    }

    showWelcomeMessage() {
        this.showToast('Welcome to SYN10! Your voice data stays private on your device.', 'info', 5000);
    }

    setupAccessibility() {
        // Add aria-live region for screen readers
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.setAttribute('aria-live', 'polite');
        }

        // Add keyboard navigation hints
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.setAttribute('title', 'Press Space to start/stop recording');
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => {
            toast.style.display = 'block';
            toast.style.opacity = '1';
        }, 100);
        
        // Hide toast
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    // Achievement system
    checkAchievements(sessionCount) {
        const achievements = {
            firstRecording: sessionCount === 1,
            weekStreak: this.calculateStreak(this.getSessionHistory()) === 7,
            monthComplete: sessionCount === 30
        };

        if (achievements.firstRecording) {
            this.showAchievement('First Recording! 🎯', 'You\'ve taken the first step towards cognitive wellness.');
        }

        if (achievements.weekStreak) {
            this.showAchievement('7-Day Streak! 🔥', 'Consistent monitoring improves outcomes by 40%.');
        }

        if (achievements.monthComplete) {
            this.showAchievement('30 Sessions Complete! 🏆', 'You\'ve established a strong baseline for cognitive health.');
        }
    }

    showAchievement(title, message) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement-popup';
        achievement.innerHTML = `
            <div class="achievement-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <button onclick="this.parentElement.parentElement.remove()">Continue</button>
            </div>
        `;
        
        document.body.appendChild(achievement);
        
        setTimeout(() => {
            achievement.style.opacity = '1';
        }, 100);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.voiceApp = new VoiceAnalysisApp();
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/voice-analysis/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

