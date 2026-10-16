import React, { useState, useRef, useEffect } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/hooks/useAuth'

const Home = () => {

    const { loading, generateReport, reports } = useInterview()
    const { user, handleLogout } = useAuth()
    const [jobDescription, setJobDescription] = useState("")
    const [selfDescription, setSelfDescription] = useState("")
    const [selectedFile, setSelectedFile] = useState(null)
    const [error, setError] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState(0)
    const [showResumePreview, setShowResumePreview] = useState(false)
    const resumeInputRef = useRef()

    const loadingSteps = [
        "Parsing candidate resume & target job requirements",
        "Running deep AI analysis on projects, experience & tech stack",
        "Identifying critical skill gaps & candidate strengths",
        "Generating 10 in-depth technical questions with model answers",
        "Formulating 8 STAR-method behavioral interview answers",
        "Synthesizing 8 technical quiz MCQs & evaluation matrix",
        "Constructing personalized 14-day mastery road map",
        "Finalizing comprehensive AI interview report"
    ]

    useEffect(() => {
        let timer;
        if (isGenerating) {
            setProgress(5);
            timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev < 25) return +(prev + 2.4).toFixed(1);
                    if (prev < 50) return +(prev + 1.8).toFixed(1);
                    if (prev < 75) return +(prev + 1.2).toFixed(1);
                    if (prev < 88) return +(prev + 0.7).toFixed(1);
                    if (prev < 95) return +(prev + 0.35).toFixed(1);
                    if (prev < 98.8) return +(prev + 0.15).toFixed(1);
                    return +(Math.min(99, prev + 0.05)).toFixed(1);
                });
            }, 500);
        } else {
            setProgress(0);
        }
        return () => clearInterval(timer);
    }, [isGenerating]);

    const currentStepIndex = Math.min(
        Math.floor((progress / 99) * loadingSteps.length),
        loadingSteps.length - 1
    );

    const navigate = useNavigate()

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setSelectedFile(file)
            setError("")
        }
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        resumeInputRef.current.value = ""
    }

    const handleGenerateReport = async () => {
        if (!jobDescription.trim()) {
            setError("Please enter a Job Description before generating.")
            return
        }
        if (!selectedFile && !selfDescription.trim()) {
            setError("Please upload a Resume PDF or write a Self Description.")
            return
        }
        setError("")
        setIsGenerating(true)
        const data = await generateReport({ jobDescription, selfDescription, resumeFile: selectedFile })
        
        if (data && data._id) {
            setProgress(100);
            setTimeout(() => {
                setIsGenerating(false);
                navigate(`/interview/${data._id}`);
            }, 300);
        } else {
            setIsGenerating(false);
            if (data && data.error) {
                setError(`Failed: ${data.error}`)
            } else {
                setError("Failed to generate report. Please check your internet and try again.")
            }
        }
    }

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    if (isGenerating) {
        return (
            <main className='loading-screen'>
                {/* Ambient background orbs */}
                <div className='ls-orb ls-orb--1' />
                <div className='ls-orb ls-orb--2' />
                <div className='ls-orb ls-orb--3' />

                <div className='loading-screen__card'>
                    {/* Circular ring spinner */}
                    <div className='ls-ring-wrap'>
                        <svg className='ls-ring' viewBox='0 0 120 120'>
                            <defs>
                                <linearGradient id='ringGrad' x1='0%' y1='0%' x2='100%' y2='0%'>
                                    <stop offset='0%' stopColor='#ff2d78' />
                                    <stop offset='50%' stopColor='#a855f7' />
                                    <stop offset='100%' stopColor='#38bdf8' />
                                </linearGradient>
                            </defs>
                            <circle className='ls-ring__track' cx='60' cy='60' r='52' />
                            <circle
                                className='ls-ring__fill'
                                cx='60' cy='60' r='52'
                                strokeDasharray={`${2 * Math.PI * 52}`}
                                strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                            />
                        </svg>
                        <div className='ls-ring__center'>
                            <span className='ls-ring__pct'>{Math.round(progress)}%</span>
                            <span className='ls-ring__label'>Analyzing</span>
                        </div>
                    </div>

                    <h2 className='loading-screen__title'>AI is Analyzing Your Profile</h2>

                    {/* Current step text */}
                    <p className='loading-screen__sub'>
                        {loadingSteps[currentStepIndex]}<span className='loading-dots'></span>
                    </p>

                    {/* Wave bars */}
                    <div className='ls-wave'>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className='ls-wave__bar' style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                    </div>

                    <p className='loading-screen__hint'>⚡ Deep AI analysis in progress &mdash; building your personalized strategy</p>
                </div>
            </main>
        )
    }

    return (
        <div className='home-page'>

            {/* Top Navbar */}
            <nav className='top-navbar'>
                <span className='top-navbar__brand'>🎯 MockMate AI</span>
                <div className='top-navbar__right'>
                    {user && user.role === 'admin' && (
                        <button className='top-navbar__profile' style={{backgroundColor: '#6366f1'}} onClick={() => navigate('/admin')}>👑 Admin Panel</button>
                    )}
                    <button className='top-navbar__profile' onClick={() => navigate('/profile')}>My Profile</button>
                    {user && <span className='top-navbar__user'>👤 {user.username}</span>}
                    <button className='top-navbar__logout' onClick={onLogout}>Logout</button>
                </div>
            </nav>

            {/* Page Header */}
            <header className='page-header'>
                <h1>Welcome to <span className='highlight'>MockMate AI</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>0 / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>

                            {selectedFile ? (
                                <div className='dropzone dropzone--selected'>
                                    <span className='dropzone__icon' style={{color: '#22c55e'}}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    </span>
                                    <p className='dropzone__title' style={{color: '#22c55e'}}>✅ {selectedFile.name}</p>
                                    <p className='dropzone__subtitle'>{(selectedFile.size / 1024).toFixed(0)} KB</p>
                                    <div className='dropzone__actions'>
                                        <button type='button' onClick={() => setShowResumePreview(true)} className='dropzone__view'>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            View Resume
                                        </button>
                                        <button type='button' onClick={handleRemoveFile} className='dropzone__remove'>Remove</button>
                                    </div>
                                </div>
                            ) : (
                                <label className='dropzone' htmlFor='resume'>
                                    <span className='dropzone__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                                    </span>
                                    <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                    <p className='dropzone__subtitle'>PDF only (Max 3MB)</p>
                                </label>
                            )}
                            <input ref={resumeInputRef} onChange={handleFileChange} hidden type='file' id='resume' name='resume' accept='.pdf' />
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    {error && <p style={{color: '#ff6b6b', fontSize: '0.85rem', margin: '0 1rem'}}>{error}</p>}
                    <button
                        disabled={isGenerating}
                        onClick={handleGenerateReport}
                        className='generate-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        {isGenerating ? 'Generating...' : 'Generate My Interview Strategy'}
                    </button>
                </div>
            </div>

            {/* Global small loading state for fetching reports */}
            {loading && !isGenerating && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#7d8590' }}>Loading your previous reports...</div>
            )}

            {/* Recent Reports List */}
            {!loading && reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <a href='#'>Privacy Policy</a>
                <a href='#'>Terms of Service</a>
                <a href='#'>Help Center</a>
            </footer>

            {/* Resume Preview Modal */}
            {showResumePreview && selectedFile && (
                <div className='resume-modal-overlay' onClick={() => setShowResumePreview(false)} onKeyDown={(e) => e.key === 'Escape' && setShowResumePreview(false)}>
                    <div className='resume-modal' onClick={(e) => e.stopPropagation()}>
                        <div className='resume-modal__header'>
                            <div className='resume-modal__title-group'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff2d78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                <h3>{selectedFile.name}</h3>
                                <span className='resume-modal__size'>{(selectedFile.size / 1024).toFixed(0)} KB</span>
                            </div>
                            <button className='resume-modal__close' onClick={() => setShowResumePreview(false)} title='Close preview'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <div className='resume-modal__body'>
                            <iframe
                                src={URL.createObjectURL(selectedFile)}
                                title='Resume Preview'
                                className='resume-modal__iframe'
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home