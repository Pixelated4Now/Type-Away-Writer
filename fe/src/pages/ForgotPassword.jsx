import React, { useEffect, useState } from 'react';
import './Auth.css'; // Reusing existing CSS file for consistency

const ResetPassword = () => {
    useEffect(() => {
        document.title = "Reset Password | Type-Away-Writer";
    }, []);


    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Logic for sending reset link goes here
        console.log("Reset link sent to:", email);
    };

    return (
       
        <div className='wrapper reset-wrapper'>
            <div className="heading">
                <h1>Reset Your Password</h1>
                <p>Set a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="input-box">
                    <label htmlFor="email">Your Email Address:</label>
                    <input 
                        type="email" 
                        id="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                    />
                </div>

                <div className="button-group">
                    <button type="button" className="btn-back password-back-button">Back</button>
                    <button type="submit" className="btn-reset">Reset Password</button>
                </div>
            </form>
        </div>
    );
};

export default ResetPassword;