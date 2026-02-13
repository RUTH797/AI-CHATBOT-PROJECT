// MAIN.JS - SIMPLE VERSION
console.log('✅ Main.js loaded');

// Make sure authManager exists
window.authManager = window.authManager || {
    isLoggedIn: function() { 
        return !!localStorage.getItem('user'); 
    },
    getUser: function() {
        return JSON.parse(localStorage.getItem('user') || '{}');
    },
    showToast: function(msg) {
        alert(msg);
    },
    showLoginModal: function() {
        const modal = document.getElementById('login-modal');
        if (modal) modal.style.display = 'flex';
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded');
    
    // Chat widget toggle
    const chatToggle = document.querySelector('.chat-toggle');
    const chatBody = document.querySelector('.chat-body');
    
    if (chatToggle && chatBody) {
        chatToggle.addEventListener('click', function() {
            const isVisible = chatBody.style.display !== 'none';
            chatBody.style.display = isVisible ? 'none' : 'block';
            chatToggle.innerHTML = isVisible ? 
                '<i class="fas fa-comment"></i>' : 
                '<i class="fas fa-times"></i>';
        });
    }
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Update copyright year
    const footer = document.querySelector('footer p');
    if (footer) {
        footer.innerHTML = `&copy; ${new Date().getFullYear()} AI Chatbot with RAG Technology`;
    }
});