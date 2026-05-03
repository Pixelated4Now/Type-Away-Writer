import React, { useEffect, useState } from 'react';
import './Auth.css';
import { useNavigate } from 'react-router-dom';
import { BsEye, BsEyeSlash } from "react-icons/bs";

const ResetPassword = () => {
    useEffect(() => {
        document.title = "Reset Password | Type-Away-Writer";
    }, []);

    const navigate = useNavigate();
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Logic for resetting password goes here
        console.log("Password reset submitted");
    };

    return (
        <div className='wrapper'>
            <div className="heading">
                <h1>Reset Your Password</h1>
                <p>Set a new password for your account.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="input-box">
                    <label htmlFor="newPassword">New Password:</label>
                    <div className="password-box">
                        <input
                            type={showNew ? "text" : "password"}
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <button className='password-eye' onClick={(e) => { e.preventDefault(); setShowNew(!showNew); }}>
                            {showNew ? <BsEyeSlash /> : <BsEye />}
                        </button>
                    </div>
                </div>

                <div className="input-box">
                    <label htmlFor="confirmPassword">Re-enter New Password:</label>
                    <div className="password-box">
                        <input
                            type={showConfirm ? "text" : "password"}
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <button className='password-eye' onClick={(e) => { e.preventDefault(); setShowConfirm(!showConfirm); }}>
                            {showConfirm ? <BsEyeSlash /> : <BsEye />}
                        </button>
                    </div>
                </div>

                <button type="submit" style={{ width: '100%', marginTop: '32px' }}>Reset Password</button>
            </form>
        </div>
    );
};

export default ResetPassword;