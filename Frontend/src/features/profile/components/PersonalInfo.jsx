import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { useProfile } from '../hooks/useProfile';

const PersonalInfo = () => {
    const { profile, updateSection, updatePicture } = useProfile();
    const [formData, setFormData] = useState({
        fullName: '', phone: '', dob: '', gender: '', address: '', 
        linkedin: '', github: '', portfolio: '', summary: ''
    });

    // Image Cropper State
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                fullName: profile.fullName || '',
                phone: profile.phone || '',
                dob: profile.dob ? profile.dob.split('T')[0] : '',
                gender: profile.gender || '',
                address: profile.address || '',
                linkedin: profile.linkedin || '',
                github: profile.github || '',
                portfolio: profile.portfolio || '',
                summary: profile.summary || ''
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        const res = await updateSection('personal', formData);
        if (res.success) alert("Personal info updated successfully!");
    };

    const onFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            let imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
            setShowCropper(true);
        }
    };

    const readFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            const res = await updatePicture(croppedImage);
            if (res.success) {
                setShowCropper(false);
                setImageSrc(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className='personal-info-section'>
            <div className='header-flex' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h2>Personal Information</h2>
                    <p style={{ color: '#8b949e' }}>Update your basic details and profile picture.</p>
                </div>
                <div className='profile-pic-container' style={{ textAlign: 'center' }}>
                    <div 
                        style={{ 
                            width: '100px', height: '100px', borderRadius: '50%', background: '#21262d', 
                            border: '2px solid #30363d', overflow: 'hidden', marginBottom: '10px' 
                        }}
                    >
                        {profile?.profilePicture ? (
                            <img src={profile.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '3rem', lineHeight: '100px' }}>👤</span>
                        )}
                    </div>
                    <label className='button secondary-button' style={{ padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        Upload Photo
                        <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
                    </label>
                </div>
            </div>

            {showCropper && (
                <div className='cropper-modal' style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                    <div style={{ position: 'relative', flex: 1, background: '#161b22', borderRadius: '12px', overflow: 'hidden' }}>
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>
                    <div style={{ padding: '1rem', background: '#161b22', marginTop: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ color: '#c9d1d9' }}>Zoom:</span>
                        <input type="range" value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom" onChange={(e) => setZoom(e.target.value)} style={{ flex: 1 }} />
                        <button className='button secondary-button' onClick={() => setShowCropper(false)}>Cancel</button>
                        <button className='button primary-button' onClick={showCroppedImage}>Save Cropped Image</button>
                    </div>
                </div>
            )}

            <div className='form-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className='form-group'>
                    <label>Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className='panel__input' />
                </div>
                <div className='form-group'>
                    <label>Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className='panel__input' />
                </div>
                <div className='form-group'>
                    <label>Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className='panel__input' />
                </div>
                <div className='form-group'>
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className='panel__input' style={{ background: '#0d1117', color: '#c9d1d9' }}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                </div>
                <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                    <label>Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className='panel__input' />
                </div>
                <div className='form-group'>
                    <label>LinkedIn URL</label>
                    <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} className='panel__input' />
                </div>
                <div className='form-group'>
                    <label>GitHub URL</label>
                    <input type="url" name="github" value={formData.github} onChange={handleChange} className='panel__input' />
                </div>
                <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                    <label>Portfolio URL</label>
                    <input type="url" name="portfolio" value={formData.portfolio} onChange={handleChange} className='panel__input' />
                </div>
                <div className='form-group' style={{ gridColumn: '1 / -1' }}>
                    <label>Professional Summary</label>
                    <textarea name="summary" value={formData.summary} onChange={handleChange} className='panel__textarea' rows={4} placeholder="Brief summary about yourself..." />
                </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button className='button primary-button' onClick={handleSave}>Save Personal Info</button>
            </div>
        </div>
    );
};

export default PersonalInfo;
