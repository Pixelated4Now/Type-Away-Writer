import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import './Register.css';

const API         = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const TOTAL_STEPS = 4;

const stepLabels = {
    1: 'Your Account',
    2: 'More about you',
    3: 'Your Email',
    4: 'Email Verification',
};

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS  = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 10 }, (_, i) => 2011 + i); // 2011–2020

const StepIndicator = ({ current }) => (
    <div className="step-indicator">
        {[1, 2, 3, 4].map((step, i) => (
            <div key={step} className="step-item">
                {i > 0 && <div className={`step-line ${current > i ? 'done' : ''}`} />}
                <div className={`step-circle ${current === step ? 'active' : ''} ${current > step ? 'done' : ''}`}>
                    {step}
                </div>
            </div>
        ))}
        <p className="step-label">{stepLabels[current]}</p>
    </div>
);

const selectStyle = (hasError) => ({
    width: '100%', height: '42px', backgroundColor: '#EDF2F4',
    border: hasError ? '1px solid #FF1212' : '2px solid rgba(255,255,255,0.2)',
    borderRadius: '10px', color: '#000', padding: '0 12px',
    fontSize: '16px', cursor: 'pointer', outline: 'none',
});

const RegisterStudent = () => {
    const navigate   = useNavigate();
    const { login }  = useAuth();
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        username: '', password: '', confirmPassword: '',
        birthDay: '', birthMonth: '', birthYear: '',
        email: '', agreedToTerms: false, verificationCode: '',
    });

    const [errors, setErrors]           = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading]         = useState(false);
    const [userId, setUserId]           = useState(null); // set after registration call

    const update = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev)   => ({ ...prev, [field]: '' }));
        setServerError('');
    };

    const validateStep = () => {
        const e = {};

        if (step === 1) {
            if (!formData.username.trim())
                e.username = 'Please enter the username.';
            else if (!/^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$/.test(formData.username) || formData.username.length < 2)
                e.username = 'Username must be one word, and can only contain letters, numbers and underscores. It cannot start or end with an underscore.';
            if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,12}$/.test(formData.password))
                e.password = 'Password must be 6–12 characters with letters and numbers.';
            if (formData.password !== formData.confirmPassword)
                e.confirmPassword = 'Passwords do not match.';
        }

        if (step === 2) {
            if (!formData.birthDay)   e.birthDay   = 'Please select the day.';
            if (!formData.birthMonth) e.birthMonth = 'Please select the month.';
            if (!formData.birthYear)  e.birthYear  = 'Please select the year.';
        }

        if (step === 3) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
                e.email = 'Enter a valid email address.';
            if (!formData.agreedToTerms)
                e.agreedToTerms = 'You must agree to the terms to continue.';
        }

        if (step === 4) {
            if (!formData.verificationCode.trim())
                e.verificationCode = 'Please enter your verification code.';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = async () => {
        if (!validateStep()) return;

        // Step 3 → 4: register the user, then advance to verification step
        if (step === 3) {
            setLoading(true);
            setServerError('');
            try {
                const res  = await fetch(`${API}/auth/register/student`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({
                        username:   formData.username,
                        password:   formData.password,
                        email:      formData.email,
                        birthDay:   formData.birthDay,
                        birthMonth: formData.birthMonth,
                        birthYear:  formData.birthYear,
                    }),
                });
                const data = await res.json();

                if (!res.ok) {
                    // Surface field-level conflicts back into the form
                    if (data.message.includes('Username'))
                        setErrors((prev) => ({ ...prev, username: data.message }));
                    else if (data.message.includes('Email'))
                        setErrors((prev) => ({ ...prev, email: data.message }));
                    else
                        setServerError(data.message);
                    return;
                }

                setUserId(data.userId);
                setStep(4);
            } catch {
                setServerError('A network error occurred. Please try again.');
            } finally {
                setLoading(false);
            }
            return;
        }

        // Step 4 → finish: verify the email code, then log in
        if (step === TOTAL_STEPS) {
            setLoading(true);
            setServerError('');
            try {
                const res  = await fetch(`${API}/auth/verify-email`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ userId, code: formData.verificationCode }),
                });
                const data = await res.json();

                if (!res.ok) {
                    setErrors({ verificationCode: data.message });
                    return;
                }

                login(data.token, data.user);
                navigate('/dashboard');
            } catch {
                setServerError('A network error occurred. Please try again.');
            } finally {
                setLoading(false);
            }
            return;
        }

        // Steps 1–2: just advance
        setStep((s) => s + 1);
    };

    const handlePrev = () => { if (step > 1) setStep((s) => s - 1); };

    const handleResend = async () => {
        if (!userId) return;
        setServerError('');
        try {
            const res  = await fetch(`${API}/auth/resend-verification`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (!res.ok) setServerError(data.message);
        } catch {
            setServerError('A network error occurred. Please try again.');
        }
    };

    return (
        <div className="wrapper student-register">
            <div className="heading">
                <h1>Individual / Student</h1>
                <p>Create an account to start reading and writing!</p>
            </div>

            <StepIndicator current={step} />

            {serverError && (
                <p style={{ color: '#F64E4E', fontSize: '14px', marginBottom: '12px' }}>{serverError}</p>
            )}

            {/* Step 1: Your Account */}
            {step === 1 && (
                <div className="step-content">
                    <div className="input-box">
                        <label>Username:</label>
                        <input type="text" value={formData.username} onChange={(e) => update('username', e.target.value)}
                            style={{ border: errors.username ? '1px solid #FF1212' : '' }} />
                        {errors.username
                            ? <span className="field-error">{errors.username}</span>
                            : <span className="field-hint">For safety and privacy, please don't use your full name.</span>}
                    </div>

                    <div className="input-box">
                        <label>Password:</label>
                        <input type="password" value={formData.password} onChange={(e) => update('password', e.target.value)}
                            style={{ border: errors.password ? '1px solid #FF1212' : '' }} />
                        {errors.password
                            ? <span className="field-error">{errors.password}</span>
                            : <span className="field-hint">Password must include 6–12 characters, including letters and numbers.</span>}
                    </div>

                    <div className="input-box">
                        <label>Re-enter Password:</label>
                        <input type="password" value={formData.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)}
                            style={{ border: errors.confirmPassword ? '1px solid #FF1212' : '' }} />
                        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                    </div>

                    <button className="btn-next full-width" onClick={handleNext}>Next</button>
                </div>
            )}

            {/* Step 2: Date of Birth */}
            {step === 2 && (
                <div className="step-content">
                    <div className="input-box">
                        <label>Date of Birth:</label>
                        <div className="input-row">
                            <div className="input-col">
                                <select value={formData.birthDay} onChange={(e) => update('birthDay', e.target.value)} style={selectStyle(errors.birthDay)}>
                                    <option value="" hidden>Day</option>
                                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                                </select>
                                {errors.birthDay && <span className="field-error">{errors.birthDay}</span>}
                            </div>
                            <div className="input-col">
                                <select value={formData.birthMonth} onChange={(e) => update('birthMonth', e.target.value)} style={selectStyle(errors.birthMonth)}>
                                    <option value="" hidden>Month</option>
                                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                                {errors.birthMonth && <span className="field-error">{errors.birthMonth}</span>}
                            </div>
                            <div className="input-col">
                                <select value={formData.birthYear} onChange={(e) => update('birthYear', e.target.value)} style={selectStyle(errors.birthYear)}>
                                    <option value="" hidden>Year</option>
                                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                                {errors.birthYear && <span className="field-error">{errors.birthYear}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="button-group">
                        <button className="password-back-button" onClick={handlePrev}>Previous</button>
                        <button className="btn-next" onClick={handleNext}>Next</button>
                    </div>
                </div>
            )}

            {/* Step 3: Email + ToS */}
            {step === 3 && (
                <div className="step-content">
                    <div className="input-box">
                        <label>Your Email Address:</label>
                        <input type="email" value={formData.email} onChange={(e) => update('email', e.target.value)}
                            style={{ border: errors.email ? '1px solid #FF1212' : '' }} />
                        {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>

                    <div className="terms-row">
                        <input type="checkbox" id="terms" checked={formData.agreedToTerms}
                            onChange={(e) => update('agreedToTerms', e.target.checked)} />
                        <label htmlFor="terms" className="terms-label">
                            I agree to Type-Away-Writer's terms of use and privacy policy.
                        </label>
                    </div>
                    {errors.agreedToTerms && <span className="field-error">{errors.agreedToTerms}</span>}

                    <div className="button-group">
                        <button className="password-back-button" onClick={handlePrev}>Previous</button>
                        <button className="btn-next" onClick={handleNext} disabled={loading}>
                            {loading ? 'Creating account…' : 'Next'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Email Verification */}
            {step === 4 && (
                <div className="step-content">
                    <div className="input-box">
                        <label>Your Verification Code:</label>
                        <input type="text" value={formData.verificationCode}
                            onChange={(e) => update('verificationCode', e.target.value)}
                            style={{ border: errors.verificationCode ? '1px solid #FF1212' : '' }} />
                        {errors.verificationCode && <span className="field-error">{errors.verificationCode}</span>}
                    </div>

                    <button className="btn-resend full-width" onClick={handleResend} type="button">
                        Re-send Email
                    </button>
                    <span className="field-hint">
                        Check your email inbox for the verification code. Check the spam folder if you cannot find it.
                    </span>

                    <div className="button-group">
                        <button className="password-back-button" onClick={handlePrev}>Previous</button>
                        <button className="btn-next" onClick={handleNext} disabled={loading}>
                            {loading ? 'Verifying…' : 'Finish Setup'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterStudent;
