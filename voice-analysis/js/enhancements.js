/**
 * Advanced Enhancements for SYN10 Voice Analysis
 * Additional features to make the platform market-leading
 */

class VoiceAnalysisEnhancements {
    constructor() {
        this.insights = [];
        this.streakCounter = 0;
        this.achievements = [];
        this.initializeEnhancements();
    }

    /**
     * Initialize all enhancements
     */
    initializeEnhancements() {
        this.loadUserStreak();
        this.loadAchievements();
        this.addAdvancedInsights();
        this.setupProgressiveWebApp();
        this.addKeyboardShortcuts();
        this.setupDataExport();
        this.addAccessibilityFeatures();
    }

    /**
     * Load user streak data
     */
    loadUserStreak() {
        const lastSession = localStorage.getItem('syn10_last_session_date');
        const today = new Date().toDateString();
        
        if (lastSession === today) {
            // Already recorded today
            return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastSession === yesterday.toDateString()) {
            // Continuing streak
            this.streakCounter = parseInt(localStorage.getItem('syn10_streak_count') || '0') + 1;
        } else {
            // Streak broken or new user
            this.streakCounter = 1;
        }
        
        localStorage.setItem('syn10_streak_count', this.streakCounter.toString());
        localStorage.setItem('syn10_last_session_date', today);
        
        this.showStreakNotification();
    }

