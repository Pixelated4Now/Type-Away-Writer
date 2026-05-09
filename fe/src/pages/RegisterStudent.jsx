import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import "./Register.css";

const TOTAL_STEPS = 4;

const stepLabels = {
  1: "Your Account",
  2: "More about you",
  3: "Your Email",
  4: "Email Verification",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

const StepIndicator = ({ current }) => (
  <div className="step-indicator">
    {[1, 2, 3, 4].map((step, i) => (
      <div key={step} className="step-item">
        {i > 0 && <div className={`step-line ${current > i ? "done" : ""}`} />}
        <div className={`step-circle ${current === step ? "active" : ""} ${current > step ? "done" : ""}`}>
          {step}
        </div>
      </div>
    ))}
    <p className="step-label">{stepLabels[current]}</p>
  </div>
);

const RegisterStudent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    birthYear: "",
    birthMonth: "",
    district: "",
    email: "",
    agreedToTerms: false,
    verificationCode: "",
  });

  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.username.trim()) newErrors.username = "Please enter the username.";
      if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,12}$/.test(formData.password))
        newErrors.password = "Password must be 6–12 characters with letters and numbers.";
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match.";
    }

    if (step === 2) {
      if (!formData.birthYear.trim()) newErrors.birthYear = "Please provide the year.";
      if (!formData.birthMonth.trim()) newErrors.birthMonth = "Please select the month.";
      if (!formData.district.trim()) newErrors.district = "Please select your district.";
    }

    if (step === 3) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Enter a valid email address.";
      if (!formData.agreedToTerms)
        newErrors.agreedToTerms = "You must agree to the terms to continue.";
    }

    if (step === 4) {
      if (!formData.verificationCode.trim())
        newErrors.verificationCode = "Please enter your verification code.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else {
      // TODO: submit form data to backend
      navigate("/dashboard");
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <div className="wrapper student-register" style={{ width: "740px", maxWidth: "740px" }}>
      <div className="heading">
        <h1>Individual/ Student</h1>
        <p>Create an account to start reading and writing!</p>
      </div>

      <StepIndicator current={step} />

      {/* Step 1: Your Account */}
      {step === 1 && (
        <div className="step-content">
          <div className="input-box">
            <label>Username:</label>
            <input type="text" value={formData.username} onChange={(e) => update("username", e.target.value)} placeholder="" style={{ border: errors.username ? '1px solid #FF1212' : '' }} />
            {errors.username && <span className="field-error">{errors.username}</span>}
            <span className="field-hint">For safety and privacy, please don't use your full name.</span>
          </div>

          <div className="input-box">
            <label>Password:</label>
            <input type="password" value={formData.password} onChange={(e) => update("password", e.target.value)} style={{ border: errors.confirmPassword ? '1px solid #FF1212' : '' }} />
            {errors.password
              ? <span className="field-error">{errors.password}</span>
              : <span className="field-hint">Password must include 6–12 characters, including letters and numbers.</span>
            }
          </div>

          <div className="input-box">
            <label>Re-enter Password:</label>
            <input type="password" value={formData.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} style={{ border: errors.confirmPassword ? '1px solid #FF1212' : '' }} />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button className="btn-next full-width" onClick={handleNext}>Next</button>
        </div>
      )}

      {/* Step 2: More About You */}
      {step === 2 && (
        <div className="step-content">
          <div className="input-box">
            <label>Year and Month of Birth:</label>
            <div className="input-row">
              <div className="input-col">
                <input type="text" value={formData.birthYear} onChange={(e) => update("birthYear", e.target.value)} placeholder="Year" style={{ border: errors.birthYear ? '1px solid #FF1212' : '' }} />
                {errors.birthYear && <span className="field-error">{errors.birthYear}</span>}
              </div>

              <div className="input-col">
                <select
                  value={formData.birthMonth}
                  onChange={(e) => update("birthMonth", e.target.value)}
                  style={{ border: errors.birthMonth ? '1px solid #FF1212' : '' }}
                >
                  <option value="">Month</option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                {errors.birthMonth && <span className="field-error">{errors.birthMonth}</span>}
              </div>
            </div>
          </div>

          <div className="input-box">
            <label>District:</label>
            <select
              value={formData.district}
              onChange={(e) => update("district", e.target.value)}
              style={{ border: errors.district ? '1px solid #FF1212' : '' }}
            >
              <option value="">Select your district</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            {errors.district
              ? <span className="field-error">{errors.district}</span>
              : <span className="field-hint">This will be shown on your profile. You can turn it off later through the profile settings.</span>
            }
          </div>

          <div className="button-group">
            <button className="password-back-button" onClick={handlePrev}>Previous</button>
            <button className="btn-next" onClick={handleNext}>Next</button>
          </div>
        </div>
      )}

      {/* Step 3: Email */}
      {step === 3 && (
        <div className="step-content">
          <div className="input-box">
            <label>Your Email Address:</label>
            <input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} style={{ border: errors.email ? '1px solid #FF1212' : '' }} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="terms-row">
            <input
              type="checkbox"
              id="terms"
              checked={formData.agreedToTerms}
              onChange={(e) => update("agreedToTerms", e.target.checked)}
            />
            <label htmlFor="terms" className="terms-label">
              I agree to Type-Away-Writer's terms of use and privacy policy.
            </label>
          </div>
          {errors.agreedToTerms && <span className="field-error">{errors.agreedToTerms}</span>}

          <div className="button-group">
            <button className="password-back-button" onClick={handlePrev}>Previous</button>
            <button className="btn-next" onClick={handleNext}>Next</button>
          </div>
        </div>
      )}

      {/* Step 4: Email Verification */}
      {step === 4 && (
        <div className="step-content">
          <div className="input-box">
            <label>Your Verification Code:</label>
            <input
              type="text"
              value={formData.verificationCode}
              onChange={(e) => update("verificationCode", e.target.value)}
              style={{ border: errors.verificationCode ? '1px solid #FF1212' : '' }}
            />
            {errors.verificationCode && <span className="field-error">{errors.verificationCode}</span>}
          </div>

          <button className="btn-resend full-width">Re-send Email</button>
          <span className="field-hint">
            Check your email inbox for the verification code. Check the spam folder if you cannot find it.
          </span>

          <div className="button-group">
            <button className="password-back-button" onClick={handlePrev}>Previous</button>
            <button className="btn-next" onClick={handleNext}>Finish Setup</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterStudent;