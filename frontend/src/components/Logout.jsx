// src/pages/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Remove stored token and user info used by this app
        localStorage.removeItem('token');
        localStorage.removeItem('userId');

        try {
            // clear axios default auth header if set
            // eslint-disable-next-line global-require
            const axios = require('axios');
            delete axios.defaults.headers.common['Authorization'];
        } catch (err) {
            // ignore if axios is not available here
        }

        // Force a full reload to ensure App's state is re-evaluated (App reads localStorage on mount)
        // Using navigate() alone won't reset App's in-memory isAuthenticated flag.
        window.location.href = '/login';
    }, []);

    return null; 
};

export default Logout;
