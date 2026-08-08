import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';

const DocumentsForm = () => {
    const { profile, uploadDocument, deleteDocument } = useProfile();
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const docList = profile?.documents || [];

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (selected.size > 5 * 1024 * 1024) {
                alert("File size exceeds 5MB limit.");
                setFile(null);
                e.target.value = '';
                return;
            }
            setFile(selected);
            if (!title) {
                setTitle(selected.name.split('.')[0]);
            }
        }
    };

    const handleUpload = async () => {
        if (!title || !file) {
            alert("Please provide a title and select a file.");
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = reader.result;
                const format = file.name.split('.').pop().toLowerCase();
                
                const res = await uploadDocument({ title, format, size: file.size, base64Data });
                if (res.success) {
                    alert("Document uploaded successfully!");
                    setTitle('');
                    setFile(null);
                    document.getElementById('doc-upload-input').value = '';
                }
            };
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (docId) => {
        if (window.confirm("Are you sure you want to delete this document?")) {
            const res = await deleteDocument(docId);
            if (res.success) alert("Document deleted.");
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className='profile-section-form'>
            <div style={{ marginBottom: '2rem' }}>
                <h2>My Documents</h2>
                <p style={{ color: '#8b949e' }}>Upload your resume, marksheets, and degree certificates (PDF, PNG, JPG max 5MB).</p>
            </div>

            <div style={{ background: '#21262d', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #30363d' }}>
                <h3>Upload New Document</h3>
                <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <div className='form-group'>
                        <label>Document Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className='panel__input' placeholder="e.g. B.Tech Marksheet" />
                    </div>
                    <div className='form-group'>
                        <label>Select File</label>
                        <input id="doc-upload-input" type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} className='panel__input' style={{ padding: '0.4rem' }} />
                    </div>
                </div>
                <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                    <button className='button primary-button' onClick={handleUpload} disabled={uploading || !file || !title}>
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                </div>
            </div>

            <div className='documents-list'>
                <h3>Uploaded Documents</h3>
                {docList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e', border: '1px dashed #30363d', borderRadius: '8px', marginTop: '1rem' }}>
                        No documents uploaded yet.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                        {docList.map((doc) => (
                            <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b22', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '2rem' }}>{doc.format === 'pdf' ? '📄' : '🖼️'}</span>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#e6edf3' }}>{doc.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#8b949e' }}>
                                            {doc.format.toUpperCase()} • {formatBytes(doc.size)} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <a href={doc.base64Data} download={`${doc.title}.${doc.format}`} className='button secondary-button' style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}>
                                        Download
                                    </a>
                                    <button className='button secondary-button' style={{ color: '#ff6b6b', borderColor: '#ff6b6b', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleDelete(doc._id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentsForm;
