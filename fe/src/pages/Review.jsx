import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Review.css";
import bannerImg from "../assets/reviewBanner.jpg";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

const formatTime = (ts) =>
  new Date(ts).toLocaleString("en-US", {
    timeZone: "Asia/Colombo",
    month:    "short",
    day:      "numeric",
    year:     "numeric",
    hour:     "numeric",
    minute:   "2-digit",
    hour12:   true,
  });

const Review = () => {
  useEffect(() => { document.title = "Review | Type-Away-Writer"; }, []);

  const navigate = useNavigate();

  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    authFetch(`${API}/review-requests`)
      .then(r => r.json())
      .then(data => { setRequests(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Close three-dot menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".review-card-menu")) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateStatus = async (id, status) => {
    await authFetch(`${API}/review-requests/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    setOpenMenuId(null);
  };

  const handleDelete = async (id) => {
    await authFetch(`${API}/review-requests/${id}`, { method: "DELETE" });
    setRequests(prev => prev.filter(r => r.id !== id));
    setOpenMenuId(null);
  };

  return (
    <div className="review-page">
      <Navbar />

      <section className="review-hero">
        <div className="review-hero-image">
          <img src={bannerImg} alt="Expert review" />
        </div>
        <div className="review-hero-text">
          <h1>Your Expertise Counts!</h1>
          <p>
            Help young writers grow by reviewing their stories with thoughtful and encouraging feedback.
            Your guidance can inspire creativity, build confidence, and improve students' English writing skills.
            Take a moment to support the next generation of storytellers!
          </p>
        </div>
      </section>

      <h2 className="review-page-title">Review Requests</h2>

      <div className="review-main">
        {loading ? (
          <p style={{ color: "#888", padding: "24px 0" }}>Loading…</p>
        ) : requests.length === 0 ? (
          <p className="no-results">No review requests yet. Check back soon!</p>
        ) : (
          <div className="review-list">
            {requests.map(req => (
              <div key={req.id} className="review-card">

                <span className={`review-badge${req.status === "reviewed" ? " review-badge-reviewed" : " review-badge-new"}`}>
                  {req.status === "reviewed" ? "REVIEWED" : "NEW REQUEST"}
                </span>

                <div className="review-card-body">
                  <p className="review-card-text">
                    <strong>{req.student_username}</strong> submitted their story{" "}
                    <strong>{req.story_title}</strong> for your review.
                    Read the story and share your feedback to help them improve their writing skills!
                  </p>
                  <span className="review-card-time">{formatTime(req.created_at)}</span>
                </div>

                <div className="review-card-menu">
                  <button
                    className="review-menu-btn"
                    onClick={() => setOpenMenuId(prev => prev === req.id ? null : req.id)}
                    aria-label="Actions"
                  >
                    &#8942;
                  </button>

                  {openMenuId === req.id && (
                    <div className="review-dropdown">
                      <button onClick={() => { navigate(`/read/story/${req.story_id}`); setOpenMenuId(null); }}>
                        View Request
                      </button>
                      {req.status !== "reviewed" && (
                        <button onClick={() => updateStatus(req.id, "reviewed")}>
                          Mark as Reviewed
                        </button>
                      )}
                      {req.status === "reviewed" && (
                        <button onClick={() => updateStatus(req.id, "new")}>
                          Mark as Not Reviewed
                        </button>
                      )}
                      <button className="review-dropdown-danger" onClick={() => handleDelete(req.id)}>
                        Delete Request
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Review;
