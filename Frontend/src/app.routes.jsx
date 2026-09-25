import { createBrowserRouter } from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import VerifyOtp from "./features/auth/pages/VerifyOtp";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import ProfileDashboard from "./features/profile/pages/ProfileDashboard";
import { ProfileProvider } from "./features/profile/profile.context";
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import AdminProtected from "./features/admin/components/AdminProtected";


export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/forgot-password",
        element: <ForgotPassword />
    },
    {
        path: "/reset-password/:token",
        element: <ResetPassword />
    },
    {
        path: "/verify-otp",
        element: <VerifyOtp />
    },
    {
        path: "/",
        element: <Protected><Home /></Protected>
    },
    {
        path:"/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },
    {
        path: "/profile",
        element: <Protected><ProfileProvider><ProfileDashboard /></ProfileProvider></Protected>
    },
    {
        path: "/admin",
        element: <AdminProtected><AdminDashboard /></AdminProtected>
    }
])