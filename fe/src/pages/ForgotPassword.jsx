import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ForgotPassword = () => {
    useEffect(() => { document.title = 'Forgot Password | Type-Away-Writer'; }, []);

    const navigate = useNavigate();

    const [email, setEmail]             = useState('');
    const [emailSent, setEmailSent]     = useState(false);
    const [emailError, setEmailError]   = useState('');
    const [serverError, setServerError] = useState('');
    const [loading, setLoading]         = useState(false);

    const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        if (!email) { setEmailError('Please fill in this field.'); return; }
        if (!validateEmail(email)) { setEmailError('Please enter a valid email address.'); return; }
        setEmailError('');

        setLoading(true);
        try {
            const res  = await fetch(`${API}/auth/forgot-password`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) {
                setServerError(data.message || 'Something went wrong. Please try again.');
                return;
            }

            setEmailSent(true);
        } catch {
            setServerError('A network error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
        <div className="wrapper">
            <div className="heading">
                <h1>Reset Your Password</h1>
                <p>Set a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="input-box">
                    <label htmlFor="email">Your Email Address:</label>
                    <input type="text" id="email" value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ border: emailError ? '1px solid #FF1212' : '' }} />
                    {emailError && (
                        <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '6px' }}>{emailError}</p>
                    )}
                </div>

                {emailSent && (
                    <p style={{ color: '#EDF2F4', fontSize: '12px', marginTop: '50px', marginBottom: '4px' }}>
                        Instructions to reset your password have been emailed to you. Please check your email.
                    </p>
                )}

                {serverError && (
                    <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '8px' }}>{serverError}</p>
                )}

                <div className="button-group">
                    <button type="button" className="btn-back password-back-button" onClick={() => navigate('/')}>Back</button>
                    <button type="submit" className="btn-reset" disabled={loading || emailSent}>
                        {loading ? 'Sending…' : 'Reset Password'}
                    </button>
                </div>
            </form>
        </div>
        </div>
    );
};

export default ForgotPassword;
