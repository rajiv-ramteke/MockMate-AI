import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';

const ExperienceForm = () => {
    const { profile, updateSection } = useProfile();
    const [expList, setExpList] = useState([]);
    
    useEffect(() => {
        if (profile?.experience) {
            // Format dates for input type="date"
            const formatted = profile.experience.map(exp => ({
                ...exp,
                startDate: exp.startDate ? exp.startDate.split('T')[0] : '',
                endDate: exp.endDate ? exp.endDate.split('T')[0] : ''
            }));
            setExpList(formatted);
        }
    }, [profile]);

    const handleAdd = () => {
        setExpList([{ type: 'Full-Time', role: '', company: '', startDate: '', endDate: '', isCurrent: false, description: '' }, ...expList]);
    };

    const handleChange = (index, e) => {
        const updated = [...expList];
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        updated[index][e.target.name] = value;
        if (e.target.name === 'isCurrent' && value) {
            updated[index].endDate = '';
        }
        setExpList(updated);
    };

    const handleDelete = (index) => {
        const updated = [...expList];
        updated.splice(index, 1);
        setExpList(updated);
    };

    const handleSave = async () => {
        // Validation
        const today = new Date().toISOString().split('T')[0];
        for (let exp of expList) {
            if (!exp.role || !exp.company || !exp.startDate) {
                alert("Please fill all required fields in Experience.");
                return;
            }
            if (exp.startDate > today) {
                alert("Start date cannot be in the future.");
                return;
            }
            if (!exp.isCurrent && exp.endDate && exp.startDate > exp.endDate) {
                alert("End date cannot be before start date.");
                return;
            }
        }
        
        const res = await updateSection('experience', expList);
        if (res.success) alert("Experience updated successfully!");
    };

    return (
        <div className='profile-section-form'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>Work Experience</h2>
                    <p style={{ color: '#8b949e' }}>Add your professional experience and internships.</p>
                </div>
                <button className='button secondary-button' onClick={handleAdd}>+ Add Experience</button>
            </div>

            {expList.map((exp, index) => (
                <div key={index} style={{ background: '#21262d', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #30363d' }}>
                    <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className='form-group'>
                            <label>Employment Type</label>
                            <select name="type" value={exp.type} onChange={(e) => handleChange(index, e)} className='panel__input' style={{ background: '#0d1117' }}>
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Internship">Internship</option>
                                <option value="Freelance">Freelance</option>
                            </select>
                        </div>
                        <div className='form-group'>
                            <label>Company Name</label>
                            <input type="text" name="company" value={exp.company} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                            <label>Role / Title</label>
                            <input type="text" name="role" value={exp.role} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group'>
                            <label>Start Date</label>
                            <input type="date" name="startDate" value={exp.startDate} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group'>
                            <label>End Date</label>
                            <input type="date" name="endDate" value={exp.endDate} disabled={exp.isCurrent} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group' style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" name="isCurrent" checked={exp.isCurrent} onChange={(e) => handleChange(index, e)} id={`current-${index}`} />
                            <label htmlFor={`current-${index}`} style={{ margin: 0, cursor: 'pointer' }}>I currently work here</label>
                        </div>
                        <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                            <label>Description</label>
                            <textarea name="description" value={exp.description} onChange={(e) => handleChange(index, e)} className='panel__textarea' rows={3} placeholder="Describe your responsibilities and achievements..." />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <button className='button secondary-button' style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }} onClick={() => handleDelete(index)}>Remove</button>
                    </div>
                </div>
            ))}

            {expList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e', border: '1px dashed #30363d', borderRadius: '8px' }}>
                    No experience records added yet.
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button className='button primary-button' onClick={handleSave}>Save Experience</button>
            </div>
        </div>
    );
};

export default ExperienceForm;
