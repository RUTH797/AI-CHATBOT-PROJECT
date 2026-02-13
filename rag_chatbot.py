from app.config import config, logger

class RAGChatbot:
    def __init__(self):
        logger.info("RAG Chatbot ready")
    
    def generate_response(self, query, context, chat_history=None):
        """Generate intelligent responses"""
        
        # Prepare context
        context_text = ""
        if context:
            context_text = "Based on your documents:\n"
            for i, doc in enumerate(context[:2], 1):
                context_text += f"{i}. {doc['text']}\n"
        
        # Generate response based on query
        query_lower = query.lower()
        
        if "hello" in query_lower or "hi" in query_lower:
            response = "Hello! I'm your AI assistant. I can answer questions about your uploaded documents."
        elif "service" in query_lower:
            response = "Our services include: AI chatbot development, custom software solutions, and consulting."
        elif "price" in query_lower or "cost" in query_lower:
            response = "Pricing starts at $99/month for basic plans. Enterprise solutions are customized."
        elif "contact" in query_lower:
            response = "Contact us at: email@example.com or visit our website."
        elif context_text:
            response = f"{context_text}\nIs there anything specific you'd like to know?"
        else:
            response = f"I understand you're asking about '{query}'. You can upload documents for more specific answers."
        
        return {
            "response": response,
            "tokens_used": len(response.split()),
            "sources": [doc['metadata'] for doc in context[:2]] if context else []
        }

rag_bot = RAGChatbot()