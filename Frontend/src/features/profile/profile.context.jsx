import React, { createContext, useState } from 'react';

export const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    return (
        <ProfileContext.Provider value={{ profile, setProfile, loading, setLoading }}>
            {children}
        </ProfileContext.Provider>
    );
};
