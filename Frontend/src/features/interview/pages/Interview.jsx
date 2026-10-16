import React, { useState, useEffect, useRef } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams } from 'react-router'
import ShareModal from '../../profile/components/ShareModal'

const MIN_ANSWERS_REQUIRED = 4

const NAV_ITEMS = [
    { id: 'analysis', label: 'Resume Score & Analysis', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>) },
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'quiz', label: 'Technical Quiz', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ── QuestionCard ───────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index, evaluateAnswer, onAnswerSubmitted, isAlreadyAnswered }) => {
    const [open, setOpen] = useState(false)
    const [practiceMode, setPracticeMode] = useState(false)
    const [userAnswer, setUserAnswer] = useState('')
    const [isEvaluating, setIsEvaluating] = useState(false)
    const [feedback, setFeedback] = useState(null)
    const [error, setError] = useState(null)
    const [answered, setAnswered] = useState(false)

    const isAnswered = answered || isAlreadyAnswered

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
            const result = await evaluateAnswer({ 
                question: item.question, 
                answer: userAnswer,
                expectedAnswer: item.answer 
            })
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
        <div className={`q-card ${isAnswered ? 'q-card--answered' : ''}`}>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {isAnswered && (
                        <span style={{
                            fontSize: '0.75rem',
                            color: '#3fb950',
                            fontWeight: 700,
                            background: 'rgba(63, 185, 80, 0.18)',
                            border: '1px solid #2ea043',
                            padding: '3px 10px',
                            borderRadius: '99px',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Answered
                        </span>
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

                    {!practiceMode && !feedback && !isAnswered && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.85rem 1.15rem',
                            background: 'rgba(22, 27, 34, 0.85)',
                            borderRadius: '8px',
                            border: '1px dashed #30363d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.88rem' }}>
                                <span style={{ fontSize: '1.1rem' }}>🔒</span>
                                <span><strong>Model Answer is locked:</strong> Submit your answer first to reveal the model answer & AI evaluation.</span>
                            </div>
                            <button 
                                className='button primary-button' 
                                style={{ padding: '7px 16px', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer' }} 
                                onClick={() => setPracticeMode(true)}
                            >
                                ✍️ Answer Question
                            </button>
                        </div>
                    )}

                    {practiceMode && !feedback && (
                        <div className='q-card__practice-area'>
                            <div style={{ fontSize: '0.82rem', color: '#8b949e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🔒</span>
                                <span>The model answer will unlock after you submit your response.</span>
                            </div>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <strong style={{ fontSize: '1.05rem', color: '#f0f6fc' }}>🎯 AI Evaluation:</strong>
                                        {feedback.score !== undefined && (
                                            <span style={{
                                                padding: '3px 10px',
                                                borderRadius: '99px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                background: feedback.score >= 75 ? 'rgba(63,185,80,0.18)' : feedback.score >= 50 ? 'rgba(210,153,34,0.18)' : 'rgba(248,81,73,0.18)',
                                                color: feedback.score >= 75 ? '#3fb950' : feedback.score >= 50 ? '#d29922' : '#f85149',
                                                border: `1px solid ${feedback.score >= 75 ? '#2ea043' : feedback.score >= 50 ? '#bb8009' : '#da3633'}`
                                            }}>
                                                Score: {feedback.score}/100 ({feedback.rating || 'Evaluated'})
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); isSpeaking ? stopSpeaking() : speakText(`${feedback.feedback}. Correct answer: ${feedback.correctAnswer || item.answer}`) }}
                                        style={{ background: 'transparent', border: 'none', color: '#58a6ff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                                    >
                                        {isSpeaking ? '⏹ Stop' : '🔊 Read Evaluation'}
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: '#c9d1d9' }}>{feedback.feedback}</p>
                                
                                <div className='feedback-details' style={{ marginTop: '1rem' }}>
                                    {feedback.strengths && feedback.strengths.length > 0 && (
                                        <div className='feedback-col feedback-col--strengths'>
                                            <span className='feedback-tag feedback-tag--positive'>✓ What You Did Well</span>
                                            <ul>{feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                        </div>
                                    )}
                                    {feedback.weaknesses && feedback.weaknesses.length > 0 && (
                                        <div className='feedback-col feedback-col--weaknesses'>
                                            <span className='feedback-tag feedback-tag--negative'>⚠ Areas to Improve</span>
                                            <ul>{feedback.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                        </div>
                                    )}
                                </div>

                                {(feedback.improvements || feedback.improvement) && (
                                    <div className='feedback-improvement' style={{ marginTop: '1rem' }}>
                                        <strong>🚀 How to Make it a 10/10 Answer:</strong>
                                        {Array.isArray(feedback.improvements || feedback.improvement) ? (
                                            <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0 }}>
                                                {(feedback.improvements || feedback.improvement).map((imp, i) => (
                                                    <li key={i} style={{ marginBottom: '0.35rem', lineHeight: '1.45' }}>{imp}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>{feedback.improvements || feedback.improvement}</p>
                                        )}
                                    </div>
                                )}

                                {/* Prominent Correct / Model Answer */}
                                <div style={{
                                    marginTop: '1.25rem',
                                    padding: '1rem 1.25rem',
                                    borderRadius: '10px',
                                    background: 'rgba(56, 139, 253, 0.1)',
                                    border: '1px solid rgba(56, 139, 253, 0.3)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                        <span style={{ fontSize: '1.1rem' }}>💡</span>
                                        <strong style={{ color: '#58a6ff', fontSize: '0.95rem' }}>Ideal / Correct Answer:</strong>
                                    </div>
                                    <p style={{ margin: 0, color: '#e6edf3', fontSize: '0.92rem', lineHeight: '1.55' }}>
                                        {feedback.correctAnswer || item.answer}
                                    </p>
                                </div>
                            </div>

                            <button className='button secondary-button q-card__practice-btn' onClick={() => { setFeedback(null); setUserAnswer(''); setPracticeMode(true) }}>
                                🔄 Try Answering Again
                            </button>
                        </div>
                    )}

                    {isAnswered && !feedback && !practiceMode && (
                        <div className='q-card__section' style={{ marginTop: '1rem', borderTop: '1px solid #2a3348', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span className='q-card__tag q-card__tag--answer'>✓ Model Answer (Unlocked)</span>
                                <button 
                                    className='button secondary-button' 
                                    style={{ padding: '4px 12px', fontSize: '0.8rem', borderRadius: '6px' }} 
                                    onClick={() => setPracticeMode(true)}
                                >
                                    🔄 Practice Again
                                </button>
                            </div>
                            <p>{item.answer}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── QuizCard ──────────────────────────────────────────────────────────────────
const cleanOptionText = (opt) => {
    if (typeof opt !== 'string') return opt || ''
    return opt
        .replace(/^([A-Da-d0-9][.)\s]\s*)+/g, '')
        .replace(/^(\([A-Da-d0-9]\)\s*)+/g, '')
        .trim()
}

const isOptionCorrect = (opt, correctAns, idx) => {
    if (!correctAns || !opt) return false
    const strOpt = String(opt).trim()
    const strAns = String(correctAns).trim()
    if (strOpt === strAns) return true

    const cleanOpt = cleanOptionText(strOpt).toLowerCase()
    const cleanAns = cleanOptionText(strAns).toLowerCase()
    if (cleanOpt && cleanAns && cleanOpt === cleanAns) return true

    const letter = String.fromCharCode(65 + idx)
    const ansLetterMatch = strAns.match(/^(\(?([A-Da-d])\)?|[A-Da-d]\.)$/)
    if (ansLetterMatch && (ansLetterMatch[2] || ansLetterMatch[1]).toUpperCase().replace(/[^A-D]/g, '') === letter) return true
    if (strAns.toUpperCase() === letter || strAns.toUpperCase() === `${letter}.`) return true

    return false
}

const QuizCard = ({ item, index, savedAnswer, onAnswerSubmitted }) => {
    const [selectedOption, setSelectedOption] = useState(savedAnswer || null)
    const [isSubmitted, setIsSubmitted] = useState(Boolean(savedAnswer))

    useEffect(() => {
        if (savedAnswer && !isSubmitted) {
            setSelectedOption(savedAnswer)
            setIsSubmitted(true)
        }
    }, [savedAnswer])

    const correctOption = Array.isArray(item.options)
        ? item.options.find((opt, idx) => isOptionCorrect(opt, item.correctAnswer, idx))
        : null

    const isCorrect = isSubmitted && selectedOption !== null && (
        selectedOption === item.correctAnswer ||
        isOptionCorrect(selectedOption, item.correctAnswer, item.options?.indexOf(selectedOption))
    )

    const handleSelectOption = (option) => {
        if (!isSubmitted) {
            setSelectedOption(option)
        }
    }

    const handleSubmit = () => {
        if (!selectedOption || isSubmitted) return
        setIsSubmitted(true)
        if (onAnswerSubmitted) {
            onAnswerSubmitted(item.question, selectedOption)
        }
    }

    const correctDisplayAnswer = correctOption 
        ? cleanOptionText(correctOption) 
        : cleanOptionText(item.correctAnswer)

    return (
        <div className={`q-card ${isSubmitted ? (isCorrect ? 'q-card--correct q-card--answered' : 'q-card--incorrect q-card--answered') : ''}`}>
            <div className='q-card__header' style={{ cursor: 'default' }}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                {isSubmitted && (
                    <span style={{
                        fontSize: '0.75rem',
                        color: '#3fb950',
                        fontWeight: 700,
                        background: 'rgba(63, 185, 80, 0.18)',
                        border: '1px solid #2ea043',
                        padding: '3px 10px',
                        borderRadius: '99px',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                    }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Answered
                    </span>
                )}
            </div>
            
            <div className='q-card__body' style={{ display: 'block', borderTop: '1px solid #2a3348', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {item.options.map((option, i) => {
                        const isSelected = selectedOption === option
                        const isActualCorrect = isOptionCorrect(option, item.correctAnswer, i)
                        let optionStyle = {
                            padding: '10px 14px',
                            borderRadius: '8px',
                            cursor: isSubmitted ? 'not-allowed' : 'pointer',
                            pointerEvents: isSubmitted ? 'none' : 'auto',
                            border: '1px solid #2a3348',
                            background: '#161b22',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }
                        
                        if (isSubmitted) {
                            if (isActualCorrect) {
                                optionStyle.borderColor = '#3fb950'
                                optionStyle.background = 'rgba(63,185,80,0.15)'
                                optionStyle.color = '#3fb950'
                                optionStyle.fontWeight = 600
                            } else if (isSelected) {
                                optionStyle.borderColor = '#f85149'
                                optionStyle.background = 'rgba(248,81,73,0.15)'
                                optionStyle.color = '#f85149'
                            } else {
                                optionStyle.opacity = 0.4
                            }
                        } else if (isSelected) {
                            optionStyle.borderColor = '#a855f7'
                            optionStyle.background = 'rgba(168, 85, 247, 0.15)'
                            optionStyle.boxShadow = '0 0 0 1px #a855f7'
                        }

                        return (
                            <div 
                                key={i} 
                                style={optionStyle}
                                onClick={() => handleSelectOption(option)}
                                onMouseEnter={(e) => !isSubmitted && !isSelected && (e.currentTarget.style.background = '#21262d')}
                                onMouseLeave={(e) => !isSubmitted && !isSelected && (e.currentTarget.style.background = '#161b22')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '10px', fontWeight: 'bold', color: isSelected && !isSubmitted ? '#c084fc' : '#8b949e' }}>
                                        {String.fromCharCode(65 + i)}.
                                    </span>
                                    <span>{cleanOptionText(option)}</span>
                                </div>
                                {isSubmitted && isActualCorrect && (
                                    <span style={{ fontSize: '0.8rem', color: '#3fb950', fontWeight: 600 }}>✓ Correct</span>
                                )}
                                {isSubmitted && isSelected && !isActualCorrect && (
                                    <span style={{ fontSize: '0.8rem', color: '#f85149', fontWeight: 600 }}>✗ Your Choice</span>
                                )}
                            </div>
                        )
                    })}
                </div>
                
                {!isSubmitted ? (
                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                            type='button'
                            className='button primary-button'
                            onClick={handleSubmit}
                            disabled={!selectedOption}
                            style={{
                                padding: '8px 20px',
                                fontSize: '0.875rem',
                                borderRadius: '6px',
                                opacity: selectedOption ? 1 : 0.4,
                                cursor: selectedOption ? 'pointer' : 'not-allowed',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            Submit Answer
                        </button>
                    </div>
                ) : (
                    <div style={{
                        marginTop: '1rem',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isCorrect ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                        border: `1px solid ${isCorrect ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
                        color: isCorrect ? '#3fb950' : '#f85149',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span>
                            {isCorrect ? '✨ Correct! Great job.' : `❌ Incorrect. The correct answer is: ${correctDisplayAnswer}`}
                        </span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7, color: '#8b949e' }}>
                            Answer recorded
                        </span>
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

const ResumeAnalysisView = ({ report }) => {
    const analysis = report.resumeAnalysis || {}
    const matchScore = report.matchScore || 0
    const skillsScore = analysis.skillsScore || 0
    const expScore = analysis.experienceScore || analysis.expScore || 0
    const projScore = analysis.projectsScore || 0
    const eduScore = analysis.educationScore || 0

    const scoreColor = matchScore >= 80 ? '#34d399' : matchScore >= 60 ? '#fbbf24' : '#f87171'
    const circumference = 2 * Math.PI * 45
    const strokeDashoffset = circumference - (matchScore / 100) * circumference

    const strengths = analysis.strengths?.length ? analysis.strengths : []
    const weaknesses = analysis.weaknesses?.length ? analysis.weaknesses :
        (report.skillGaps?.map(g => `Missing or weak: ${g.skill}`) || [])
    const suggestions = analysis.suggestions?.length ? analysis.suggestions : []

    return (
        <div className="resume-analysis-view">
            {/* Hero Score Card */}
            <div className="hero-score-card">
                <div className="score-circle-wrapper">
                    <svg viewBox="0 0 100 100">
                        <circle className="score-circle-bg" cx="50" cy="50" r="45" />
                        <circle 
                            className="score-circle-val" 
                            cx="50" cy="50" r="45" 
                            style={{ 
                                stroke: scoreColor, 
                                strokeDasharray: circumference, 
                                strokeDashoffset 
                            }} 
                        />
                    </svg>
                    <div className="score-center-text">
                        <span className="num">{matchScore}%</span>
                        <span className="label">Match</span>
                    </div>
                </div>

                <div className="hero-details">
                    <div className="job-badge">🎯 {report.title || "Job Alignment Analysis"}</div>
                    <h2>{matchScore >= 80 ? "✨ Strong Candidate Match" : matchScore >= 60 ? "⚡ Moderate Candidate Fit" : "⚠️ Needs Additional Preparation"}</h2>
                    <p>{analysis.summary || `Candidate profile shows ${matchScore}% alignment with the requirements for this role.`}</p>
                </div>
            </div>

            {/* Category Breakdown Bars */}
            <div className="breakdown-grid">
                <div className="category-card">
                    <div className="cat-header">
                        <span className="cat-title">🎯 Technical Skills</span>
                        <span className="cat-score" style={{ color: skillsScore >= 80 ? '#34d399' : '#fbbf24' }}>{skillsScore}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${skillsScore}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                    </div>
                </div>

                <div className="category-card">
                    <div className="cat-header">
                        <span className="cat-title">💼 Experience Relevance</span>
                        <span className="cat-score" style={{ color: expScore >= 80 ? '#34d399' : '#fbbf24' }}>{expScore}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${expScore}%`, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }} />
                    </div>
                </div>

                <div className="category-card">
                    <div className="cat-header">
                        <span className="cat-title">🚀 Project Impact</span>
                        <span className="cat-score" style={{ color: projScore >= 80 ? '#34d399' : '#fbbf24' }}>{projScore}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${projScore}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                    </div>
                </div>

                <div className="category-card">
                    <div className="cat-header">
                        <span className="cat-title">🎓 Education & Domain</span>
                        <span className="cat-score" style={{ color: eduScore >= 80 ? '#34d399' : '#fbbf24' }}>{eduScore}%</span>
                    </div>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${eduScore}%`, background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                    </div>
                </div>
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div className="analysis-sections-grid">
                <div className="analysis-card">
                    <div className="analysis-card__header strengths">
                        <span>✅</span> Profile Strengths
                    </div>
                    <ul>
                        {strengths.length > 0 ? strengths.map((s, idx) => (
                            <li key={idx}>
                                <span className="bullet-icon">🟢</span>
                                <span>{s}</span>
                            </li>
                        )) : <li style={{ color: '#94a3b8', listStyle: 'none' }}>No strengths data available.</li>}
                    </ul>
                </div>

                <div className="analysis-card">
                    <div className="analysis-card__header weaknesses">
                        <span>⚠️</span> Gaps & Missing Criteria
                    </div>
                    <ul>
                        {weaknesses.length > 0 ? weaknesses.map((w, idx) => (
                            <li key={idx}>
                                <span className="bullet-icon">🔴</span>
                                <span>{w}</span>
                            </li>
                        )) : <li style={{ color: '#94a3b8', listStyle: 'none' }}>No significant gaps identified.</li>}
                    </ul>
                </div>

                <div className="analysis-card full-width">
                    <div className="analysis-card__header suggestions">
                        <span>💡</span> AI Recommendations to Improve Resume Score
                    </div>
                    <ul>
                        {suggestions.length > 0 ? suggestions.map((tip, idx) => (
                            <li key={idx}>
                                <span className="bullet-icon">✨</span>
                                <span>{tip}</span>
                            </li>
                        )) : <li style={{ color: '#94a3b8', listStyle: 'none' }}>No recommendations available.</li>}
                    </ul>
                </div>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('analysis')
    const [submittedAnswers, setSubmittedAnswers] = useState([])
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const { report, getReportById, loading, getResumePdf, evaluateAnswer } = useInterview()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
            try {
                const saved = localStorage.getItem(`mockmate_answers_${interviewId}`)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    if (Array.isArray(parsed)) {
                        setSubmittedAnswers(parsed)
                    }
                }
            } catch (e) {
                console.error("Failed to load saved answers", e)
            }
        }
    }, [interviewId])

    const handleAnswerSubmitted = (question, answer) => {
        setSubmittedAnswers(prev => {
            const exists = prev.find(a => a.question === question)
            let updated;
            if (exists) {
                updated = prev.map(a => a.question === question ? { question, answer } : a)
            } else {
                updated = [...prev, { question, answer }]
            }
            if (interviewId) {
                try {
                    localStorage.setItem(`mockmate_answers_${interviewId}`, JSON.stringify(updated))
                    localStorage.setItem('mockmate_latest_answers', JSON.stringify(updated))
                } catch (e) {
                    console.error("Failed to save answers", e)
                }
            }
            return updated
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
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                height: '100vh', backgroundColor: '#0d1117', color: '#e6edf3',
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                gap: '1rem'
            }}>
                <div style={{
                    width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.15)',
                    borderTopColor: '#e040fb', borderRadius: '50%', animation: 'spin 1s linear infinite'
                }} />
                <h2>{report ? 'Regenerate Resume...' : 'Loading your interview plan...'}</h2>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </main>
        )
    }

    const scoreColor = report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'
    const scoreLabel = report.matchScore >= 80 ? 'Strong match for this role' : report.matchScore >= 60 ? 'Moderate match for this role' : 'Weak match for this role'

    // Default 14-day syllabus fallback if report plan is empty
    const default14DayPlan = [
        { day: 1, focus: "Core Fundamentals & Architecture Internals", tasks: ["Review fundamental programming paradigms and memory models", "Practice core data structure implementations"] },
        { day: 2, focus: "Advanced Concepts & Framework Deep Dive", tasks: ["Study lifecycle hooks, async operations, and concurrency", "Analyze framework internals and best practices"] },
        { day: 3, focus: "Clean Architecture & Design Patterns", tasks: ["Review SOLID principles and clean code patterns", "Implement common design patterns in real scenarios"] },
        { day: 4, focus: "State Management & Data Flow", tasks: ["Master global state management and caching strategies", "Optimize data structures for fast lookups"] },
        { day: 5, focus: "APIs, Network Protocols & Auth Flow", tasks: ["Design RESTful and GraphQL endpoints", "Understand WebSockets, JWT auth flows, and headers"] },
        { day: 6, focus: "Performance Optimization & Profiling", tasks: ["Profile slow queries, rendering bottlenecks and memory leaks", "Implement bundle splitting and caching mechanisms"] },
        { day: 7, focus: "Automated Testing & Code Quality", tasks: ["Write unit, integration, and E2E test suites", "Review code coverage and edge case handling"] },
        { day: 8, focus: "Security Best Practices & OWASP", tasks: ["Implement JWT, OAuth2, and RBAC authentication", "Mitigate OWASP Top 10 vulnerabilities"] },
        { day: 9, focus: "Database Design, Indexing & Query Tuning", tasks: ["Optimize SQL/NoSQL schemas and indexing", "Practice complex aggregations and query performance"] },
        { day: 10, focus: "DevOps, CI/CD & Containerization", tasks: ["Containerize applications with Docker", "Configure CI/CD pipelines and deployment strategies"] },
        { day: 11, focus: "System Design & High-Scalability Engineering", tasks: ["Design distributed systems with load balancers and queues", "Analyze latency, throughput, and failover trade-offs"] },
        { day: 12, focus: "Behavioral & Leadership Scenarios (STAR Method)", tasks: ["Prepare 5 STAR stories on conflict and leadership", "Practice behavioral responses with measurable impact"] },
        { day: 13, focus: "Live Coding & Algorithm Mock Challenge", tasks: ["Solve medium/hard algorithmic problems under time pressure", "Walk through logic and complexity aloud"] },
        { day: 14, focus: "Comprehensive Mock Interview & Final Polish", tasks: ["Conduct a complete timed end-to-end mock interview", "Review notes, refine answers, and prepare questions for interviewers"] }
    ]

    const defaultBehavioralQuestions = [
        {
            question: "Tell me about a time you faced a tight deadline with conflicting technical priorities. How did you deliver?",
            intention: "Evaluate time management, prioritization, and proactive stakeholder communication.",
            answer: "In a previous sprint, two mission-critical features were due simultaneously before an executive demo. I scheduled a quick 15-minute sync with the product manager, scoped out non-essential nice-to-haves, focused 100% on the core MVP path, and delivered 6 hours ahead of schedule with full test coverage."
        },
        {
            question: "Describe a situation where you had a technical disagreement with a team member or tech lead. How was it resolved?",
            intention: "Assess emotional intelligence, objective decision making, and collaboration.",
            answer: "A teammate proposed building a bespoke state management library while I advocated for Zustand. Instead of arguing opinion, I set up a quick 1-hour prototype benchmark comparing bundle size, boilerplate, and maintainability. Seeing the data, we agreed on Zustand and avoided 2 weeks of custom overhead."
        },
        {
            question: "Can you share an experience where a critical production bug occurred? What were your immediate actions?",
            intention: "Test composure under pressure, root cause analysis, and post-mortem accountability.",
            answer: "Following a release, users reported checkout errors due to an unhandled API payload. I immediately triggered a rollback to the stable version within 3 minutes to restore service, diagnosed the missing null check in logs, wrote unit tests reproducing the issue, and patched the fix with zero data loss."
        },
        {
            question: "How do you handle receiving critical or negative feedback during code reviews?",
            intention: "Evaluate growth mindset, lack of ego, and dedication to code quality.",
            answer: "I view code reviews as an opportunity for continuous learning. When a senior engineer highlighted that my query had an N+1 problem, I thanked them for catching it, asked them to review my updated indexing approach, and documented the pattern in our team engineering handbook."
        },
        {
            question: "Tell me about a time you had to learn a completely new technology or framework under tight time constraints.",
            intention: "Assess adaptability, fast learning capability, and resourcefulness.",
            answer: "When our project needed real-time dashboard updates, I had not used WebSockets with Redis Pub/Sub before. Over a weekend, I studied the protocol specifications, built a small sandbox proof-of-concept, and successfully implemented real-time notifications ahead of schedule."
        },
        {
            question: "Describe a scenario where you mentored a junior developer or onboarded a new team member.",
            intention: "Assess leadership, empathy, and knowledge sharing ability.",
            answer: "A new hire was struggling with our monorepo architecture and Git workflow. I set up daily 20-minute pair-programming sessions for their first week, created an interactive onboarding README, and guided them through their first successful pull request."
        },
        {
            question: "How do you balance writing clean, fully tested code with the business pressure to deliver quickly?",
            intention: "Evaluate pragmatic engineering, technical debt management, and business awareness.",
            answer: "I focus on high-risk pathways: core business logic and critical payment flows always get automated unit and integration tests. For UI cosmetic elements, I write modular components that can be iterated quickly, and log any intentional trade-offs in our backlog as technical debt tickets."
        },
        {
            question: "Tell me about a project that failed or didn't go as planned. What did you learn from the experience?",
            intention: "Test self-awareness, accountability, and resilience.",
            answer: "We launched an automated data export feature that timed out on enterprise accounts with millions of records. I took ownership of the issue, migrated the synchronous endpoint to an asynchronous background job with email notifications, and instituted load testing as a standard pre-launch requirement."
        }
    ];

    const defaultTechnicalQuiz = [
        {
            question: "Which data structure provides O(1) average time complexity for key lookup operations?",
            options: ["Hash Table / HashMap", "Binary Search Tree", "Linked List", "Array"],
            correctAnswer: "Hash Table / HashMap"
        },
        {
            question: "In database query optimization, which execution plan confirms that an index was successfully used?",
            options: ["Index Scan (IXSCAN)", "Collection Scan (COLLSCAN)", "Full Table Scan", "Projection Scan"],
            correctAnswer: "Index Scan (IXSCAN)"
        },
        {
            question: "Which HTTP header protects modern web applications against Cross-Site Scripting (XSS)?",
            options: ["Content-Security-Policy", "Access-Control-Allow-Origin", "Cache-Control", "Strict-Transport-Security"],
            correctAnswer: "Content-Security-Policy"
        },
        {
            question: "Which protocol provides full-duplex, low-latency bidirectional communication over a single TCP connection?",
            options: ["WebSockets", "HTTP/1.1", "Long Polling", "Server-Sent Events"],
            correctAnswer: "WebSockets"
        },
        {
            question: "In asynchronous JavaScript, which mechanism queues Promise callbacks?",
            options: ["Microtask queue", "Macrotask queue", "Timer thread", "I/O pool"],
            correctAnswer: "Microtask queue"
        },
        {
            question: "Which Docker instruction creates an isolated build stage that discards development dependencies from the final production container?",
            options: ["FROM node:18-alpine AS builder", "RUN npm install --production", "EXPOSE 8080", "VOLUME /data"],
            correctAnswer: "FROM node:18-alpine AS builder"
        },
        {
            question: "In Kubernetes, which controller guarantees that a copy of a pod runs on every single cluster node?",
            options: ["DaemonSet", "Deployment", "StatefulSet", "ReplicaSet"],
            correctAnswer: "DaemonSet"
        },
        {
            question: "Which ACID property guarantees that all operations in a database transaction succeed or all fail together?",
            options: ["Atomicity", "Consistency", "Isolation", "Durability"],
            correctAnswer: "Atomicity"
        }
    ];

    const behavioralQuestions = (Array.isArray(report.behavioralQuestions) && report.behavioralQuestions.length > 0)
        ? report.behavioralQuestions
        : defaultBehavioralQuestions;

    const technicalQuiz = (Array.isArray(report.technicalQuiz) && report.technicalQuiz.length > 0)
        ? report.technicalQuiz
        : defaultTechnicalQuiz;

    const preparationPlan = (Array.isArray(report.preparationPlan) && report.preparationPlan.length > 0)
        ? report.preparationPlan
        : default14DayPlan

    const skillGaps = (Array.isArray(report.skillGaps) && report.skillGaps.length >= 5)
        ? report.skillGaps
        : (Array.isArray(report.resumeAnalysis?.weaknesses) && report.resumeAnalysis.weaknesses.length >= 5
            ? report.resumeAnalysis.weaknesses.slice(0, 6).map((w, idx) => ({ skill: String(w).replace(/^Missing or weak:\s*/i, ''), severity: idx < 2 ? 'high' : 'medium' }))
            : [
                { skill: "System Design & Architecture", severity: "high" },
                { skill: "Performance Optimization & Profiling", severity: "high" },
                { skill: "Cloud Deployment & CI/CD", severity: "medium" },
                { skill: "Security Best Practices & OWASP", severity: "medium" },
                { skill: "Automated Testing & Code Quality", severity: "medium" },
                { skill: "Database Query Tuning & Indexing", severity: "low" }
            ])

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
                            disabled={loading || !canDownload}
                            style={!canDownload ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                            {loading ? 'Regenerating Resume...' : canDownload ? 'Regenerate Resume' : '🔒 Regenerate Resume'}
                        </button>
                        <button
                            onClick={() => setIsShareModalOpen(true)}
                            className='button secondary-button'
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '0.5rem', 
                                marginTop: '0.5rem'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                            Share with Professor
                        </button>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'analysis' && (
                        <section>
                            <div className='content-header'>
                                <h2>Candidate Resume Analysis & Score</h2>
                                <span className='content-header__count'>Match Score: {report.matchScore}%</span>
                            </div>
                            <ResumeAnalysisView report={report} />
                        </section>
                    )}

                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{(report.technicalQuestions || []).length} questions</span>
                            </div>
                            <div className='q-list'>
                                {(report.technicalQuestions || []).map((q, i) => (
                                    <QuestionCard 
                                        key={i} 
                                        item={q} 
                                        index={i} 
                                        evaluateAnswer={evaluateAnswer} 
                                        onAnswerSubmitted={handleAnswerSubmitted} 
                                        isAlreadyAnswered={submittedAnswers.some(a => a.question === q.question)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'quiz' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Quiz</h2>
                                <span className='content-header__count'>{technicalQuiz.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {technicalQuiz.map((q, i) => {
                                    const saved = submittedAnswers.find(a => a.question === q.question)
                                    return (
                                        <QuizCard 
                                            key={i} 
                                            item={q} 
                                            index={i} 
                                            savedAnswer={saved ? saved.answer : null}
                                            onAnswerSubmitted={handleAnswerSubmitted}
                                        />
                                    )
                                })}
                            </div>
                        </section>
                    )}


                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {behavioralQuestions.map((q, i) => (
                                    <QuestionCard 
                                        key={i} 
                                        item={q} 
                                        index={i} 
                                        evaluateAnswer={evaluateAnswer} 
                                        onAnswerSubmitted={handleAnswerSubmitted} 
                                        isAlreadyAnswered={submittedAnswers.some(a => a.question === q.question)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {preparationPlan.map((day) => (
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
                            {skillGaps.map((gap, i) => (
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