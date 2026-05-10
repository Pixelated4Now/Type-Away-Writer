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

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 35 }, (_, i) => 1971 + i); // 1971 to 2005

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

const RegisterExpert = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    birthDay: "",
    birthMonth: "",
    birthYear: "",
    qualificationFiles: [],
    email: "",
    agreedToTerms: false,
    verificationCode: "",
  });

  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFormData((prev) => ({
        ...prev,
        qualificationFiles: [...prev.qualificationFiles, ...newFiles],
    }));
    setErrors((prev) => ({ ...prev, qualificationFiles: "" }));
    // Reset the input so the same file can be re-added if removed
    e.target.value = "";
};

const handleFileRemove = (indexToRemove) => {
    setFormData((prev) => ({
        ...prev,
        qualificationFiles: prev.qualificationFiles.filter((_, i) => i !== indexToRemove),
    }));
};

  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.username.trim()) {
        newErrors.username = "Please enter the username.";
      } else if (!/^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$/.test(formData.username) || formData.username.length < 2) {
        newErrors.username = "Username can only contain letters, numbers and underscores, and cannot start or end with an underscore.";
      }
      if (!/^(?=.*[a-zA-Z])(?=.*\d).{6,12}$/.test(formData.password))
        newErrors.password = "Password must be 6–12 characters with letters and numbers.";
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match.";
    }

    if (step === 2) {
      if (!formData.birthDay) newErrors.birthDay = "Please select the day.";
      if (!formData.birthMonth) newErrors.birthMonth = "Please select the month.";
      if (!formData.birthYear) newErrors.birthYear = "Please select the year.";
      if (formData.qualificationFiles.length === 0)
        newErrors.qualificationFiles = "Please upload at least one qualification file.";
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

  // Shared dropdown style
  const selectStyle = (hasError) => ({
    width: "100%",
    height: "42px",
    backgroundColor: "#EDF2F4",
    border: hasError ? "1px solid #FF1212" : "2px solid rgba(255,255,255,0.2)",
    borderRadius: "10px",
    color: "#000",
    padding: "0 12px",
    fontSize: "16px",
    cursor: "pointer",
    outline: "none",
  });

  return (
    <div className="wrapper student-register expert-register">
      <div className="heading">
        <h1>Language Expert</h1>
        <p>Create an account to start reading and reviewing!</p>
      </div>

      <StepIndicator current={step} />

      {/* Step 1: Your Account */}
      {step === 1 && (
        <div className="step-content">
          <div className="input-box">
            <label>Username:</label>
            <input type="text" value={formData.username} onChange={(e) => update("username", e.target.value)} style={{ border: errors.username ? '1px solid #FF1212' : '' }} />
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
            <label>Date of Birth:</label>
            <div className="input-row">

              {/* Day */}
              <div className="input-col">
                <select value={formData.birthDay} onChange={(e) => update("birthDay", e.target.value)} style={selectStyle(errors.birthDay)}>
                  <option value="" hidden>Day</option>
                  {DAYS.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                {errors.birthDay && <span className="field-error">{errors.birthDay}</span>}
              </div>

              {/* Month */}
              <div className="input-col">
                <select value={formData.birthMonth} onChange={(e) => update("birthMonth", e.target.value)} style={selectStyle(errors.birthMonth)}>
                  <option value="" hidden>Month</option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                {errors.birthMonth && <span className="field-error">{errors.birthMonth}</span>}
              </div>

              {/* Year */}
              <div className="input-col">
                <select value={formData.birthYear} onChange={(e) => update("birthYear", e.target.value)} style={selectStyle(errors.birthYear)}>
                  <option value="" hidden>Year</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.birthYear && <span className="field-error">{errors.birthYear}</span>}
              </div>

            </div>
          </div>

          {/* Qualifications upload */}
          <div className="input-box">
            <label>Qualifications:</label>
            <div className="upload-area">
              <input
                type="file"
                id="qualificationFiles"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <label htmlFor="qualificationFiles" className="btn-upload">
                Upload file(s)
              </label>

                {formData.qualificationFiles.map((file, i) => (
                    <li key={i} className="file-list-item">
                        <span className="file-name">{file.name}</span>
                        <button
                            type="button"
                            className="btn-remove-file"
                            onClick={() => handleFileRemove(i)}
                        >
                            Remove File
                        </button>
                    </li>
                ))}
                            
            </div>
            {errors.qualificationFiles
              ? <span className="field-error">{errors.qualificationFiles}</span>
              : <span className="field-hint">A moderator will evaluate all uploaded files.</span>
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
          <span className="field-hint" style={{ marginTop: '10px' }}>
            Check your email inbox for the verification code. Check the spam folder if you cannot find it.
          </span>
          <span className="field-hint" style={{ marginTop: '10px' }}>
            Your account will remain as an Individual account till you are verified as an expert by a moderator.
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

export default RegisterExpert;