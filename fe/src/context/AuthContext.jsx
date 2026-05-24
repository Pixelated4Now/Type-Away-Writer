import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Rehydrate session from localStorage on first load.
    useEffect(() => {
        // Checks localStorage for a previously saved token and user object.
        const token = localStorage.getItem('authToken');
        const stored = localStorage.getItem('authUser');
        if (token && stored) {
            try {
                // Restores the user's session so they do not have to log in again every time they refresh the page or reopen the browser.
                setUser(JSON.parse(stored));
            } catch {
                // Remove if user data is corrupted and log user out.
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
            }
        }
        // Check is complete.
        setLoading(false);
    }, []);

    // After successful login or email verification.
    const login = (token, userData) => {
        // Saves JWT token and user object.
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(userData));
        // Updates React to reflect user is now logged in.
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to access the authentication context.
export const useAuth = () => useContext(AuthContext);
