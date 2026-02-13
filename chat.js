console.log('✅ Chat.js loaded');

// Wait for page to fully load
window.addEventListener('load', function() {
    console.log('✅ Page loaded, setting up chat...');
    
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    
    console.log('Send button found:', sendBtn);
    console.log('Input found:', messageInput);
    
    if (!sendBtn || !messageInput) {
        console.error('❌ Chat elements not found!');
        return;
    }
    
    // Send message function
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;
        
        console.log('Sending message:', message);
        
        // Clear input
        messageInput.value = '';
        
        // Add user message
        addMessage(message, 'user');
        
        // Show typing
        showTyping();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    message: message,
                    session_id: 'session_' + Date.now()
                })
            });
            
            const data = await response.json();
            console.log('Response:', data);
            
            removeTyping();
            addMessage(data.response, 'bot');
            
        } catch (error) {
            console.error('Error:', error);
            removeTyping();
            addMessage('Error: Could not connect to server', 'bot');
        }
    }
    
    // Add message to UI
    function addMessage(text, sender) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
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
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    // Typing indicator
    function showTyping() {
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
    
    function removeTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }
    
    // Add event listeners
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    console.log('✅ Chat setup complete!');
});