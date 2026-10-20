import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Browsers cap setTimeout at ~24.8 days (2^31 - 1 ms), so expiry is re-checked at most once a day.
const MAX_TIMER_MS = 24 * 60 * 60 * 1000;

// Returns the token's expiry time in ms (from the JWT "exp" claim), or null if it can't be read.
const getTokenExpiry = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
};

const isTokenExpired = (token) => {
    const expiry = getTokenExpiry(token);
    return expiry === null || expiry <= Date.now();
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setUser(null);
    }, []);

    // Logs out because the session ran out; the login page shows a message explaining why.
    const expireSession = useCallback(() => {
        sessionStorage.setItem('sessionExpired', '1');
        logout();
    }, [logout]);

    // Rehydrate session from localStorage on first load.
    useEffect(() => {
        // Checks localStorage for a previously saved token and user object.
        const token = localStorage.getItem('authToken');
        const stored = localStorage.getItem('authUser');
        if (token && stored) {
            if (isTokenExpired(token)) {
                // Token is past its 30-day lifetime, so the user must log in again.
                expireSession();
            } else {
                try {
                    // Restores the user's session so they do not have to log in again every time they refresh the page or reopen the browser.
                    setUser(JSON.parse(stored));
                } catch {
                    // Remove if user data is corrupted and log user out.
                    logout();
                }
            }
        }
        // Check is complete.
        setLoading(false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // While logged in, log out automatically when the token expires.
    useEffect(() => {
        if (!user) return;
        let timer;

        const check = () => {
            const token = localStorage.getItem('authToken');
            if (!token || isTokenExpired(token)) { expireSession(); return; }
            const remaining = getTokenExpiry(token) - Date.now();
            timer = setTimeout(check, Math.min(remaining, MAX_TIMER_MS));
        };
        check();

        // Timers can be delayed while a laptop sleeps or a tab is in the background, so re-check on return.
        const onVisible = () => {
            if (document.visibilityState === 'visible') { clearTimeout(timer); check(); }
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [user, expireSession]);

    // After successful login or email verification.
    const login = (token, userData) => {
        // Saves JWT token and user object.
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(userData));
        sessionStorage.removeItem('sessionExpired');
        // Updates React to reflect user is now logged in.
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to access the authentication context.
export const useAuth = () => useContext(AuthContext);
