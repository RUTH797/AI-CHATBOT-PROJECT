My RAG Chatbot Project

This is my bootcamp project - a chatbot that can answer questions about your documents.

>>What it does
- Users can sign up and log in
- Upload PDFs or text files
- Ask questions and get answers based on those files
- Chat history is saved
- Admin panel to manage documents

>>> How I built it
- Backend: FastAPI (my first time using it)
- Database: SQLite + ChromaDB for vector search
- Frontend: Just HTML, CSS, and vanilla JS (no frameworks)
- Auth: JWT tokens (learned about these during the project)
  
>>> What was tricky
The RAG part took me a while to figure out. Had to learn about embeddings and chunk sizes. Settled on 1000-character chunks with 200 overlap - seems to work well.

>>> What I'd add next
If I had more time, I'd add Google login, make the chat responses stream in real-time, and deploy it somewhere.

>>> Run it yourself
1. `pip install -r requirements.txt`
2. `python app/main.py`
3. Open http://localhost:8000
4. Login with demo/demo123

>>> Screenshots

<img width="592" height="692" alt="landing page for chat bot" src="https://github.com/user-attachments/assets/dbd564f8-1642-4b5f-956c-f68615de197f" />
