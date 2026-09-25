import { useAuth } from "../../auth/hooks/useAuth";
import { Navigate } from "react-router";
import React from "react";

/**
 * AdminProtected - Only allows users with role === 'admin' to access children.
 * Redirects non-admins to home, and unauthenticated users to login.
 */
const AdminProtected = ({ children }) => {
    const { loading, user } = useAuth();

    if (loading) {
        return (
            <main style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                height: "100vh", backgroundColor: "#060a10", color: "#e6edf3"
            }}>
                <div className="admin-loading-spin" />
            </main>
        );
    }

    if (!user) return <Navigate to="/login" />;
    if (user.role !== "admin") return <Navigate to="/" />;

    return children;
};

export default AdminProtected;
