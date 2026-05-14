import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("authToken");
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

const parseDOB = (isoDate) => {
  if (!isoDate) return { dobDay: "01", dobMonth: "January", dobYear: "" };
  const str   = typeof isoDate === "string" ? isoDate : isoDate.toISOString();
  const parts = str.split("T")[0].split("-");
  return {
    dobDay:   parts[2],
    dobMonth: MONTHS[parseInt(parts[1], 10) - 1],
    dobYear:  parts[0],
  };
};

const AccountSettings = () => {
  useEffect(() => { document.title = "Settings | Type-Away-Writer"; }, []);
  const navigate = useNavigate();
  const { user: authUser, login } = useAuth();

  const [userData,    setUserData]    = useState(null);
  const [isEditing,   setIsEditing]   = useState(false);
  const [editData,    setEditData]    = useState({});

  const [usernameError, setUsernameError] = useState("");
  const [emailError,    setEmailError]    = useState("");
  const [saveError,     setSaveError]     = useState("");
  const [saving,        setSaving]        = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword,   setCurrentPassword]   = useState("");
  const [newPassword,       setNewPassword]       = useState("");
  const [reenterPassword,   setReenterPassword]   = useState("");
  const [showCurrent,       setShowCurrent]       = useState(false);
  const [showNew,           setShowNew]           = useState(false);
  const [showReenter,       setShowReenter]       = useState(false);
  const [pwdCurrentError,   setPwdCurrentError]   = useState("");
  const [pwdNewError,       setPwdNewError]       = useState("");
  const [pwdMatchError,     setPwdMatchError]     = useState("");
  const [pwdSaving,         setPwdSaving]         = useState(false);
  const [pwdSuccess,        setPwdSuccess]        = useState("");

  const modalRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target))
        setShowPasswordModal(false);
    };
    if (showPasswordModal) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPasswordModal]);

  useEffect(() => {
    authFetch(`${API}/users/me`)
      .then((r) => r.json())
      .then((data) => {
        setUserData({ username: data.username, email: data.email, ...parseDOB(data.date_of_birth) });
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const YEARS = authUser?.account_type === "expert"
    ? Array.from({ length: 35 }, (_, i) => String(2005 - i))
    : Array.from({ length: 10 }, (_, i) => String(2020 - i));

  const handleEdit = () => {
    setEditData({ ...userData });
    setUsernameError("");
    setEmailError("");
    setSaveError("");
    setPwdSuccess("");
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    setUsernameError("");
    setEmailError("");
    setSaveError("");
    setSaving(true);
    try {
      if (editData.username !== userData.username) {
        const r = await fetch(`${API}/auth/check-username?username=${encodeURIComponent(editData.username)}`);
        const d = await r.json();
        if (!d.available) {
          setUsernameError("This username has been used. Please try again.");
          return;
        }
      }

      if (editData.email !== userData.email) {
        const r = await fetch(`${API}/auth/check-email?email=${encodeURIComponent(editData.email)}`);
        const d = await r.json();
        if (!d.available) {
          setEmailError("There is already an account associated with this email address.");
          return;
        }
      }

      const monthNum = String(MONTHS.indexOf(editData.dobMonth) + 1).padStart(2, "0");
      const dob = `${editData.dobYear}-${monthNum}-${editData.dobDay}`;

      const res  = await authFetch(`${API}/users/me`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: editData.username, email: editData.email, date_of_birth: dob }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveError("Something went wrong. Changes could not be saved.");
        return;
      }

      const newDob = parseDOB(data.date_of_birth || dob);
      setUserData({ username: data.username, email: data.email ?? editData.email, ...newDob });

      const token = localStorage.getItem("authToken");
      login(token, { ...authUser, username: data.username });

      setIsEditing(false);
    } catch {
      setSaveError("Something went wrong. Changes could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const openPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setReenterPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowReenter(false);
    setPwdCurrentError("");
    setPwdNewError("");
    setPwdMatchError("");
    setPwdSuccess("");
    setShowPasswordModal(true);
  };

  const handlePasswordSave = async () => {
    setPwdCurrentError("");
    setPwdNewError("");
    setPwdMatchError("");

    const pwdRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,12}$/;
    if (!pwdRegex.test(newPassword)) {
      setPwdNewError("Password must be 6–12 characters and contain letters and numbers.");
      return;
    }
    if (newPassword !== reenterPassword) {
      setPwdMatchError("Passwords do not match.");
      return;
    }

    setPwdSaving(true);
    try {
      const res = await authFetch(`${API}/auth/change-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.status === 401) {
        setPwdCurrentError("Current password is incorrect.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPwdCurrentError(data.message || "Something went wrong.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setReenterPassword("");
      setShowPasswordModal(false);
      setPwdSuccess("Password changed successfully.");
    } catch {
      setPwdCurrentError("Something went wrong.");
    } finally {
      setPwdSaving(false);
    }
  };

  if (!userData) return (
    <div className="account-settings-page">
      <Navbar />
      <p style={{ textAlign: "center", padding: "80px 0", color: "#888", fontFamily: "Manrope, sans-serif" }}>Loading…</p>
      <Footer />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

        .account-settings-page {
          font-family: "Manrope", sans-serif;
          color: #111;
          background: #fff;
          min-height: 100vh;
        }

        .account-settings-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 48px 40px 72px;
        }

        .account-settings-title {
          font-size: 32px;
          font-weight: 800;
          text-align: center;
          margin: 0 0 16px;
          color: #111;
        }

        .account-settings-divider {
          border: none;
          border-top: 1px solid #e0e0e0;
          margin: 0 0 40px;
        }

        .settings-row {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 28px;
        }

        .settings-label {
          font-size: 15px;
          font-weight: 700;
          color: #111;
          min-width: 140px;
          flex-shrink: 0;
          padding-top: 2px;
        }

        .settings-value {
          font-size: 15px;
          font-weight: 400;
          color: #333;
        }

        .settings-error {
          font-size: 13px;
          color: #c62828;
          font-weight: 500;
          margin: 6px 0 0;
        }

        .settings-success {
          font-size: 13px;
          color: #2e7d32;
          font-weight: 600;
          margin: 0 0 16px;
        }

        .change-password-btn {
          height: 42px;
          padding: 0 24px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: "Manrope", sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .change-password-btn:hover { background: #333; }

        .settings-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 16px;
        }

        .edit-btn {
          height: 42px;
          padding: 0 28px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: "Manrope", sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .edit-btn:hover { background: #333; }

        .save-btn {
          height: 42px;
          padding: 0 28px;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: "Manrope", sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .save-btn:hover:not(:disabled) { background: #0e72e5; }
        .save-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .cancel-btn {
          height: 42px;
          padding: 0 28px;
          background: transparent;
          color: #111;
          border: 1.5px solid #ccc;
          border-radius: 8px;
          font-family: "Manrope", sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .cancel-btn:hover:not(:disabled) { background: #f5f5f5; }
        .cancel-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .settings-input {
          width: 280px;
          height: 38px;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 0 12px;
          font-family: "Manrope", sans-serif;
          font-size: 14px;
          color: #111;
          outline: none;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
          display: block;
        }

        .settings-input:focus { border-color: #0e72e5; }

        .dob-selects {
          display: flex;
          gap: 10px;
        }

        .settings-select {
          height: 38px;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 0 10px;
          font-family: "Manrope", sans-serif;
          font-size: 14px;
          color: #111;
          background: #fff;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease;
          appearance: auto;
        }

        .settings-select:focus { border-color: #0e72e5; }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal {
          background: #fff;
          border-radius: 12px;
          padding: 28px 32px;
          width: 460px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          position: relative;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #111;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #888;
          cursor: pointer;
          line-height: 1;
          padding: 0;
        }

        .modal-close:hover { color: #111; background: none; }

        .modal-divider {
          border: none;
          border-top: 2px solid #0e72e5;
          margin: 0 0 24px;
        }

        .modal-field {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 4px;
        }

        .modal-label {
          font-size: 14px;
          font-weight: 600;
          color: #111;
          min-width: 160px;
          flex-shrink: 0;
        }

        .modal-input-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .modal-input {
          flex: 1;
          height: 36px;
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 0 36px 0 12px;
          font-family: "Manrope", sans-serif;
          font-size: 14px;
          color: #111;
          outline: none;
          transition: border-color 0.15s ease;
          box-sizing: border-box;
          width: 100%;
        }

        .modal-input:focus { border-color: #0e72e5; }

        .modal-eye-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          font-size: 16px;
          color: #555;
          display: flex;
          align-items: center;
          line-height: 1;
        }

        .modal-eye-btn:hover { color: #111; }

        .modal-field-error {
          font-size: 12px;
          color: #c62828;
          font-weight: 500;
          margin: 0 0 12px;
          padding-left: 176px;
        }

        .modal-forgot {
          display: flex;
          justify-content: flex-end;
          margin: 4px 0 16px;
        }

        .forgot-link {
          font-size: 13px;
          font-weight: 500;
          color: #888;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-link:hover { color: #0e72e5; }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 24px;
        }

        @media (max-width: 600px) {
          .account-settings-content { padding: 32px 20px 56px; }
          .settings-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .settings-input { width: 100%; }
          .dob-selects { flex-wrap: wrap; }
          .modal { width: 90%; padding: 24px 20px; }
          .modal-field { flex-direction: column; align-items: flex-start; gap: 6px; }
          .modal-input { width: 100%; }
          .modal-field-error { padding-left: 0; }
        }
      `}</style>

      <div className="account-settings-page">
        <Navbar />

        <div className="account-settings-content">
          <h1 className="account-settings-title">Account Settings</h1>
          <hr className="account-settings-divider" />

          {!isEditing ? (
            /* ── View mode ── */
            <div className="settings-view">
              <div className="settings-row">
                <span className="settings-label">Username:</span>
                <span className="settings-value">{userData.username}</span>
              </div>
              <div className="settings-row">
                <span className="settings-label">Email Address:</span>
                <span className="settings-value">{userData.email}</span>
              </div>
              <div className="settings-row">
                <span className="settings-label">Password:</span>
                <button className="change-password-btn" onClick={openPasswordModal}>
                  CHANGE PASSWORD
                </button>
              </div>
              <div className="settings-row">
                <span className="settings-label">Date of Birth:</span>
                <span className="settings-value">
                  {String(userData.dobDay).padStart(2, "0")} {userData.dobMonth} {userData.dobYear}
                </span>
              </div>
              {pwdSuccess && <p className="settings-success">{pwdSuccess}</p>}
              <div className="settings-actions">
                <button className="edit-btn" onClick={handleEdit}>EDIT</button>
              </div>
            </div>
          ) : (
            /* ── Edit mode ── */
            <div className="settings-edit">
              <div className="settings-row">
                <span className="settings-label">Username:</span>
                <div>
                  <input
                    type="text"
                    className="settings-input"
                    value={editData.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  />
                  {usernameError && <p className="settings-error">{usernameError}</p>}
                </div>
              </div>
              <div className="settings-row">
                <span className="settings-label">Email Address:</span>
                <div>
                  <input
                    type="email"
                    className="settings-input"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                  {emailError && <p className="settings-error">{emailError}</p>}
                </div>
              </div>
              <div className="settings-row">
                <span className="settings-label">Date of Birth:</span>
                <div className="dob-selects">
                  <select
                    className="settings-select"
                    value={editData.dobDay}
                    onChange={(e) => setEditData({ ...editData, dobDay: e.target.value })}
                  >
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    className="settings-select"
                    value={editData.dobMonth}
                    onChange={(e) => setEditData({ ...editData, dobMonth: e.target.value })}
                  >
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    className="settings-select"
                    value={editData.dobYear}
                    onChange={(e) => setEditData({ ...editData, dobYear: e.target.value })}
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {saveError && <p className="settings-error">{saveError}</p>}
              <div className="settings-actions">
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? "SAVING…" : "SAVE CHANGES"}
                </button>
                <button className="cancel-btn" onClick={handleCancel} disabled={saving}>CANCEL</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Change Password modal ── */}
        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal" ref={modalRef}>
              <div className="modal-header">
                <h2 className="modal-title">Change Password</h2>
                <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
              </div>
              <hr className="modal-divider" />

              <div className="modal-field">
                <label className="modal-label">Current Password:</label>
                <div className="modal-input-wrap">
                  <input
                    type={showCurrent ? "text" : "password"}
                    className="modal-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button className="modal-eye-btn" onClick={(e) => { e.preventDefault(); setShowCurrent(v => !v); }}>
                    {showCurrent ? <BsEyeSlash /> : <BsEye />}
                  </button>
                </div>
              </div>
              {pwdCurrentError && <p className="modal-field-error">{pwdCurrentError}</p>}
              <div className="modal-forgot">
                <span className="forgot-link" onClick={() => navigate("/forgot-password")}>
                  Forgot Password?
                </span>
              </div>

              <div className="modal-field">
                <label className="modal-label">New Password:</label>
                <div className="modal-input-wrap">
                  <input
                    type={showNew ? "text" : "password"}
                    className="modal-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button className="modal-eye-btn" onClick={(e) => { e.preventDefault(); setShowNew(v => !v); }}>
                    {showNew ? <BsEyeSlash /> : <BsEye />}
                  </button>
                </div>
              </div>
              {pwdNewError && <p className="modal-field-error">{pwdNewError}</p>}

              <div className="modal-field">
                <label className="modal-label">Re-enter New Password:</label>
                <div className="modal-input-wrap">
                  <input
                    type={showReenter ? "text" : "password"}
                    className="modal-input"
                    value={reenterPassword}
                    onChange={(e) => setReenterPassword(e.target.value)}
                  />
                  <button className="modal-eye-btn" onClick={(e) => { e.preventDefault(); setShowReenter(v => !v); }}>
                    {showReenter ? <BsEyeSlash /> : <BsEye />}
                  </button>
                </div>
              </div>
              {pwdMatchError && <p className="modal-field-error">{pwdMatchError}</p>}

              <div className="modal-actions">
                <button className="save-btn" onClick={handlePasswordSave} disabled={pwdSaving}>
                  {pwdSaving ? "SAVING…" : "SAVE"}
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
};

export default AccountSettings;
