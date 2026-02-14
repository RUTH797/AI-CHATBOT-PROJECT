class AdminManager {
    constructor() {
        this.currentDeleteId = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.loadDocuments();
            this.loadStats();
            
            // Check if user is logged in
            if (!window.authManager.isLoggedIn()) {
                window.location.href = '/';
                return;
            }
        });
    }

    setupEventListeners() {
        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        const browseBtn = document.getElementById('browse-btn');
        
        if (uploadArea && fileInput) {
            // Click on upload area
            uploadArea.addEventListener('click', () => fileInput.click());
            
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#4f46e5';
                uploadArea.style.backgroundColor = '#f0f9ff';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '#d1d5db';
                uploadArea.style.backgroundColor = 'white';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#d1d5db';
                uploadArea.style.backgroundColor = 'white';
                
                if (e.dataTransfer.files.length > 0) {
                    this.handleFiles(e.dataTransfer.files);
                }
            });
        }
        
        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', () => fileInput.click());
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFiles(e.target.files);
                }
            });
        }
        
        // Refresh documents
        const refreshBtn = document.getElementById('refresh-docs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDocuments();
                this.loadStats();
                window.authManager.showToast('Documents refreshed', 'info');
            });
        }
        
        // Document search
        const searchInput = document.getElementById('document-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterDocuments(e.target.value);
            });
        }
        
        // Delete modal
        const cancelDeleteBtn = document.getElementById('cancel-delete');
        const confirmDeleteBtn = document.getElementById('confirm-delete');
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        }
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => this.confirmDelete());
        }
        
        // Close modal when clicking outside
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeDeleteModal();
                }
            });
        });
    }

    async handleFiles(files) {
        const validFiles = Array.from(files).filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            const isValid = ['pdf', 'txt', 'md'].includes(ext);
            const isSizeValid = file.size <= 16 * 1024 * 1024; // 16MB
            
            if (!isValid) {
                window.authManager.showToast(`File type not supported: ${file.name}`, 'error');
            }
            if (!isSizeValid) {
                window.authManager.showToast(`File too large: ${file.name} (max 16MB)`, 'error');
            }
            
            return isValid && isSizeValid;
        });
        
        if (validFiles.length === 0) return;
        
        for (const file of validFiles) {
            await this.uploadFile(file);
        }
    }
    async uploadFile(file) {
      const formData = new FormData();
      formData.append('file', file);
    
       try {
        const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`${file.name} uploaded successfully!`);
            this.loadDocuments(); // Refresh the list
        } else {
            alert(`❌ Upload failed: ${data.detail}`);
        }
          } catch (error) {
        alert(`❌ Error: Could not connect to server`);
        console.error(error);
      }
    }
    

    async loadDocuments() {
        try {
            const response = await window.authManager.fetchWithAuth('/api/documents');
            const data = await response.json();
            
            this.updateDocumentsTable(data.documents || []);
            
        } catch (error) {
            console.error('Error loading documents:', error);
            window.authManager.showToast('Failed to load documents', 'error');
        }
    }

    async loadStats() {
        try {
            const response = await window.authManager.fetchWithAuth('/api/documents');
            const data = await response.json();
            const documents = data.documents || [];
            
            // Calculate stats
            const totalDocs = documents.length;
            const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunks || 0), 0);
            const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
            const processedDocs = documents.filter(doc => doc.processed).length;
            
            // Update UI
            document.getElementById('total-docs').textContent = totalDocs;
            document.getElementById('total-chunks').textContent = totalChunks;
            document.getElementById('total-size').textContent = this.formatBytes(totalSize);
            document.getElementById('processed-docs').textContent = processedDocs;
            document.getElementById('doc-count').textContent = `${totalDocs} documents`;
            
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateDocumentsTable(documents) {
        const tableBody = document.getElementById('documents-table-body');
        if (!tableBody) return;
        
        if (documents.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-file"></i>
                            <p>No documents uploaded yet</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = '';
        
        documents.forEach(doc => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="file-cell">
                        <i class="fas fa-file-${doc.file_type === 'pdf' ? 'pdf' : 'alt'}"></i>
                        <span class="file-name">${doc.filename}</span>
                    </div>
                </td>
                <td><span class="file-type">${doc.file_type.toUpperCase()}</span></td>
                <td>${this.formatBytes(doc.file_size)}</td>
                <td>${doc.chunks}</td>
                <td>${new Date(doc.uploaded_at).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge ${doc.processed ? 'status-success' : 'status-processing'}">
                        ${doc.processed ? 'Processed' : 'Processing'}
                    </span>
                </td>
                <td>
                    <button class="action-btn view-btn" title="View" data-id="${doc.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Delete" data-id="${doc.id}" data-filename="${doc.filename}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.target.closest('button').dataset.id;
                this.viewDocument(docId);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const docId = e.target.closest('button').dataset.id;
                const filename = e.target.closest('button').dataset.filename;
                this.showDeleteModal(docId, filename);
            });
        });
    }

    filterDocuments(searchTerm) {
        const rows = document.querySelectorAll('#documents-table-body tr');
        const searchLower = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            if (row.classList.contains('empty-row')) return;
            
            const filename = row.querySelector('.file-name')?.textContent.toLowerCase() || '';
            const fileType = row.querySelector('.file-type')?.textContent.toLowerCase() || '';
            
            const matches = filename.includes(searchLower) || fileType.includes(searchLower);
            row.style.display = matches ? '' : 'none';
        });
    }

    viewDocument(docId) {
        window.authManager.showToast('View document feature coming soon', 'info');
        // TODO: Implement document preview
    }

    showDeleteModal(docId, filename) {
        this.currentDeleteId = docId;
        
        const modal = document.getElementById('delete-modal');
        const filenameElement = document.getElementById('delete-filename');
        
        if (modal && filenameElement) {
            filenameElement.textContent = filename;
            modal.style.display = 'flex';
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentDeleteId = null;
    }

    async confirmDelete() {
        if (!this.currentDeleteId) return;
        
        try {
            // Note: We don't have a delete endpoint yet, so we'll simulate it
            // In a real app, you would call: DELETE /api/documents/{id}
            window.authManager.showToast('Delete functionality coming soon', 'info');
            
            // Simulate deletion
            setTimeout(() => {
                this.loadDocuments();
                this.loadStats();
                window.authManager.showToast('Document deleted (simulated)', 'info');
            }, 1000);
            
        } catch (error) {
            console.error('Delete error:', error);
            window.authManager.showToast('Failed to delete document', 'error');
        } finally {
            this.closeDeleteModal();
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize admin manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
    
    // Add admin-specific CSS
    const adminStyle = document.createElement('style');
    adminStyle.textContent = `
        .admin-content {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }
        
        .upload-card, .documents-card, .stats-card {
            margin-bottom: 2rem;
        }
        
        .uploaded-files {
            margin-top: 1rem;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .uploaded-file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f9fafb;
            border-radius: 8px;
            margin-bottom: 8px;
        }
        
        .file-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .file-name {
            font-weight: 500;
            color: #1f2937;
        }
        
        .file-status {
            font-size: 0.85rem;
            color: #6b7280;
        }
        
        .file-cell {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .file-cell i {
            color: #6b7280;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .status-success {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-processing {
            background: #fef3c7;
            color: #92400e;
        }
        
        .action-btn {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            transition: all 0.2s;
        }
        
        .action-btn:hover {
            background: #f3f4f6;
        }
        
        .view-btn:hover {
            color: #3b82f6;
        }
        
        .delete-btn:hover {
            color: #dc2626;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }
        
        .stat-item {
            text-align: center;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .stats-info {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e5e7eb;
        }
        
        .stats-info h3 {
            margin-bottom: 1rem;
            color: #4b5563;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .stats-info ul {
            padding-left: 1.5rem;
            color: #6b7280;
        }
        
        .stats-info li {
            margin-bottom: 0.5rem;
            line-height: 1.5;
        }
        
        .documents-table-container {
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        .table-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
            color: #6b7280;
            font-size: 0.9rem;
        }
        
        .pagination {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .page-btn {
            background: #f3f4f6;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .page-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .page-btn:not(:disabled):hover {
            background: #e5e7eb;
        }
        
        .search-box {
            position: relative;
            flex: 1;
        }
        
        .search-box i {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
        }
        
        .search-box input {
            width: 100%;
            padding: 10px 12px 10px 36px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.9rem;
        }
        
        .search-box input:focus {
            outline: none;
            border-color: #4f46e5;
        }
        
        .documents-actions {
            display: flex;
            gap: 1rem;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .warning-text {
            color: #92400e;
            background: #fef3c7;
            padding: 12px;
            border-radius: 8px;
            margin: 1rem 0;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        
        .warning-text i {
            margin-top: 2px;
        }
    `;
    document.head.appendChild(adminStyle);
});
