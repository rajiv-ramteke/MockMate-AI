import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';

const CATEGORIES = ['Programming Languages', 'Frameworks & Libraries', 'Databases', 'Cloud & DevOps', 'Tools', 'Soft Skills'];

const SkillsForm = () => {
    const { profile, updateSection } = useProfile();
    const [skillList, setSkillList] = useState([]);
    
    useEffect(() => {
        if (profile?.skills) setSkillList(profile.skills);
    }, [profile]);

    const handleAdd = () => {
        setSkillList([{ category: 'Programming Languages', name: '', level: 'Intermediate' }, ...skillList]);
    };

    const handleChange = (index, e) => {
        const updated = [...skillList];
        updated[index][e.target.name] = e.target.value;
        setSkillList(updated);
    };

    const handleDelete = (index) => {
        const updated = [...skillList];
        updated.splice(index, 1);
        setSkillList(updated);
    };

    const handleSave = async () => {
        for (let skill of skillList) {
            if (!skill.name) {
                alert("Skill name is required.");
                return;
            }
        }
        
        const res = await updateSection('skills', skillList);
        if (res.success) alert("Skills updated successfully!");
    };

    return (
        <div className='profile-section-form'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>Skills</h2>
                    <p style={{ color: '#8b949e' }}>Add your technical and soft skills.</p>
                </div>
                <button className='button secondary-button' onClick={handleAdd}>+ Add Skill</button>
            </div>

            <div className='skills-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {skillList.map((skill, index) => (
                    <div key={index} style={{ background: '#21262d', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d', position: 'relative' }}>
                        <button 
                            onClick={() => handleDelete(index)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}
                        >
                            ✖
                        </button>
                        <div className='form-group' style={{ marginBottom: '0.5rem' }}>
                            <label>Category</label>
                            <select name="category" value={skill.category} onChange={(e) => handleChange(index, e)} className='panel__input' style={{ background: '#0d1117', padding: '0.5rem' }}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className='form-group' style={{ marginBottom: '0.5rem' }}>
                            <label>Skill Name</label>
                            <input type="text" name="name" value={skill.name} onChange={(e) => handleChange(index, e)} className='panel__input' style={{ padding: '0.5rem' }} placeholder="e.g. React" />
                        </div>
                        <div className='form-group' style={{ marginBottom: 0 }}>
                            <label>Level</label>
                            <select name="level" value={skill.level} onChange={(e) => handleChange(index, e)} className='panel__input' style={{ background: '#0d1117', padding: '0.5rem' }}>
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {skillList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e', border: '1px dashed #30363d', borderRadius: '8px' }}>
                    No skills added yet.
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button className='button primary-button' onClick={handleSave}>Save Skills</button>
            </div>
        </div>
    );
};

export default SkillsForm;
