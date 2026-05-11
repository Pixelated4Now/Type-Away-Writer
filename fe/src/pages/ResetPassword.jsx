import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import './Auth.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ResetPassword = () => {
    useEffect(() => { document.title = 'Reset Password | Type-Away-Writer'; }, []);

    const navigate                        = useNavigate();
    const [searchParams]                  = useSearchParams();
    const token                           = searchParams.get('token');

    const [showNew, setShowNew]           = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [newPassword, setNewPassword]   = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError]     = useState('');
    const [fieldsError, setFieldsError]         = useState({ newPassword: false, confirmPassword: false });
    const [serverError, setServerError]         = useState('');
    const [loading, setLoading]                 = useState(false);
    const [success, setSuccess]                 = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        const newFieldsError = { newPassword: !newPassword, confirmPassword: !confirmPassword };
        setFieldsError(newFieldsError);
        if (!newPassword || !confirmPassword) { setPasswordError(''); return; }

        if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,12}$/.test(newPassword)) {
            setPasswordError('format'); return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('mismatch'); return;
        }
        setPasswordError('');

        if (!token) {
            setServerError('Reset token is missing. Please use the link from your email.');
            return;
        }

        setLoading(true);
        try {
            const res  = await fetch(`${API}/auth/reset-password`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ token, newPassword }),
            });
            const data = await res.json();

            if (!res.ok) {
                setServerError(data.message || 'Reset failed. Please try again.');
                return;
            }

            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch {
            setServerError('A network error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wrapper">
            <div className="heading">
                <h1>Reset Your Password</h1>
                <p>Set a new password for your account.</p>
            </div>

            {success ? (
                <p style={{ color: '#EDF2F4', fontSize: '16px', marginTop: '32px', textAlign: 'center' }}>
                    Password reset successfully! Redirecting to login…
                </p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="input-box">
                        <label htmlFor="newPassword">New Password:</label>
                        <div className="password-box" style={{ border: passwordError || fieldsError.newPassword ? '1px solid #FF1212' : 'none' }}>
                            <input type={showNew ? 'text' : 'password'} id="newPassword"
                                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            <button className="password-eye" onClick={(e) => { e.preventDefault(); setShowNew(!showNew); }}>
                                {showNew ? <BsEyeSlash /> : <BsEye />}
                            </button>
                        </div>
                        {fieldsError.newPassword && (
                            <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '16px' }}>Please fill in this field.</p>
                        )}
                    </div>

                    <div className="input-box">
                        <label htmlFor="confirmPassword">Re-enter New Password:</label>
                        <div className="password-box" style={{ border: passwordError || fieldsError.confirmPassword ? '1px solid #FF1212' : 'none' }}>
                            <input type={showConfirm ? 'text' : 'password'} id="confirmPassword"
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                            <button className="password-eye" onClick={(e) => { e.preventDefault(); setShowConfirm(!showConfirm); }}>
                                {showConfirm ? <BsEyeSlash /> : <BsEye />}
                            </button>
                        </div>
                        {fieldsError.confirmPassword && (
                            <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '16px' }}>Please fill in this field.</p>
                        )}
                    </div>

                    {passwordError === 'mismatch' && (
                        <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '50px', marginBottom: '24px' }}>
                            <span style={{ fontWeight: 'bold' }}>Passwords don't match.</span> Make sure you've entered the same password in each field. Passwords are case-sensitive.
                        </p>
                    )}

                    <p style={{ color: passwordError === 'format' ? '#F64E4E' : '#EDF2F4', fontSize: '14px', marginTop: '8px' }}>
                        Password must include 6–12 characters, including letters and numbers.
                    </p>

                    {serverError && (
                        <p style={{ color: '#F64E4E', fontSize: '14px', marginTop: '8px' }}>{serverError}</p>
                    )}

                    <button type="submit" style={{ width: '100%', marginTop: '32px' }} disabled={loading}>
                        {loading ? 'Resetting…' : 'Reset Password'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ResetPassword;
