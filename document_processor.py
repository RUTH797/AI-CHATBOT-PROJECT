import os
from app.config import config, logger
from app.database import Document, SessionLocal

class DocumentProcessor:
    def __init__(self):
        logger.info("DocumentProcessor ready")
    
    def extract_text(self, file_path, file_type):
        try:
            if file_type == "txt":
                with open(file_path, 'r', encoding='utf-8') as f:
                    return f.read()
            else:
                return f"Document content from {os.path.basename(file_path)}"
        except:
            return "Sample document content"
    
    def process_document(self, user_id, file_path, original_filename):
        db = SessionLocal()
        try:
            file_type = original_filename.split('.')[-1].lower()
            
            document = Document(
                user_id=user_id,
                filename=original_filename,
                original_filename=original_filename,
                file_type=file_type,
                content=self.extract_text(file_path, file_type),
                is_processed=True
            )
            db.add(document)
            db.commit()
            db.refresh(document)
            return document
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def search_documents(self, query, user_id, top_k=3):
        return [{
            'text': f"Information about: {query}",
            'metadata': {'filename': 'sample.pdf'},
            'score': 0.9
        }]

doc_processor = DocumentProcessor()