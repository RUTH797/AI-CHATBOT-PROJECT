console.log('Chat.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    const sendBtn = document.getElementById('send-btn');
    const input = document.getElementById('message-input');
    const messages = document.getElementById('chat-messages');
    
    if (!sendBtn || !input || !messages) {
        console.error('Elements not found');
        return;
    }
    
    console.log('Elements found');
    
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;
        
        // Add user message
        addMessage(text, 'user');
        input.value = '';
        
        // Add typing indicator
        const typingId = addTyping();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: text})
            });
            
            const data = await response.json();
            removeTyping(typingId);
            addMessage(data.response || 'No response', 'bot');
            
        } catch (error) {
            removeTyping(typingId);
            addMessage('Error: Could not connect', 'bot');
        }
    }
    
    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.innerHTML = `
            <div class="avatar">
                <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${text}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }
    
    function addTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.className = 'message bot typing';
        div.id = id;
        div.innerHTML = `
            <div class="avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        return id;
    }
    
    function removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
    
    // Add event listeners
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    console.log('Chat ready');
});

