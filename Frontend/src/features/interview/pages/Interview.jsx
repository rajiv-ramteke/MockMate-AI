import React, { useState, useEffect, useRef } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams } from 'react-router'
import ShareModal from '../../profile/components/ShareModal'

const MIN_ANSWERS_REQUIRED = 4

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'quiz', label: 'Technical Quiz', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── QuestionCard ───────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index, evaluateAnswer, onAnswerSubmitted }) => {
    const [open, setOpen] = useState(false)
    const [practiceMode, setPracticeMode] = useState(false)
    const [userAnswer, setUserAnswer] = useState('')
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const [error, setError] = useState(null)
    const [answered, setAnswered] = useState(false)

    // Voice Features State
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef(null)

    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel()
            if (recognitionRef.current) recognitionRef.current.stop()
        }
    }, [])

    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.onstart = () => setIsSpeaking(true)
            utterance.onend = () => setIsSpeaking(false)
            utterance.onerror = () => setIsSpeaking(false)
            window.speechSynthesis.speak(utterance)
        } else {
            alert("Text-to-speech is not supported in this browser.")
        }
    }

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
        }
    }

    const toggleListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.")
            return
        }
        if (isListening) {
            recognitionRef.current?.stop()
            setIsListening(false)
            return
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event) => {
            let finalTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' '
                }
            }
            if (finalTranscript) {
                setUserAnswer(prev => prev + finalTranscript)
            }
        }

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error)
            setIsListening(false)
        }
        recognition.onend = () => setIsListening(false)
        
        recognitionRef.current = recognition
        recognition.start()
        setIsListening(true)
    }

    const handleEvaluate = async () => {
        if (!userAnswer.trim()) return
        setIsEvaluating(true)
        setError(null)
        try {
            const result = await evaluateAnswer({ question: item.question, answer: userAnswer })
            if (result) {
                setFeedback(result)
                if (!answered) {
                    setAnswered(true)
                    onAnswerSubmitted(item.question, userAnswer)
                }
            } else {
                setError('Failed to get feedback from AI. Please try again.')
            }
        } catch (err) {
            setError('An error occurred during evaluation.')
        }
        setIsEvaluating(false)
    }

    return (
        <div className={`q-card ${answered ? 'q-card--answered' : ''}`}>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {answered && (
                        <span style={{
                            fontSize: '0.7rem', color: '#3fb950', fontWeight: 600,
                            background: 'rgba(63,185,80,0.12)', padding: '2px 8px', borderRadius: '99px',
                            whiteSpace: 'nowrap'
                        }}>✓ Answered</span>
                    )}
                    <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                </div>
            </div>

            {open && (
                <div className='q-card__body'>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); isSpeaking ? stopSpeaking() : speakText(item.question) }}
                            style={{ background: 'transparent', border: '1px solid #30363d', color: '#c9d1d9', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
                        >
                            {isSpeaking ? '⏹ Stop Audio' : '🔊 Read Question'}
                        </button>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>

                    {!practiceMode && !feedback && (
                        <button className='button secondary-button q-card__practice-btn' onClick={() => setPracticeMode(true)}>
                            💬 Practice Answering
                        </button>
                    )}

                    {practiceMode && !feedback && (
                        <div className='q-card__practice-area'>
                            <textarea
                                className='q-card__textarea'
                                placeholder='Type your answer here or use the microphone as if you are in a real interview...'
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                rows={4}
                            />
                            {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
                            <div className='q-card__actions' style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
                                <button 
                                    className='button secondary-button' 
                                    onClick={toggleListening}
                                    style={{ 
                                        color: isListening ? '#f85149' : 'inherit', 
                                        borderColor: isListening ? '#f85149' : '',
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.85rem',
                                        borderRadius: '0.5rem',
                                        minHeight: 'auto'
                                    }}
                                >
                                    {isListening ? '🛑 Stop Recording' : '🎤 Answer with Voice'}
                                </button>
                                <div style={{flex: 1}}></div>
                                <button className='button secondary-button' onClick={() => { setPracticeMode(false); setError(null); if (isListening) toggleListening(); }}>Cancel</button>
                                <button className='button primary-button' onClick={handleEvaluate} disabled={isEvaluating || !userAnswer.trim()}>
                                    {isEvaluating ? 'Evaluating...' : 'Submit Answer'}
                                </button>
                            </div>
                        </div>
                    )}

                    {feedback && (
                        <div className='q-card__feedback'>
                            <div className='feedback-bubble feedback-bubble--user'>
                                <strong>Your Answer:</strong>
                                <p>{userAnswer}</p>
                            </div>
                            <div className='feedback-bubble feedback-bubble--ai'>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong>AI Feedback:</strong>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); isSpeaking ? stopSpeaking() : speakText(feedback.feedback) }}
                                        style={{ background: 'transparent', border: 'none', color: '#58a6ff', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        {isSpeaking ? '⏹ Stop' : '🔊 Read Feedback'}
                                    </button>
                                </div>
                                <p>{feedback.feedback}</p>
                                <div className='feedback-details'>
                                    <div className='feedback-col feedback-col--strengths'>
                                        <span className='feedback-tag feedback-tag--positive'>Strengths</span>
                                        <ul>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                    <div className='feedback-col feedback-col--weaknesses'>
                                        <span className='feedback-tag feedback-tag--negative'>Areas to Improve</span>
                                        <ul>{feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                    </div>
                                </div>
                                <div className='feedback-improvement'>
                                    <strong>How to improve:</strong>
                                    <p>{feedback.improvement}</p>
                                </div>
                            </div>
                            <button className='button secondary-button q-card__practice-btn' onClick={() => { setFeedback(null); setUserAnswer(''); setPracticeMode(true) }}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {(!practiceMode || feedback) && (
                        <div className='q-card__section' style={{ marginTop: '1rem', borderTop: '1px solid #2a3348', paddingTop: '1rem' }}>
                            <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                            <p>{item.answer}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── QuizCard ──────────────────────────────────────────────────────────────────
const QuizCard = ({ item, index }) => {
    const [selectedOption, setSelectedOption] = useState(null)

    const isCorrect = selectedOption === item.correctAnswer

    return (
        <div className={`q-card ${selectedOption ? (isCorrect ? 'q-card--correct' : 'q-card--incorrect') : ''}`}>
            <div className='q-card__header' style={{ cursor: 'default' }}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
            </div>
            
            <div className='q-card__body' style={{ display: 'block', borderTop: '1px solid #2a3348', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {item.options.map((option, i) => {
                        const isSelected = selectedOption === option
                        const isActualCorrect = option === item.correctAnswer
                        let optionStyle = { padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #2a3348', background: '#161b22', transition: 'all 0.2s', fontSize: '0.9rem' }
                        
                        if (selectedOption) {
                            optionStyle.cursor = 'default'
                            if (isActualCorrect) {
                                optionStyle.borderColor = '#3fb950'
                                optionStyle.background = 'rgba(63,185,80,0.1)'
                            } else if (isSelected) {
                                optionStyle.borderColor = '#f85149'
                                optionStyle.background = 'rgba(248,81,73,0.1)'
                            } else {
                                optionStyle.opacity = 0.5
                            }
                        }

                        return (
                            <div 
                                key={i} 
                                style={optionStyle}
                                onClick={() => !selectedOption && setSelectedOption(option)}
                                onMouseEnter={(e) => !selectedOption && (e.currentTarget.style.background = '#21262d')}
                                onMouseLeave={(e) => !selectedOption && (e.currentTarget.style.background = '#161b22')}
                            >
                                <span style={{ marginRight: '10px', fontWeight: 'bold', color: '#8b949e' }}>{String.fromCharCode(65 + i)}.</span>
                                {option}
                            </div>
                        )
                    })}
                </div>
                
                {selectedOption && (
                    <div style={{ marginTop: '1rem', padding: '10px', borderRadius: '8px', background: isCorrect ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)', color: isCorrect ? '#3fb950' : '#f85149', fontSize: '0.9rem' }}>
                        {isCorrect ? '✨ Correct! Great job.' : `❌ Incorrect. The correct answer is: ${item.correctAnswer}`}
                    </div>
                )}
            </div>
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const [submittedAnswers, setSubmittedAnswers] = useState([])
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const { report, getReportById, loading, getResumePdf, evaluateAnswer } = useInterview()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    const handleAnswerSubmitted = (question, answer) => {
        setSubmittedAnswers(prev => {
            const exists = prev.find(a => a.question === question)
            if (exists) return prev
            return [...prev, { question, answer }]
        })
    }

    const answeredCount = submittedAnswers.length
    const canDownload = answeredCount >= MIN_ANSWERS_REQUIRED

    const handleDownloadResume = () => {
        if (!canDownload) {
            alert(`Please answer at least ${MIN_ANSWERS_REQUIRED} questions before downloading your resume.\n\nYou have answered ${answeredCount} so far. ${MIN_ANSWERS_REQUIRED - answeredCount} more to go!\n\nClick "💬 Practice Answering" on any question to submit your answer.`)
            return
        }
        getResumePdf(interviewId, submittedAnswers)
    }

    if (loading || !report) {
        return (
            <main style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                height: '100vh', backgroundColor: '#0d1117', color: '#e6edf3',
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}>
                <h2>Loading your interview plan...</h2>
            </main>
        )
    }

    const scoreColor = report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'
    const scoreLabel = report.matchScore >= 80 ? 'Strong match for this role' : report.matchScore >= 60 ? 'Moderate match for this role' : 'Weak match for this role'

    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Download Resume Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {!canDownload && (
                            <div style={{ textAlign: 'center', padding: '0 0.25rem' }}>
                                <p style={{ fontSize: '0.72rem', color: '#8b949e', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                                    Answer <strong style={{ color: '#e040fb' }}>{MIN_ANSWERS_REQUIRED - answeredCount}</strong> more question{MIN_ANSWERS_REQUIRED - answeredCount !== 1 ? 's' : ''} to unlock your personalized resume
                                </p>
                                <div style={{ background: '#21262d', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: '99px',
                                        width: `${(answeredCount / MIN_ANSWERS_REQUIRED) * 100}%`,
                                        background: 'linear-gradient(90deg, #e040fb, #7c3aed)',
                                        transition: 'width 0.4s ease'
                                    }} />
                                </div>
                                <p style={{ fontSize: '0.68rem', color: '#8b949e', margin: '0.3rem 0 0 0' }}>
                                    {answeredCount} / {MIN_ANSWERS_REQUIRED} answered
                                </p>
                            </div>
                        )}
                        <button
                            onClick={handleDownloadResume}
                            className='button primary-button'
                            disabled={loading}
                            style={!canDownload ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                            {loading ? 'Generating...' : canDownload ? 'Download Resume' : '🔒 Download Resume'}
                        </button>
                        <button
                            onClick={() => setIsShareModalOpen(true)}
                            className='button secondary-button'
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                            Share with Professor
                        </button>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} evaluateAnswer={evaluateAnswer} onAnswerSubmitted={handleAnswerSubmitted} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'quiz' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Quiz</h2>
                                <span className='content-header__count'>{(report.technicalQuiz || []).length} questions</span>
                            </div>
                            <div className='q-list'>
                                {(report.technicalQuiz || []).map((q, i) => (
                                    <QuizCard key={i} item={q} index={i} />
                                ))}
                                {(!report.technicalQuiz || report.technicalQuiz.length === 0) && (
                                    <p style={{ color: '#8b949e', textAlign: 'center', padding: '2rem' }}>No quiz questions available for this report.</p>
                                )}
                            </div>
                        </section>
                    )}


                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} evaluateAnswer={evaluateAnswer} onAnswerSubmitted={handleAnswerSubmitted} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day) => (
                                    <RoadMapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>{scoreLabel}</p>
                    </div>
                    <div className='sidebar-divider' />
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <a 
                                    key={i} 
                                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(gap.skill + ' tutorial')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`skill-tag skill-tag--${gap.severity}`}
                                    title={`Watch tutorials on ${gap.skill}`}
                                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                                >
                                    {gap.skill}
                                    <svg style={{ marginLeft: '5px', opacity: 0.9 }} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                                </a>
                            ))}
                        </div>
                    </div>
                </aside>

            </div>

            <ShareModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                interviewReportId={interviewId}
                candidateAnswers={submittedAnswers}
            />
        </div>
    )
}

export default Interview