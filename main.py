from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
import os
import uuid

from app.config import config, logger
from app.database import get_db, init_db, User, ChatHistory, Document
from app.auth import get_current_user, create_access_token, authenticate_user, get_password_hash, create_test_user
from app.document_processor import doc_processor
from app.rag_chatbot import rag_bot

app = FastAPI(
    title="AI Chatbot with RAG",
    description="A modern landing page with AI-powered chatbot",
    version="1.0.0"
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

@app.on_event("startup")
def startup_event():
    init_db()
    
    db = next(get_db())
    create_test_user(db)
    logger.info("Application started")

@app.post("/api/auth/register")
async def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(
        (User.username == username) | (User.email == email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email exists")
    
    new_user = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": username})
    
    return {
        "message": "User created",
        "user": {"username": username, "email": email},
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/api/auth/login")
async def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, username, password)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "message": "Login successful",
        "user": {"username": user.username, "email": user.email},
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/api/chat")
async def chat(
    request: Request,
    message: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        user_message = message.get("message", "").strip()
        session_id = message.get("session_id", str(uuid.uuid4()))
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message empty")
        
        user_chat = ChatHistory(
            user_id=current_user.id,
            session_id=session_id,
            message=user_message,
            is_user=True
        )
        db.add(user_chat)
        
        relevant_docs = doc_processor.search_documents(user_message, current_user.id)
        
        recent_chats = db.query(ChatHistory).filter(
            ChatHistory.user_id == current_user.id,
            ChatHistory.session_id == session_id
        ).order_by(ChatHistory.created_at.desc()).limit(5).all()
        
        bot_response = rag_bot.generate_response(
            query=user_message,
            context=relevant_docs,
            chat_history=[
                {"message": chat.message, "is_user": chat.is_user}
                for chat in reversed(recent_chats)
            ]
        )
        
        bot_chat = ChatHistory(
            user_id=current_user.id,
            session_id=session_id,
            message=bot_response["response"],
            is_user=False,
            tokens_used=bot_response.get("tokens_used", 0),
            source_documents=str(bot_response.get("sources", []))
        )
        db.add(bot_chat)
        db.commit()
        
        return {
            "response": bot_response["response"],
            "session_id": session_id,
            "sources": bot_response.get("sources", []),
            "message_id": bot_chat.id
        }
    
    except Exception as e:
        logger.error(f"Chat error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/history")
async def get_chat_history(
    session_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id)
    
    if session_id:
        query = query.filter(ChatHistory.session_id == session_id)
    
    chats = query.order_by(ChatHistory.created_at.asc()).all()
    
    return {
        "chats": [
            {
                "id": chat.id,
                "message": chat.message,
                "is_user": chat.is_user,
                "created_at": chat.created_at.isoformat(),
                "sources": eval(chat.source_documents) if chat.source_documents else []
            }
            for chat in chats
        ]
    }

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file")
        
        file_ext = file.filename.split('.')[-1].lower()
        if file_ext not in config.ALLOWED_FILES:
            raise HTTPException(
                status_code=400,
                detail=f"File type not allowed"
            )
        
        os.makedirs(config.UPLOAD_DIR, exist_ok=True)
        
        file_path = os.path.join(
            config.UPLOAD_DIR,
            f"{current_user.id}_{uuid.uuid4()}_{file.filename}"
        )
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        document = doc_processor.process_document(
            user_id=current_user.id,
            file_path=file_path,
            original_filename=file.filename
        )
        
        return {
            "message": "Document uploaded",
            "document": {
                "id": document.id,
                "filename": document.original_filename,
                "chunks": document.chunk_count,
                "uploaded_at": document.uploaded_at.isoformat()
            }
        }
    
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents")
async def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.uploaded_at.desc()).all()
    
    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.original_filename,
                "file_type": doc.file_type,
                "file_size": doc.file_size,
                "chunks": doc.chunk_count,
                "processed": doc.is_processed,
                "uploaded_at": doc.uploaded_at.isoformat()
            }
            for doc in documents
        ]
    }

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "rag-chatbot",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )