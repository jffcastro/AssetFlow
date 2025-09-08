/**
 * AssetFlow Theme Switcher
 * Handles switching between glass theme and dark theme
 */

class ThemeSwitcher {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'glass';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
        this.bindEvents();
    }

    getStoredTheme() {
        return localStorage.getItem('assetflow-theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('assetflow-theme', theme);
    }

    applyTheme(theme) {
        const body = document.body;
        const existingThemeLink = document.getElementById('theme-stylesheet');
        
        // Remove existing theme stylesheet
        if (existingThemeLink) {
            existingThemeLink.remove();
        }

        // Add new theme stylesheet
        const themeLink = document.createElement('link');
        themeLink.id = 'theme-stylesheet';
        themeLink.rel = 'stylesheet';
        themeLink.href = theme === 'dark' ? 'css/dark-theme.css' : 'css/glass-theme.css';
        document.head.appendChild(themeLink);

        // Update body class for theme-specific styling
        body.classList.remove('glass-theme', 'dark-theme');
        body.classList.add(`${theme}-theme`);

        // Update theme toggle button icon
        this.updateThemeToggleIcon(theme);

        // Store the current theme
        this.setStoredTheme(theme);
        this.currentTheme = theme;
    }

    createThemeToggle() {
        // Check if toggle already exists
        if (document.getElementById('theme-toggle')) {
            return;
        }

        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle';
        toggle.className = 'theme-toggle';
        toggle.title = `Switch to ${this.currentTheme === 'glass' ? 'dark' : 'glass'} theme`;
        toggle.innerHTML = this.getThemeIcon(this.currentTheme);

        // Find the header and add the toggle
        const header = document.querySelector('header');
        if (header) {
            // Try to find a good spot in the header
            const headerContent = header.querySelector('.flex');
            if (headerContent) {
                // Add to the right side of the header
                const rightSide = headerContent.querySelector('.flex.items-center.space-x-1');
                if (rightSide) {
                    rightSide.insertBefore(toggle, rightSide.firstChild);
                } else {
                    // Create a container for the toggle
                    const toggleContainer = document.createElement('div');
                    toggleContainer.className = 'flex items-center space-x-1';
                    toggleContainer.appendChild(toggle);
                    headerContent.appendChild(toggleContainer);
                }
            }
        }
    }

    getThemeIcon(theme) {
        if (theme === 'dark') {
            return `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
            `;
        } else {
            return `
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
            `;
        }
    }

    updateThemeToggleIcon(theme) {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.innerHTML = this.getThemeIcon(theme);
            toggle.title = `Switch to ${theme === 'glass' ? 'dark' : 'glass'} theme`;
        }
    }

    bindEvents() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'glass' ? 'dark' : 'glass';
        this.applyTheme(newTheme);
        
        // Add a smooth transition effect
        document.body.style.transition = 'background 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    // Public method to get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Public method to set theme programmatically
    setTheme(theme) {
        if (theme === 'glass' || theme === 'dark') {
            this.applyTheme(theme);
        }
    }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSwitcher;
}
