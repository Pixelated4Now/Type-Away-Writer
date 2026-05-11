import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Login = () => {
    useEffect(() => { document.title = 'Log in | Type-Away-Writer'; }, []);

    const { login } = useAuth();
    const navigate  = useNavigate();

    const [show, setShow]                 = useState(false);
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [emailError, setEmailError]     = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [serverError, setServerError]   = useState('');
    const [loading, setLoading]           = useState(false);

    const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');

        let valid = true;
        if (!email) { setEmailError('Please fill in this field.'); valid = false; }
        else if (!validateEmail(email)) { setEmailError('Please enter a valid email address.'); valid = false; }
        else setEmailError('');

        if (!password) { setPasswordError('Please fill in this field.'); valid = false; }
        else setPasswordError('');

        if (!valid) return;

        setLoading(true);
        try {
            const res  = await fetch(`${API}/auth/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setServerError(data.message || 'Login failed. Please try again.');
                return;
            }

            login(data.token, data.user);
            navigate('/dashboard');
        } catch {
            setServerError('A network error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wrapper">
            <div className="heading">
                <img src="/favicon.png" alt="Type-Away-Writer logo" />
                <h1>Welcome Back!</h1>
                <p>Login to continue</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="input-box">
                    <label htmlFor="email">Email Address:</label>
                    <input
                        type="text"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ border: emailError ? '1px solid #FF1212' : '' }}
                    />
                    {emailError && (
                        <p style={{ color: '#F64E4E', fontSize: '12px', marginTop: '3px' }}>{emailError}</p>
                    )}
                </div>

                <div className="input-box">
                    <label htmlFor="pwd">Password:</label>
                    <div className="password-box" style={{ border: passwordError ? '1px solid #FF1212' : '' }}>
                        <input
                            type={show ? 'text' : 'password'}
                            id="pwd"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button className="password-eye" onClick={(e) => { e.preventDefault(); setShow(!show); }}>
                            {show ? <BsEyeSlash /> : <BsEye />}
                        </button>
                    </div>
                    {passwordError && (
                        <p style={{ color: '#F64E4E', fontSize: '12px', marginTop: '3px', marginBottom: '8px' }}>{passwordError}</p>
                    )}
                </div>

                <div className="forgot">
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>

                {serverError && (
                    <p style={{ color: '#F64E4E', fontSize: '14px', marginBottom: '12px' }}>{serverError}</p>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in…' : 'Log in'}
                </button>

                <div className="register-link">
                    <p>Don't have an account? <Link to="/register">Register</Link>.</p>
                </div>
            </form>
        </div>
    );
};

export default Login;
