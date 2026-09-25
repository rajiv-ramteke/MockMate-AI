import React, { useState } from 'react';
import { shareWithProfessorAPI } from '../services/share.api';
import './ShareModal.scss';

const ShareModal = ({ isOpen, onClose, interviewReportId, candidateAnswers = [] }) => {
    const [professorEmail, setProfessorEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        let finalAnswers = candidateAnswers;
        if (!finalAnswers || finalAnswers.length === 0) {
            try {
                const savedLatest = localStorage.getItem('mockmate_latest_answers');
                if (savedLatest) {
                    finalAnswers = JSON.parse(savedLatest);
                }
            } catch (e) {}
        }

        try {
            await shareWithProfessorAPI({
                professorEmail,
                message,
                interviewReportId, // If null, the backend handles it gracefully
                candidateAnswers: finalAnswers
            });
            setSuccess('Profile successfully shared!');
            setTimeout(() => {
                onClose();
                setSuccess('');
                setProfessorEmail('');
                setMessage('');
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to share profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="share-modal-overlay">
            <div className="share-modal">
                <button className="share-modal__close" onClick={onClose} disabled={loading}>&times;</button>
                <h2>🎓 Share with Professor</h2>
                <p className="share-modal__desc">
                    Send your complete profile, interview performance score, Q&A answers, and a dynamically generated PDF resume directly to a professor or recruiter.
                </p>

                {error && <div className="share-modal__alert error">{error}</div>}
                {success && <div className="share-modal__alert success">{success}</div>}

                <form onSubmit={handleSubmit} className="share-modal__form">
                    <div className="form-group">
                        <label>Professor's Email *</label>
                        <input 
                            type="email" 
                            value={professorEmail}
                            onChange={(e) => setProfessorEmail(e.target.value)}
                            placeholder="professor@university.edu"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Custom Message (Optional)</label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Dear Professor, here is my profile and recent mock interview performance..."
                            rows={4}
                            disabled={loading}
                        />
                    </div>

                    <div className="share-modal__actions">
                        <button type="button" className="button secondary-button" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="button primary-button" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Email'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShareModal;
