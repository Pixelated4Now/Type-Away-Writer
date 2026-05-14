import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


// ── Placeholder user data — replace with real auth context when backend is ready
const PLACEHOLDER_USER = {
  username: "DarkxWolf17",
  email: "darkxwolf17@gmail.com",
  dobDay: "08",
  dobMonth: "April",
  dobYear: "2012",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

const YEARS = Array.from({ length: 24 }, (_, i) =>
  String(2020 - i)
);

const AccountSettings = () => {
  useEffect(() => { document.title = 'Settings | Type-Away-Writer'; }, []);
  const navigate = useNavigate();

  // ── View / Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // ── User data
  const [user, setUser] = useState(PLACEHOLDER_USER);
  const [editData, setEditData] = useState({ ...PLACEHOLDER_USER });

  // ── Change Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [reenterPassword, setReenterPassword] = useState("");

  // ── Close modal on outside click
  const modalRef = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowPasswordModal(false);
      }
    };
    if (showPasswordModal) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPasswordModal]);

  // ── Handlers
  const handleEdit = () => {
    setEditData({ ...user });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...user });
  };

  const handleSave = () => {
    setUser({ ...editData });
    setIsEditing(false);
    // TODO: API call — PATCH /api/user/settings { username, email, dobDay, dobMonth, dobYear }
  };

  const handlePasswordSave = () => {
    if (!currentPassword || !newPassword || !reenterPassword) return;
    if (newPassword !== reenterPassword) return;
    // TODO: API call — POST /api/user/change-password { currentPassword, newPassword }
    setCurrentPassword("");
    setNewPassword("");
    setReenterPassword("");
    setShowPasswordModal(false);
  };

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

        /* ── Main content area ── */
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

        /* ── Settings rows ── */
        .settings-row {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 28px;
        }

        .settings-label {
        font-size: 15px;
        font-weight: 700;
        color: #111;
        min-width: 140px;
        flex-shrink: 0;
        }

        .settings-value {
        font-size: 15px;
        font-weight: 400;
        color: #333;
        }

        /* ── View mode: Change Password button ── */
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
        box-shadow: none;
        margin-top: 0;
        width: auto;
        }

        .change-password-btn:hover {
        background: #333;
        }

        /* ── Actions row (EDIT / SAVE + CANCEL) ── */
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
        box-shadow: none;
        margin-top: 0;
        width: auto;
        }

        .edit-btn:hover {
        background: #333;
        }

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
        box-shadow: none;
        margin-top: 0;
        width: auto;
        }

        .save-btn:hover {
        background: #0e72e5;
        }

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
        box-shadow: none;
        margin-top: 0;
        width: auto;
        }

        .cancel-btn:hover {
        background: #f5f5f5;
        }

        /* ── Edit mode inputs ── */
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
        }

        .settings-input:focus {
        border-color: #0e72e5;
        }

        /* ── Date of Birth dropdowns ── */
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

        .settings-select:focus {
        border-color: #0e72e5;
        }

        /* ── Modal overlay ── */
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
        box-shadow: none;
        margin-top: 0;
        width: auto;
        height: auto;
        }

        .modal-close:hover {
        color: #111;
        background: none;
        }

        .modal-divider {
        border: none;
        border-top: 2px solid #0e72e5;
        margin: 0 0 24px;
        }

        .modal-field {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        }

        .modal-label {
        font-size: 14px;
        font-weight: 600;
        color: #111;
        min-width: 160px;
        flex-shrink: 0;
        }

        .modal-input {
        flex: 1;
        height: 36px;
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 0 12px;
        font-family: "Manrope", sans-serif;
        font-size: 14px;
        color: #111;
        outline: none;
        transition: border-color 0.15s ease;
        box-sizing: border-box;
        }

        .modal-input:focus {
        border-color: #0e72e5;
        }

        .modal-forgot {
        display: flex;
        justify-content: flex-end;
        margin: -8px 0 16px;
        }

        .forgot-link {
        font-size: 13px;
        font-weight: 500;
        color: #888;
        cursor: pointer;
        text-decoration: none;
        transition: color 0.15s ease;
        }

        .forgot-link:hover {
        color: #0e72e5;
        }

        .modal-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 24px;
        }

        /* ── Responsive ── */
        @media (max-width: 600px) {
        .account-settings-content {
            padding: 32px 20px 56px;
        }

        .settings-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }

        .settings-input {
            width: 100%;
        }

        .dob-selects {
            flex-wrap: wrap;
        }

        .modal {
            width: 90%;
            padding: 24px 20px;
        }

        .modal-field {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
        }

        .modal-input {
            width: 100%;
        }
        }
    `}</style>

    
    <div className="account-settings-page">
      <Navbar />

      <div className="account-settings-content">
        <h1 className="account-settings-title">Account Settings</h1>
        <hr className="account-settings-divider" />

        {!isEditing ? (
          /* ── View Mode ── */
          <div className="settings-view">
            <div className="settings-row">
              <span className="settings-label">Username:</span>
              <span className="settings-value">{user.username}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Email Address:</span>
              <span className="settings-value">{user.email}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Password:</span>
              <button
                className="change-password-btn"
                onClick={() => setShowPasswordModal(true)}
              >
                CHANGE PASSWORD
              </button>
            </div>
            <div className="settings-row">
              <span className="settings-label">Date of Birth:</span>
              <span className="settings-value">
                {String(user.dobDay).padStart(2, "0")} {user.dobMonth} {user.dobYear}
              </span>
            </div>
            <div className="settings-actions">
              <button className="edit-btn" onClick={handleEdit}>EDIT</button>
            </div>
          </div>
        ) : (
          /* ── Edit Mode ── */
          <div className="settings-edit">
            <div className="settings-row">
              <span className="settings-label">Username:</span>
              <input
                type="text"
                className="settings-input"
                value={editData.username}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              />
            </div>
            <div className="settings-row">
              <span className="settings-label">Email Address:</span>
              <input
                type="email"
                className="settings-input"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              />
            </div>
            <div className="settings-row">
              <span className="settings-label">Date of Birth:</span>
              <div className="dob-selects">
                <select
                  className="settings-select"
                  value={editData.dobDay}
                  onChange={(e) => setEditData({ ...editData, dobDay: e.target.value })}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  className="settings-select"
                  value={editData.dobMonth}
                  onChange={(e) => setEditData({ ...editData, dobMonth: e.target.value })}
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  className="settings-select"
                  value={editData.dobYear}
                  onChange={(e) => setEditData({ ...editData, dobYear: e.target.value })}
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="settings-actions">
              <button className="save-btn" onClick={handleSave}>SAVE CHANGES</button>
              <button className="cancel-btn" onClick={handleCancel}>CANCEL</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal" ref={modalRef}>
            <div className="modal-header">
              <h2 className="modal-title">Change Password</h2>
              <button
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
              >×</button>
            </div>
            <hr className="modal-divider" />

            <div className="modal-field">
              <label className="modal-label">Current Password:</label>
              <input
                type="password"
                className="modal-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="modal-forgot">
              <span
                className="forgot-link"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </span>
            </div>

            <div className="modal-field">
              <label className="modal-label">New Password:</label>
              <input
                type="password"
                className="modal-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Re-enter New Password:</label>
              <input
                type="password"
                className="modal-input"
                value={reenterPassword}
                onChange={(e) => setReenterPassword(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="save-btn" onClick={handlePasswordSave}>SAVE</button>
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