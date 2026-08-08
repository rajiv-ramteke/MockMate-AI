import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';

const AchievementsForm = () => {
    const { profile, updateSection } = useProfile();
    const [achList, setAchList] = useState([]);
    
    useEffect(() => {
        if (profile?.achievements) {
            const formatted = profile.achievements.map(a => ({
                ...a,
                date: a.date ? a.date.split('T')[0] : ''
            }));
            setAchList(formatted);
        }
    }, [profile]);

    const handleAdd = () => {
        setAchList([{ type: 'Award', title: '', date: '', description: '' }, ...achList]);
    };

    const handleChange = (index, e) => {
        const updated = [...achList];
        updated[index][e.target.name] = e.target.value;
        setAchList(updated);
    };

    const handleDelete = (index) => {
        const updated = [...achList];
        updated.splice(index, 1);
        setAchList(updated);
    };

    const handleSave = async () => {
        const today = new Date().toISOString().split('T')[0];
        
        for (let ach of achList) {
            if (!ach.title || !ach.date) {
                alert("Title and Date are required for all achievements.");
                return;
            }
            if (ach.date > today) {
                alert("Achievement date cannot be in the future.");
                return;
            }
            if (ach.date < '1950-01-01') {
                alert("Achievement date is invalid (before 1950).");
                return;
            }
        }
        
        const res = await updateSection('achievements', achList);
        if (res.success) alert("Achievements updated successfully!");
    };

    return (
        <div className='profile-section-form'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>Achievements & Certifications</h2>
                    <p style={{ color: '#8b949e' }}>Add your awards, hackathon wins, and certifications.</p>
                </div>
                <button className='button secondary-button' onClick={handleAdd}>+ Add Achievement</button>
            </div>

            {achList.map((ach, index) => (
                <div key={index} style={{ background: '#21262d', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #30363d' }}>
                    <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className='form-group'>
                            <label>Type</label>
                            <select name="type" value={ach.type} onChange={(e) => handleChange(index, e)} className='panel__input' style={{ background: '#0d1117' }}>
                                <option value="Award">Award</option>
                                <option value="Certification">Certification</option>
                                <option value="Hackathon">Hackathon</option>
                                <option value="Publication">Publication</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className='form-group'>
                            <label>Title</label>
                            <input type="text" name="title" value={ach.title} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group'>
                            <label>Date</label>
                            <input type="date" name="date" value={ach.date} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                            <label>Description</label>
                            <textarea name="description" value={ach.description} onChange={(e) => handleChange(index, e)} className='panel__textarea' rows={2} placeholder="Brief details about this achievement..." />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <button className='button secondary-button' style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }} onClick={() => handleDelete(index)}>Remove</button>
                    </div>
                </div>
            ))}

            {achList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e', border: '1px dashed #30363d', borderRadius: '8px' }}>
                    No achievements added yet.
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button className='button primary-button' onClick={handleSave}>Save Achievements</button>
            </div>
        </div>
    );
};

export default AchievementsForm;
