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
    const [passwordError, setPasswordError] = useState('');
    // For presence check
    const [fieldsError, setFieldsError] = useState({ newPassword: false, confirmPassword: false });


    const handleSubmit = (e) => {
        e.preventDefault();

        const newFieldsError = {
            newPassword: !newPassword,
            confirmPassword: !confirmPassword,
        };
        setFieldsError(newFieldsError);

        if (!newPassword || !confirmPassword) {
            setPasswordError('');
            return;
        }

        // Format check.
        if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,12}$/.test(newPassword)) {
            setPasswordError('format');
            return;
        }

        // Match check.
        if (newPassword !== confirmPassword) {
            setPasswordError('mismatch');
            return;
        }

        // All checks passed.
        setPasswordError('');
        navigate('/');
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
                    <div className="password-box" style={{ border: passwordError || fieldsError.newPassword ? '1px solid #FF1212' : 'none' }}>
                        <input
                            type={showNew ? "text" : "password"}
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button className='password-eye' onClick={(e) => { e.preventDefault(); setShowNew(!showNew); }}>
                            {showNew ? <BsEyeSlash /> : <BsEye />}
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {(fieldsError.newPassword) && (
                    <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '16px' }}>
                        Please fill in this field.
                    </p>
                )}

                <div className="input-box">
                    <label htmlFor="confirmPassword">Re-enter New Password:</label>
                    <div className="password-box" style={{ border: passwordError || fieldsError.confirmPassword ? '1px solid #FF1212' : 'none' }}>
                        <input
                            type={showConfirm ? "text" : "password"}
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button className='password-eye' onClick={(e) => { e.preventDefault(); setShowConfirm(!showConfirm); }}>
                            {showConfirm ? <BsEyeSlash /> : <BsEye />}
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {(fieldsError.confirmPassword) && (
                    <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '16px' }}>
                        Please fill in this field.
                    </p>
                )}
                {passwordError === 'mismatch' && (
                    <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '50px', marginBottom: '24px' }}>
                        <span style={{ fontWeight: 'bold' }}>Passwords don't match.</span> Make sure you've entered the same password in each field. Passwords are case-sensitive.
                    </p>
                )}
                <p style={{ color: passwordError === 'format' ? '#F64E4E' : '#EDF2F4', fontSize: '14px', marginTop: '8px'}}> 
                    Password must include 6–12 characters, including letters and numbers.
                </p>
                <button type="submit" style={{ width: '100%', marginTop: '32px' }}>Reset Password</button>
            </form>
        </div>
    );
};

export default ResetPassword;