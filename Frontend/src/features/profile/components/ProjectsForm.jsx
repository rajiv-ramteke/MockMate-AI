import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';

const ProjectsForm = () => {
    const { profile, updateSection } = useProfile();
    const [projectList, setProjectList] = useState([]);
    
    useEffect(() => {
        if (profile?.projects) {
            const formatted = profile.projects.map(proj => ({
                ...proj,
                technologies: proj.technologies ? proj.technologies.join(', ') : ''
            }));
            setProjectList(formatted);
        }
    }, [profile]);

    const handleAdd = () => {
        setProjectList([{ title: '', role: '', technologies: '', description: '', contribution: '', githubUrl: '', liveUrl: '' }, ...projectList]);
    };

    const handleChange = (index, e) => {
        const updated = [...projectList];
        updated[index][e.target.name] = e.target.value;
        setProjectList(updated);
    };

    const handleDelete = (index) => {
        const updated = [...projectList];
        updated.splice(index, 1);
        setProjectList(updated);
    };

    const handleSave = async () => {
        for (let proj of projectList) {
            if (!proj.title) {
                alert("Project Title is required.");
                return;
            }
        }
        
        // Format technologies back to array
        const payload = projectList.map(proj => ({
            ...proj,
            technologies: proj.technologies ? proj.technologies.split(',').map(t => t.trim()).filter(Boolean) : []
        }));

        const res = await updateSection('projects', payload);
        if (res.success) alert("Projects updated successfully!");
    };

    return (
        <div className='profile-section-form'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2>Projects Portfolio</h2>
                    <p style={{ color: '#8b949e' }}>Showcase your academic and personal projects.</p>
                </div>
                <button className='button secondary-button' onClick={handleAdd}>+ Add Project</button>
            </div>

            {projectList.map((proj, index) => (
                <div key={index} style={{ background: '#21262d', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #30363d' }}>
                    <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                            <label>Project Title</label>
                            <input type="text" name="title" value={proj.title} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group'>
                            <label>Your Role</label>
                            <input type="text" name="role" value={proj.role} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group'>
                            <label>Technologies Used (comma separated)</label>
                            <input type="text" name="technologies" value={proj.technologies} onChange={(e) => handleChange(index, e)} className='panel__input' placeholder="React, Node.js, MongoDB" />
                        </div>
                        <div className='form-group'>
                            <label>GitHub URL</label>
                            <input type="url" name="githubUrl" value={proj.githubUrl} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group'>
                            <label>Live URL</label>
                            <input type="url" name="liveUrl" value={proj.liveUrl} onChange={(e) => handleChange(index, e)} className='panel__input' />
                        </div>
                        <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                            <label>Description</label>
                            <textarea name="description" value={proj.description} onChange={(e) => handleChange(index, e)} className='panel__textarea' rows={3} placeholder="What is the project about?" />
                        </div>
                        <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                            <label>Your Contribution / Methodology</label>
                            <textarea name="contribution" value={proj.contribution} onChange={(e) => handleChange(index, e)} className='panel__textarea' rows={2} placeholder="What exactly did you do?" />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                        <button className='button secondary-button' style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }} onClick={() => handleDelete(index)}>Remove</button>
                    </div>
                </div>
            ))}

            {projectList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8b949e', border: '1px dashed #30363d', borderRadius: '8px' }}>
                    No projects added yet.
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button className='button primary-button' onClick={handleSave}>Save Projects</button>
            </div>
        </div>
    );
};

export default ProjectsForm;
