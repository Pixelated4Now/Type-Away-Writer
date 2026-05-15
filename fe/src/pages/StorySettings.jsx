import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { RiImageAddFill } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";
import "./StorySettings.css";

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

const MAX_SUMMARY = 1400;
const MAX_TAGS    = 20;
const MAX_TAG_LEN = 100;

const StorySettings = () => {
  useEffect(() => { document.title = "Story Details | Type-Away-Writer"; }, []);

  const navigate          = useNavigate();
  const { id: storyId }   = useParams();       // undefined for /write/new
  const [searchParams]    = useSearchParams();
  const mode              = searchParams.get('mode');
  useAuth();

  // ── Form state
  const [title,       setTitle]       = useState("");
  const [summary,     setSummary]     = useState("");
  const [workStatus,  setWorkStatus]  = useState("");   // "complete" | "ongoing"
  const [categoryId,  setCategoryId]  = useState(null);
  const [selectedTags, setSelectedTags] = useState([]); // [{id, name}]
  const [coverUrl,    setCoverUrl]    = useState(null);  // stored full URL
  const [coverPreview, setCoverPreview] = useState(null); // local or stored URL for display

  // ── Reference data
  const [categories, setCategories] = useState([]);
  const [allTags,    setAllTags]    = useState([]);

  // ── Dropdown open state
  const [statusOpen,   setStatusOpen]   = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [tagOpen,      setTagOpen]      = useState(false);

  // ── Tag input
  const [tagInput,       setTagInput]       = useState("");
  const [tagSuggestions, setTagSuggestions] = useState([]);

  // ── Errors
  const [errors,   setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef  = useRef(null);
  const statusRef     = useRef(null);
  const categoryRef   = useRef(null);
  const tagRef        = useRef(null);

  // ── Load reference data + existing story if editing
  useEffect(() => {
    fetch(`${API}/categories`).then(r => r.json()).then(setCategories).catch(() => {});
    fetch(`${API}/tags`).then(r => r.json()).then(setAllTags).catch(() => {});

    if (storyId) {
      authFetch(`${API}/stories/${storyId}`)
        .then(r => r.json())
        .then(data => {
          setTitle(data.title || "");
          setSummary(data.summary || "");
          setWorkStatus(data.work_status || "");
          setCategoryId(data.category_id || null);
          setSelectedTags(Array.isArray(data.tags) ? data.tags : []);
          if (data.cover_image_url) {
            setCoverUrl(data.cover_image_url);
            setCoverPreview(data.cover_image_url);
          }
        })
        .catch(() => {});
    }
  }, [storyId]);

  // ── Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (statusRef.current   && !statusRef.current.contains(e.target))   setStatusOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setCategoryOpen(false);
      if (tagRef.current      && !tagRef.current.contains(e.target)) {
        setTagOpen(false);
        setTagInput("");
        setTagSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Cover image upload
  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res  = await authFetch(`${API}/upload/cover`, { method: "POST", body: formData });
      const data = await res.json();
      setCoverUrl(`${API}${data.url}`);
    } catch {
      setCoverPreview(null);
    }
  };

  // ── Tag input filtering
  const handleTagInput = (value) => {
    setTagInput(value);
    if (!value.trim()) {
      setTagSuggestions([]);
      return;
    }
    const lower  = value.toLowerCase();
    const filtered = allTags.filter(t =>
      t.name.toLowerCase().includes(lower) &&
      !selectedTags.some(s => s.id === t.id)
    );
    setTagSuggestions(filtered);
  };

  const addTag = (tag) => {
    if (selectedTags.length >= MAX_TAGS) return;
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setTagInput("");
    setTagSuggestions([]);
  };

  const createTag = async () => {
    const name = tagInput.trim();
    if (!name || name.length > MAX_TAG_LEN) return;
    try {
      const res  = await authFetch(`${API}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const tag = await res.json();
      addTag(tag);
      setAllTags(prev => prev.some(t => t.id === tag.id) ? prev : [...prev, tag]);
    } catch {}
  };

  const removeTag = (id) => setSelectedTags(prev => prev.filter(t => t.id !== id));

  // ── Validation
  const validate = () => {
    if (!title.trim())   return { title: "Title is required." };
    if (!summary.trim()) return { summary: "Summary is required." };
    if (!workStatus)     return { workStatus: "Work status is required." };
    if (!categoryId)     return { category: "Category is required." };
    if (selectedTags.length === 0) return { tags: "At least one tag is required." };
    return null;
  };

  // ── Submit
  const handleNext = async () => {
    const errs = validate();
    if (errs) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);

    const payload = {
      title:           title.trim(),
      summary:         summary.trim(),
      work_status:     workStatus,
      category_id:     categoryId,
      tag_ids:         selectedTags.map(t => t.id),
      cover_image_url: coverUrl || null,
    };

    try {
      let id = storyId;
      if (storyId) {
        await authFetch(`${API}/stories/${storyId}`, {
          method:  "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
      } else {
        const res  = await authFetch(`${API}/stories`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(payload),
        });
        const data = await res.json();
        id = data.id;
      }
      navigate(`/write/${id}/chapters${mode === 'collab' ? '?mode=collab' : ''}`);
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const categoryName = categories.find(c => c.id === categoryId)?.name || "";

  const showCreateTag =
    tagInput.trim().length > 0 &&
    tagInput.trim().length <= MAX_TAG_LEN &&
    !allTags.some(t => t.name.toLowerCase() === tagInput.trim().toLowerCase());

  return (
    <div className="settings-page">
      <Navbar />

      <div className="settings-container">
        <h1 className="settings-title">Story Details</h1>

        <div className="settings-body">

          {/* ── Cover image ── */}
          <div className="cover-area" onClick={() => fileInputRef.current.click()}>
            {coverPreview ? (
              <div className="cover-preview-wrap">
                <img src={coverPreview} alt="Cover" className="cover-preview-img" />
                <div className="cover-edit-overlay">Edit your cover</div>
              </div>
            ) : (
              <div className="cover-placeholder">
                <span className="cover-icon"><RiImageAddFill /></span>
                <span className="cover-label">Add a cover</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleCoverChange}
            />
          </div>

          {/* ── Form ── */}
          <div className="settings-form">

            {/* Title */}
            <div className="field-group">
              <label className="field-label">Title</label>
              <input
                type="text"
                className={`field-input${errors.title ? " field-error" : ""}`}
                placeholder="Untitled Story"
                value={title}
                onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: undefined })); }}
              />
              {errors.title && <p className="error-msg">{errors.title}</p>}
            </div>

            {/* Summary */}
            <div className="field-group">
              <label className="field-label">Summary (max. {MAX_SUMMARY} characters):</label>
              <textarea
                className={`field-textarea${errors.summary ? " field-error" : ""}`}
                value={summary}
                maxLength={MAX_SUMMARY}
                onChange={e => { setSummary(e.target.value); setErrors(p => ({ ...p, summary: undefined })); }}
              />
              <p className="char-counter">{summary.length} / {MAX_SUMMARY}</p>
              {errors.summary && <p className="error-msg">{errors.summary}</p>}
            </div>

            {/* Work status */}
            <div className="field-group" ref={statusRef}>
              <label className="field-label">Work status</label>
              <div
                className={`custom-select${statusOpen ? " open" : ""}${errors.workStatus ? " field-error" : ""}`}
                onClick={() => setStatusOpen(v => !v)}
              >
                <span className={workStatus ? "" : "placeholder"}>
                  {workStatus === "complete" ? "Complete" : workStatus === "ongoing" ? "Ongoing" : "Nothing selected"}
                </span>
                <span className="select-arrow">{statusOpen ? "▴" : "▾"}</span>
              </div>
              {statusOpen && (
                <ul className="custom-select-list">
                  {["complete", "ongoing"].map(v => (
                    <li key={v} className={`custom-select-item${workStatus === v ? " selected" : ""}`}
                      onClick={() => { setWorkStatus(v); setStatusOpen(false); setErrors(p => ({ ...p, workStatus: undefined })); }}>
                      {v === "complete" ? "Complete" : "Ongoing"}
                    </li>
                  ))}
                </ul>
              )}
              {errors.workStatus && <p className="error-msg">{errors.workStatus}</p>}
            </div>

            {/* Category */}
            <div className="field-group" ref={categoryRef}>
              <label className="field-label">Category</label>
              <div
                className={`custom-select${categoryOpen ? " open" : ""}${errors.category ? " field-error" : ""}`}
                onClick={() => setCategoryOpen(v => !v)}
              >
                <span className={categoryId ? "" : "placeholder"}>
                  {categoryName || "Select a category"}
                </span>
                <span className="select-arrow">{categoryOpen ? "▴" : "▾"}</span>
              </div>
              {categoryOpen && (
                <ul className="custom-select-list">
                  {categories.map(c => (
                    <li key={c.id} className={`custom-select-item${categoryId === c.id ? " selected" : ""}`}
                      onClick={() => { setCategoryId(c.id); setCategoryOpen(false); setErrors(p => ({ ...p, category: undefined })); }}>
                      {c.name}
                    </li>
                  ))}
                </ul>
              )}
              {errors.category && <p className="error-msg">{errors.category}</p>}
            </div>

            {/* Tags */}
            <div className="field-group" ref={tagRef}>
              <label className="field-label">Tags</label>
              <div
                className={`settings-tag-input-box${errors.tags ? " field-error" : ""}`}
                onClick={() => { setTagOpen(true); }}
              >
                {selectedTags.map(tag => (
                  <span key={tag.id} className="tag-chip">
                    {tag.name}
                    <button className="tag-chip-remove" onClick={e => { e.stopPropagation(); removeTag(tag.id); }}>×</button>
                  </span>
                ))}
                {selectedTags.length < MAX_TAGS && (
                  <input
                    className="settings-tag-text-input"
                    value={tagInput}
                    placeholder={selectedTags.length === 0 ? "Search or create tags…" : ""}
                    onChange={e => { handleTagInput(e.target.value); setErrors(p => ({ ...p, tags: undefined })); }}
                    onFocus={() => setTagOpen(true)}
                  />
                )}
              </div>
              {tagOpen && (
                <ul className="settings-tag-dropdown">
                  {!tagInput.trim() && (
                    <li className="settings-tag-dropdown-hint">Start typing for suggestions!</li>
                  )}
                  {tagSuggestions.map(t => (
                    <li key={t.id} className="settings-tag-dropdown-item" onMouseDown={() => addTag(t)}>
                      {t.name}
                    </li>
                  ))}
                  {showCreateTag && (
                    <li className="settings-tag-dropdown-item settings-tag-create" onMouseDown={createTag}>
                      Create "{tagInput.trim()}"
                    </li>
                  )}
                  {tagInput.trim() && tagSuggestions.length === 0 && !showCreateTag && (
                    <li className="settings-tag-dropdown-hint">No matches found.</li>
                  )}
                </ul>
              )}
              {errors.tags && <p className="error-msg">{errors.tags}</p>}
            </div>

            {errors.submit && <p className="error-msg">{errors.submit}</p>}

            <div className="settings-actions">
              <button className="btn-cancel" onClick={() => navigate("/")}>CANCEL</button>
              <button className="btn-next" onClick={handleNext} disabled={submitting}>
                {submitting ? "Saving…" : "NEXT"}
              </button>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StorySettings;
