class ChatManager {
    constructor() {
        this.sessionId = 'session_' + Date.now();
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            const sendBtn = document.getElementById('send-btn');
            const input = document.getElementById('message-input');
            
            if (sendBtn && input) {
                sendBtn.addEventListener('click', () => this.sendMessage());
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
            }
        });
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        input.value = '';
        
        // Show typing
        this.showTyping();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId
                })
            });
            
            const data = await response.json();
            
            // Remove typing and show response
            this.removeTyping();
            this.addMessage(data.response || 'No response', 'bot');
            
        } catch (error) {
            this.removeTyping();
            this.addMessage('Error: Could not connect', 'bot');
        }
    }

    addMessage(text, sender) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = text;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        content.appendChild(textDiv);
        content.appendChild(time);
        msgDiv.appendChild(avatar);
        msgDiv.appendChild(content);
        
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    showTyping() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        const typing = document.createElement('div');
        typing.className = 'message bot typing';
        typing.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
        
        typing.appendChild(avatar);
        typing.appendChild(content);
        
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    }

    removeTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.chat = new ChatManager();
});
