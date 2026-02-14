from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import uuid
import shutil
from datetime import datetime

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
if os.path.exists("app/static"):
    app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

# Create uploads folder
os.makedirs("uploads", exist_ok=True)

# Simple storage
chat_history = {}
documents = []
users = {"demo": "demo123"}

#PAGE ROUTES
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

#AUTH ENDPOINTS
@app.post("/api/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    if username in users and users[username] == password:
        return {
            "message": "Login successful",
            "user": {"username": username, "email": f"{username}@example.com"},
            "access_token": "demo_token_123",
            "token_type": "bearer"
        }
    return JSONResponse(
        status_code=401,
        content={"detail": "Invalid credentials"}
    )

@app.post("/api/auth/register")
async def register(username: str = Form(...), password: str = Form(...), email: str = Form(...)):
    if username in users:
        return JSONResponse(
            status_code=400,
            content={"detail": "Username exists"}
        )
    users[username] = password
    return {
        "message": "User created",
        "user": {"username": username, "email": email},
        "access_token": "demo_token_123",
        "token_type": "bearer"
    }

#CHAT ENDPOINT
@app.post("/api/chat")
async def chat_message(request: Request):
    data = await request.json()
    message = data.get("message", "").lower()
    
    # Simple responses
    if "hello" in message or "hi" in message:
        response = "Hello! How can I help you?"
    elif "service" in message:
        response = "We offer AI chatbot development and consulting."
    elif "price" in message or "cost" in message:
        response = "Pricing starts at $99/month."
    elif "document" in message or "file" in message:
        response = "Upload files in the Admin panel."
    else:
        response = f"You said: {message}. How can I assist?"
    
    return {
        "response": response,
        "session_id": data.get("session_id", "test"),
        "suggestions": [],
        "sources": []
    }
    # Check if documents exist
    doc_response = ""
    if documents:
        doc_names = [doc["name"] for doc in documents[-3:]]
        doc_response = f" I see you've uploaded: {', '.join(doc_names)}. "
    
    # Smart responses
    responses = {
        "hello": "Hello! How can I help you today?",
        "hi": "Hi there! What would you like to know?",
        "service": "We offer AI chatbot development, custom software solutions, and consulting services.",
        "price": "Our pricing starts at $99/month for basic plans.",
        "cost": "Our pricing starts at $99/month for basic plans.",
        "contact": "You can reach us at contact@example.com",
        "email": "Our email is contact@example.com",
        "phone": "You can call us at (555) 123-4567.",
        "document": "You can upload PDFs in the Admin panel. I'll answer questions about them!",
        "upload": "Go to the Admin panel to upload documents.",
        "help": "You can ask about services, pricing, contact info, or upload documents.",
        "what documents": f"You have {len(documents)} document(s) uploaded." + doc_response,
        "pdf": "Upload PDFs in the Admin panel.",
        "thank": "You're welcome!",
        "bye": "Goodbye!",
        "name": "I'm your RAG Chatbot assistant!"
    }
    
    response_text = "I understand. Please upload documents or ask about services, pricing, or contact info."
    for key, value in responses.items():
        if key in message:
            response_text = value
            break
    
    # Add document info if asking about them
    if "document" in message or "file" in message or "upload" in message:
        if documents:
            response_text = f"You have {len(documents)} document(s). " + doc_response
        else:
            response_text = "You haven't uploaded any documents yet. Go to Admin panel to upload!"
    
    # Suggested questions
    suggestions = [
        "What services do you offer?",
        "How much does it cost?",
        "What documents do I have?",
        "How do I upload files?",
        "Contact information"
    ]
    
    # Store history
    if session_id not in chat_history:
        chat_history[session_id] = []
    
    chat_history[session_id].append({
        "role": "user",
        "message": message,
        "time": datetime.now().isoformat()
    })
    
    chat_history[session_id].append({
        "role": "bot",
        "message": response_text,
        "time": datetime.now().isoformat()
    })
    
    return {
        "response": response_text,
        "session_id": session_id,
        "suggestions": suggestions[:4],
        "sources": [{"name": doc["name"]} for doc in documents[-2:]] if documents else []
    }

@app.get("/api/chat/history")
async def get_history(session_id: str = None):
    if session_id and session_id in chat_history:
        return {"chats": chat_history[session_id][-20:]}
    return {"chats": []}

#DOCUMENT UPLOAD
@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        if not file.filename:
            return JSONResponse(status_code=400, content={"detail": "No file selected"})
        
        # Save file
        file_id = str(uuid.uuid4())
        file_path = f"uploads/{file_id}_{file.filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Store document info
        doc_info = {
            "id": len(documents) + 1,
            "name": file.filename,
            "size": os.path.getsize(file_path),
            "path": file_path,
            "uploaded_at": datetime.now().isoformat(),
            "chunks": 3
        }
        documents.append(doc_info)
        
        print(f"File uploaded: {file.filename}")
        
        return {
            "message": "Document uploaded successfully",
            "document": {
                "id": doc_info["id"],
                "filename": file.filename,
                "chunks": 3,
                "uploaded_at": doc_info["uploaded_at"]
            }
        }
        
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/documents")
async def get_documents():
    return {
        "documents": [
            {
                "id": doc["id"],
                "filename": doc["name"],
                "file_type": doc["name"].split('.')[-1],
                "file_size": doc["size"],
                "chunks": doc["chunks"],
                "processed": True,
                "uploaded_at": doc["uploaded_at"]
            }
            for doc in documents
        ]
    }

@app.get("/api/health")
async def health():
    return {
        "status": "running",
        "message": "RAG Chatbot Demo",
        "documents": len(documents),
        "users": len(users)
    }

if __name__ == "__main__":
    print("="*60)
    print("RAG CHATBOT DEMO RUNNING")
    print("http://localhost:8000")
    print("Login: demo / demo123")
    print("Upload documents in Admin panel")
    print("Ask 'what documents do I have?' to test upload")
    print("="*60)
    uvicorn.run(app, host="127.0.0.1", port=8000)

@app.get("/admin-simple", response_class=HTMLResponse)
async def admin_simple(request: Request):
    return templates.TemplateResponse("admin-simple.html", {"request": request})

@app.post("/api/chat")
async def chat_message(request: Request):
    data = await request.json()
    message = data.get("message", "").lower()
    session_id = data.get("session_id", str(uuid.uuid4()))
    
    # Simple responses
    if "hello" in message or "hi" in message:
        response = "Hello! How can I help you?"
    elif "service" in message:
        response = "We offer AI chatbot development and consulting."
    elif "price" in message or "cost" in message:
        response = "Pricing starts at $99/month."
    elif "document" in message or "file" in message:
        response = "You can upload files in the Admin panel."
    else:
        response = f"You said: {message}"
    
    return {
        "response": response,
        "session_id": session_id
    }