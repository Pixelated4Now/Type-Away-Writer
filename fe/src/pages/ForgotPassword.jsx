import React, { useEffect, useState } from 'react';
import './Auth.css'; // Reusing existing CSS file for consistency
import { useNavigate } from 'react-router-dom';


const ForgotPassword = () => {
    useEffect(() => {
        document.title = "Forgot Password | Type-Away-Writer";
    }, []);

    const navigate = useNavigate();


    const [email, setEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!email) {
            setEmailError('Please fill in this field.');
            return;
        } else if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address.');
            return;
        } else {
            setEmailError('');
        }

        setEmailSent(true);
        console.log("Reset link sent to:", email);
    };

    // Email format check.
    const validateEmail = (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    };

    return (
       
        <div className='wrapper'>
            <div className="heading">
                <h1>Reset Your Password</h1>
                <p>Set a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="input-box">
                    <label htmlFor="email">Your Email Address:</label>
                    <input type="text" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ border: emailError ? '1px solid #FF1212' : '' }} />
                {emailError && (
                    <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '6px' }}>
                        {emailError}
                    </p>
                )}
                </div>

                {/* Confirmation message */}
                {emailSent && (
                    <p style={{ color: '#EDF2F4', fontSize: '14px', marginTop: '50px', marginBottom: '4px' }}> Instructions to reset your password have been emailed to you. Please check your email.</p>
                )}

                <div className="button-group">
                    <button type="button" className="btn-back password-back-button" onClick={() => navigate('/')}>Back</button>
                    <button type="submit" className="btn-reset">Reset Password</button>
                </div>
            </form>
        </div>
    );
};

export default ForgotPassword;