import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 1970 + 7 }, (_, i) => 1970 + i);

const EducationForm = () => {
    const { profile, updateSection } = useProfile();
    const [educationList, setEducationList] = useState([]);
    
    useEffect(() => {
        if (profile?.education) setEducationList(profile.education);
    }, [profile]);

    const handleAdd = () => {
        setEducationList([{ degree: '', branch: '', college: '', startYear: '', endYear: '', scoreType: 'CGPA', score: '' }, ...educationList]);
    };

    const handleChange = (index, e) => {
        const updated = [...educationList];
        updated[index][e.target.name] = e.target.value;
        setEducationList(updated);
    };

    const handleDelete = (index) => {
        const updated = [...educationList];
        updated.splice(index, 1);
        setEducationList(updated);
    };

    const handleSave = async () => {
        // Basic validation
        for (let ed of educationList) {
            if (!ed.degree || !ed.college || !ed.startYear || !ed.endYear || !ed.score) {
                alert("Please fill all required fields in Education.");
                return;
            }
            if (ed.scoreType === 'CGPA' && (ed.score < 0 || ed.score > 10)) {
                alert("CGPA must be between 0 and 10");
                return;
            }
            if (ed.scoreType === 'Percentage' && (ed.score < 0 || ed.score > 100)) {
                alert("Percentage must be between 0 and 100");
                return;
            }
        }
        
        const res = await updateSection('education', educationList);
        if (res.success) alert("Education updated successfully!");
    };

    return (
        <div className='profile-section-form'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>Education Records</h2>
                    <p style={{ color: '#8b949e' }}>Add your academic qualifications.</p>
                </div>
                <button className='button secondary-button' onClick={handleAdd}>+ Add Education</button>
            </div>

            {educationList.map((ed, index) => (
                <div key={index} style={{ background: '#21262d', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #30363d' }}>
                    <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className='form-group'>
                            <label>Degree (e.g. B.Tech, HSC)</label>
                            <input type="text" name="degree" value={ed.degree} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group'>
                            <label>Branch / Specialization</label>
                            <input type="text" name="branch" value={ed.branch} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                            <label>College / School Name</label>
                            <input type="text" name="college" value={ed.college} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group'>
                            <label>Start Year</label>
                            <select name="startYear" value={ed.startYear} onChange={(e) => handleChange(index, e)} className='panel__input' style={{ background: '#0d1117', color: '#c9d1d9' }}>
                                <option value="">Select year...</option>
                                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className='form-group'>
                            <label>End Year (or Expected)</label>
                            <select name="endYear" value={ed.endYear} onChange={(e) => handleChange(index, e)} className='panel__input' style={{ background: '#0d1117', color: '#c9d1d9' }}>
                                <option value="">Select year...</option>
                                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className='form-group'>
                            <label>Score Type</label>
                            <select name="scoreType" value={ed.scoreType} onChange={(e) => handleChange(index, e)} className='panel__input' style={{ background: '#0d1117' }}>
                                <option value="CGPA">CGPA (out of 10)</option>
                                <option value="Percentage">Percentage (out of 100)</option>
                            </select>
                        </div>
                        <div className='form-group'>
                            <label>Score</label>
                            <input type="number" step="0.1" name="score" value={ed.score} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <button className='button secondary-button' style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }} onClick={() => handleDelete(index)}>Remove</button>
                    </div>
                </div>
            ))}

            {educationList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e', border: '1px dashed #30363d', borderRadius: '8px' }}>
                    No education records added yet.
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button className='button primary-button' onClick={handleSave}>Save Education</button>
            </div>
        </div>
    );
};

export default EducationForm;