    /**
     * Show streak notification
     */
    showStreakNotification() {
        if (this.streakCounter <= 1) return;
        
        const notification = document.createElement('div');
        notification.className = 'streak-notification';
        notification.innerHTML = `
            <div class="streak-content">
                <span class="streak-icon">🔥</span>
                <span class="streak-text">${this.streakCounter} Day Streak!</span>
                <span class="streak-message">Keep up the great work!</span>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .streak-notification {
                position: fixed;
                top: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #FF6B35, #F7931E);
                color: white;
                padding: 20px 30px;
                border-radius: 25px;
                box-shadow: 0 15px 40px rgba(255, 107, 53, 0.4);
                z-index: 2000;
                animation: streakBounce 0.6s ease;
                text-align: center;
            }
            
            .streak-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }
            
            .streak-icon {
                font-size: 32px;
                animation: flame 1s ease-in-out infinite alternate;
            }
            
            .streak-text {
                font-weight: 800;
                font-size: 18px;
            }
            
            .streak-message {
                font-size: 14px;
                opacity: 0.9;
            }
            
            @keyframes streakBounce {
                0% { transform: translateX(-50%) translateY(-100px) scale(0.8); opacity: 0; }
                50% { transform: translateX(-50%) translateY(10px) scale(1.1); }
                100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
            }
            
            @keyframes flame {
                0% { transform: scale(1) rotate(-2deg); }
                100% { transform: scale(1.1) rotate(2deg); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    /**
     * Load and manage achievements
     */
    loadAchievements() {
        const sessions = JSON.parse(localStorage.getItem('syn10_voice_sessions') || '[]');
        const existingAchievements = JSON.parse(localStorage.getItem('syn10_achievements') || '[]');
        
        const newAchievements = [];
        
        // First Session Achievement
        if (sessions.length >= 1 && !existingAchievements.includes('first_session')) {
            newAchievements.push({
                id: 'first_session',
                title: 'First Steps',
                description: 'Completed your first voice analysis',
                icon: '🎯',
                date: new Date().toISOString()
            });
        }
        
        // Weekly Warrior Achievement
        if (sessions.length >= 7 && !existingAchievements.includes('weekly_warrior')) {
            newAchievements.push({
                id: 'weekly_warrior',
                title: 'Weekly Warrior',
                description: 'Completed 7 voice analysis sessions',
                icon: '⚡',
                date: new Date().toISOString()
            });
        }
        
        // High Score Achievement
        const highScores = sessions.filter(s => s.results.overallScore >= 85);
        if (highScores.length >= 1 && !existingAchievements.includes('high_scorer')) {
            newAchievements.push({
                id: 'high_scorer',
                title: 'Excellence Achieved',
                description: 'Scored 85+ on voice analysis',
                icon: '🌟',
                date: new Date().toISOString()
            });
        }
        
        // Streak Master Achievement
        if (this.streakCounter >= 7 && !existingAchievements.includes('streak_master')) {
            newAchievements.push({
                id: 'streak_master',
                title: 'Streak Master',
                description: '7-day consistency streak',
                icon: '🔥',
                date: new Date().toISOString()
            });
        }
        
        // Show new achievements
        newAchievements.forEach(achievement => {
            this.showAchievementUnlocked(achievement);
            existingAchievements.push(achievement.id);
        });
        
        // Save updated achievements
        localStorage.setItem('syn10_achievements', JSON.stringify(existingAchievements));
    }

    /**
     * Show achievement unlocked notification
     */
    showAchievementUnlocked(achievement) {
        setTimeout(() => {
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-content">
                    <div class="achievement-header">
                        <span class="achievement-badge">🏆</span>
                        <span class="achievement-label">Achievement Unlocked!</span>
                    </div>
                    <div class="achievement-details">
                        <span class="achievement-icon">${achievement.icon}</span>
                        <div class="achievement-text">
                            <div class="achievement-title">${achievement.title}</div>
                            <div class="achievement-desc">${achievement.description}</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .achievement-notification {
                    position: fixed;
                    bottom: 100px;
                    right: 30px;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: #1a1a1a;
                    padding: 20px;
                    border-radius: 20px;
                    box-shadow: 0 15px 40px rgba(255, 215, 0, 0.4);
                    z-index: 2000;
                    animation: achievementSlide 0.8s ease;
                    max-width: 300px;
                }
                
                .achievement-content {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .achievement-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .achievement-badge {
                    font-size: 20px;
                }
                
                .achievement-label {
                    font-weight: 700;
                    font-size: 14px;
                }
                
                .achievement-details {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .achievement-icon {
                    font-size: 32px;
                }
                
                .achievement-title {
                    font-weight: 800;
                    font-size: 16px;
                    margin-bottom: 2px;
                }
                
                .achievement-desc {
                    font-size: 12px;
                    opacity: 0.8;
                }
                
                @keyframes achievementSlide {
                    0% { transform: translateX(100%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
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
        }, 1000); // Delay to avoid overlapping with other notifications
    }

    /**
     * Add advanced insights based on user data
     */
    addAdvancedInsights() {
        const sessions = JSON.parse(localStorage.getItem('syn10_voice_sessions') || '[]');
        if (sessions.length < 3) return;
        
        // Analyze trends
        const recentSessions = sessions.slice(-7);
        const trends = this.analyzeTrends(recentSessions);
        
        // Add insights to results page
        this.addInsightsToResults(trends);
    }

    /**
     * Analyze trends in user data
     */
    analyzeTrends(sessions) {
        const trends = {
            speechRate: this.calculateTrend(sessions.map(s => s.results.speechRate)),
            energy: this.calculateTrend(sessions.map(s => s.results.voiceEnergy)),
            overall: this.calculateTrend(sessions.map(s => s.results.overallScore))
        };
        
        return trends;
    }

    /**
     * Calculate trend direction
     */
    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        
        const first = values.slice(0, Math.ceil(values.length / 2));
        const second = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = first.reduce((a, b) => a + b) / first.length;
        const secondAvg = second.reduce((a, b) => a + b) / second.length;
        
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        if (change > 5) return 'improving';
        if (change < -5) return 'declining';
        return 'stable';
    }

    /**
     * Setup Progressive Web App features
     */
    setupProgressiveWebApp() {
        // Add to home screen prompt
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPrompt(deferredPrompt);
        });
    }

    /**
     * Show install prompt
     */
    showInstallPrompt(deferredPrompt) {
        const installBanner = document.createElement('div');
        installBanner.className = 'install-banner';
        installBanner.innerHTML = `
            <div class="install-content">
                <span class="install-icon">📱</span>
                <span class="install-text">Install SYN10 for the best experience</span>
                <button class="install-btn" id="installBtn">Install</button>
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
        
        // Handle install button click
        document.getElementById('installBtn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to install prompt: ${outcome}`);
                deferredPrompt = null;
            }
            installBanner.remove();
        });
        
        // Handle close button
        document.getElementById('installClose').addEventListener('click', () => {
            installBanner.remove();
        });
    }

    /**
     * Add keyboard shortcuts
     */
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Space bar to start/stop recording
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                const recordBtn = document.getElementById('recordBtn');
                const stopBtn = document.getElementById('stopBtn');
                
                if (recordBtn && !recordBtn.disabled) {
                    recordBtn.click();
                } else if (stopBtn && !stopBtn.disabled) {
                    stopBtn.click();
                }
            }
            
            // 'D' key for dashboard
            if (e.key === 'd' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (window.syn10App) {
                    window.syn10App.showSection('dashboard');
                }
            }
            
            // 'R' key for new recording
            if (e.key === 'r' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (window.syn10App) {
                    window.syn10App.showSection('voice-recording');
                }
            }
        });
        
        // Show keyboard shortcuts help
        this.addKeyboardShortcutsHelp();
    }

    /**
     * Add keyboard shortcuts help
     */
    addKeyboardShortcutsHelp() {
        const helpIcon = document.createElement('div');
        helpIcon.className = 'keyboard-help-icon';
        helpIcon.innerHTML = '⌨️';
        helpIcon.title = 'Keyboard Shortcuts';
        
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-help-icon {
                position: fixed;
                bottom: 100px;
                left: 30px;
                width: 50px;
                height: 50px;
                background: rgba(67, 230, 214, 0.1);
                border: 2px solid rgba(67, 230, 214, 0.3);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.3s;
                z-index: 100;
            }
            
            .keyboard-help-icon:hover {
                background: rgba(67, 230, 214, 0.2);
                border-color: rgba(67, 230, 214, 0.5);
                transform: scale(1.1);
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(helpIcon);
        
        helpIcon.addEventListener('click', () => {
            this.showKeyboardShortcuts();
        });
    }

    /**
     * Show keyboard shortcuts modal
     */
    showKeyboardShortcuts() {
        const modal = document.createElement('div');
        modal.className = 'shortcuts-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⌨️ Keyboard Shortcuts</h3>
                    <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <kbd>Space</kbd>
                            <span>Start/Stop Recording</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>D</kbd>
                            <span>Go to Dashboard</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>R</kbd>
                            <span>New Recording</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd>
                            <span>Toggle Demo Mode</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .shortcuts-modal {
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
            
            .shortcuts-modal .modal-content {
                background: #071B1A;
                border: 2px solid rgba(67, 230, 214, 0.3);
                border-radius: 20px;
                max-width: 400px;
                width: 90%;
            }
            
            .shortcuts-modal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid rgba(67, 230, 214, 0.2);
            }
            
            .shortcuts-modal .modal-header h3 {
                color: #43E6D6;
                margin: 0;
            }
            
            .shortcuts-modal .modal-close {
                background: none;
                border: none;
                color: #43E6D6;
                font-size: 24px;
                cursor: pointer;
            }
            
            .shortcuts-modal .modal-body {
                padding: 20px;
            }
            
            .shortcut-list {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .shortcut-item {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .shortcut-item kbd {
                background: rgba(67, 230, 214, 0.2);
                color: #43E6D6;
                padding: 5px 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                border: 1px solid rgba(67, 230, 214, 0.3);
            }
            
            .shortcut-item span {
                color: #E8F4F3;
                flex: 1;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
    }

    /**
     * Setup data export functionality
     */
    setupDataExport() {
        // Add export button to dashboard when it's shown
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const dashboard = document.getElementById('dashboard');
                    if (dashboard && dashboard.classList.contains('active')) {
                        this.addExportButton();
                    }
                }
            });
        });
        
        observer.observe(document.body, { 
            attributes: true, 
            subtree: true, 
            attributeFilter: ['class'] 
        });
    }

    /**
     * Add export button to dashboard
     */
    addExportButton() {
        const dashboard = document.getElementById('dashboard');
        if (!dashboard || dashboard.querySelector('.export-btn')) return;
        
        const exportBtn = document.createElement('button');
        exportBtn.className = 'export-btn';
        exportBtn.innerHTML = '📊 Export Data';
        exportBtn.addEventListener('click', () => this.exportUserData());
        
        // Add to dashboard header
        const sectionContainer = dashboard.querySelector('.section-container');
        if (sectionContainer) {
            const subtitle = sectionContainer.querySelector('.section-subtitle');
            if (subtitle) {
                subtitle.insertAdjacentElement('afterend', exportBtn);
            }
        }
        
        // Add export button styles
        const style = document.createElement('style');
        style.textContent = `
            .export-btn {
                background: linear-gradient(135deg, #43E6D6, #00FFA3);
                color: #000814;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                font-weight: 600;
                cursor: pointer;
                margin: 20px 0;
                transition: all 0.3s;
            }
            
            .export-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(67, 230, 214, 0.3);
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Export user data
     */
    exportUserData() {
        const sessions = JSON.parse(localStorage.getItem('syn10_voice_sessions') || '[]');
        const achievements = JSON.parse(localStorage.getItem('syn10_achievements') || '[]');
        const streak = localStorage.getItem('syn10_streak_count') || '0';
        
        const exportData = {
            exportDate: new Date().toISOString(),
            platform: 'SYN10 Voice Analysis',
            version: '1.0.0',
            totalSessions: sessions.length,
            currentStreak: parseInt(streak),
            achievements: achievements,
            sessions: sessions.map(session => ({
                date: session.timestamp,
                speechRate: session.results.speechRate,
                pauseFrequency: session.results.pauseFrequency,
                pitchVariance: session.results.pitchVariance,
                voiceEnergy: session.results.voiceEnergy,
                overallScore: session.results.overallScore,
                feedback: session.feedback
            }))
        };
        
        // Create and download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `syn10-voice-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        if (window.syn10App) {
            window.syn10App.showSuccess('Data exported successfully!');
        }
    }

    /**
     * Add accessibility features
     */
    addAccessibilityFeatures() {
        // Add skip navigation link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #43E6D6;
            color: #000814;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1000;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add main content landmark
        const mainSection = document.querySelector('.main-section');
        if (mainSection) {
            mainSection.id = 'main-content';
            mainSection.setAttribute('role', 'main');
        }
        
        // Add ARIA labels to interactive elements
        this.addAriaLabels();
    }

    /**
     * Add ARIA labels for accessibility
     */
    addAriaLabels() {
        // Add labels to buttons
        const recordBtn = document.getElementById('recordBtn');
        if (recordBtn) {
            recordBtn.setAttribute('aria-label', 'Start voice recording');
        }
        
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.setAttribute('aria-label', 'Stop voice recording');
        }
        
        // Add labels to navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const text = link.textContent.trim();
            link.setAttribute('aria-label', `Navigate to ${text}`);
        });
        
        // Add live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        `;
        
        document.body.appendChild(liveRegion);
        window.ariaLiveRegion = liveRegion;
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        if (window.ariaLiveRegion) {
            window.ariaLiveRegion.textContent = message;
            setTimeout(() => {
                window.ariaLiveRegion.textContent = '';
            }, 1000);
        }
    }
}

// Initialize enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.voiceEnhancements = new VoiceAnalysisEnhancements();
});
