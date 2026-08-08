import React, { useEffect, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useNavigate } from 'react-router';
import PersonalInfo from '../components/PersonalInfo';
import EducationForm from '../components/EducationForm';
import ExperienceForm from '../components/ExperienceForm';
import ProjectsForm from '../components/ProjectsForm';
import SkillsForm from '../components/SkillsForm';
import AchievementsForm from '../components/AchievementsForm';
import DocumentsForm from '../components/DocumentsForm';
import ShareModal from '../components/ShareModal';
import '../style/profile.scss';

const SECTIONS = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'documents', label: 'Documents', icon: '📄' },
];

const ProfileDashboard = () => {
    const { loading, profile, fetchProfile } = useProfile();
    const [activeSection, setActiveSection] = useState('personal');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const completion = profile?.completionPercentage || 0;
    
    // SVG ring calculations
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (completion / 100) * circumference;

    return (
        <div className='profile-dashboard'>
            {/* Top Navigation */}
            <nav className='top-navbar'>
                <span className='top-navbar__brand' onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>🎯 MockMate AI</span>
                <div className='top-navbar__right'>
                    <button className='top-navbar__profile' onClick={() => navigate('/')}>Back to Home</button>
                </div>
            </nav>

            <div className='profile-container'>
                {/* Sidebar */}
                <aside className='profile-sidebar'>
                    <div className='profile-sidebar__header'>
                        <h3>Student Profile</h3>
                        <div className='completion-ring-container'>
                            <svg width="120" height="120" viewBox="0 0 120 120" className="completion-ring">
                                <circle 
                                    className="completion-ring__bg" 
                                    cx="60" cy="60" r={radius} 
                                />
                                <circle 
                                    className="completion-ring__progress" 
                                    cx="60" cy="60" r={radius} 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </svg>
                            <div className='completion-ring__text'>
                                <span className='value'>{completion}%</span>
                            </div>
                        </div>
                        <p className='completion-label'>Profile Completeness</p>
                        {completion < 100 && <p className='completion-tip'>Tip: Complete all sections to boost your resume score!</p>}
                        
                        <button 
                            className='button secondary-button' 
                            style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            onClick={() => setIsShareModalOpen(true)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                            Share Profile
                        </button>
                    </div>

                    <nav className='profile-sidebar__nav'>
                        {SECTIONS.map(sec => (
                            <button 
                                key={sec.id}
                                className={`nav-item ${activeSection === sec.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(sec.id)}
                            >
                                <span className='nav-icon'>{sec.icon}</span>
                                {sec.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className='profile-main'>
                    {loading && !profile ? (
                        <div className='loading-spinner'>Loading your profile...</div>
                    ) : (
                        <div className='profile-section-content'>
                            {activeSection === 'personal' && <PersonalInfo />}
                            {activeSection === 'education' && <EducationForm />}
                            {activeSection === 'experience' && <ExperienceForm />}
                            {activeSection === 'projects' && <ProjectsForm />}
                            {activeSection === 'skills' && <SkillsForm />}
                            {activeSection === 'achievements' && <AchievementsForm />}
                            {activeSection === 'documents' && <DocumentsForm />}
                        </div>
                    )}
                </main>
            </div>

            <ShareModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                // interviewReportId is null here since it's just the general profile
            />
        </div>
    );
};

export default ProfileDashboard;
