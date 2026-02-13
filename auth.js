class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.checkLogin();
        });
    }

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        // Register button
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showRegisterModal());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
    }

    login() {
        const username = document.getElementById('login-username').value || 'demo';
        const password = document.getElementById('login-password').value || 'demo123';
        
        // DEMO LOGIN - ALWAYS WORKS
        localStorage.setItem('token', 'demo_token_123');
        localStorage.setItem('user', JSON.stringify({
            username: username,
            email: username + '@example.com'
        }));
        
        this.closeModals();
        this.updateUI();
        alert('Login successful!');
        
        // Redirect to chat if on home page
        if (window.location.pathname === '/') {
            window.location.href = '/chat';
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.updateUI();
        window.location.href = '/';
    }

    checkLogin() {
        const user = localStorage.getItem('user');
        if (user) {
            this.updateUI();
        }
    }

    updateUI() {
        const isLoggedIn = !!localStorage.getItem('user');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        const authButtons = document.querySelector('.auth-buttons');
        const userInfo = document.querySelector('.user-info');
        const usernameDisplay = document.getElementById('username-display');
        
        if (authButtons) authButtons.style.display = isLoggedIn ? 'none' : 'flex';
        if (userInfo) userInfo.style.display = isLoggedIn ? 'flex' : 'none';
        if (usernameDisplay && user.username) {
            usernameDisplay.textContent = user.username;
        }
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) modal.style.display = 'flex';
    }

    showRegisterModal() {
        alert('Demo: Use Login with any username/password');
        this.showLoginModal();
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    isLoggedIn() {
        return !!localStorage.getItem('user');
    }

    getToken() {
        return localStorage.getItem('token');
    }
}

// Create global instance
window.auth = new AuthManager();