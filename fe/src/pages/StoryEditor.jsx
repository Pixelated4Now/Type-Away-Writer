import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { BsTrash } from "react-icons/bs";
import "./StoryEditor.css";
import "quill/dist/quill.snow.css";

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

const StoryEditor = () => {
  useEffect(() => { document.title = "Write | Type-Away-Writer"; }, []);

  const navigate        = useNavigate();
  const { id: storyId } = useParams();
  const { user }        = useAuth();

  const [chapters,          setChapters]          = useState([]);
  const [currentChapterId,  setCurrentChapterId]  = useState(null);
  const [chapterName,       setChapterName]        = useState("");
  const [savedName,         setSavedName]          = useState("");
  const [savedContent,      setSavedContent]       = useState("");
  const [loading,           setLoading]            = useState(true);
  const [deleteConfirmId,   setDeleteConfirmId]    = useState(null);
  const [backConfirm,       setBackConfirm]        = useState(false);
  const [publishError,      setPublishError]       = useState(null);
  const [publishing,        setPublishing]         = useState(false);

  const quillRef          = useRef(null);   // Quill instance
  const editorContainerRef = useRef(null);  // DOM node for Quill
  const quillInitialized  = useRef(false);

  // ── Image upload handler (stored in ref so Quill toolbar can call it)
  const imageHandlerRef = useRef(null);
  imageHandlerRef.current = useCallback(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res  = await authFetch(`${API}/upload/image`, { method: "POST", body: formData });
        const data = await res.json();
        const quill = quillRef.current;
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, "image", `${API}${data.url}`);
        quill.setSelection(range.index + 1);
      } catch (err) {
        console.error("Image upload error:", err);
      }
    };
  }, []);

  // ── Init Quill once
  useEffect(() => {
    if (quillInitialized.current || !editorContainerRef.current) return;
    quillInitialized.current = true;

    import("quill").then(({ default: Quill }) => {
      const quill = new Quill(editorContainerRef.current, {
        theme: "snow",
        placeholder: "Start writing here...",
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["image"],
            ],
            handlers: {
              image: () => imageHandlerRef.current(),
            },
          },
        },
      });
      quillRef.current = quill;

      // Load initial chapter once Quill is ready
      if (chapters.length > 0 && currentChapterId) {
        const ch = chapters.find(c => c.id === currentChapterId);
        if (ch) {
          quill.root.innerHTML = ch.content || "";
          setSavedContent(ch.content || "");
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch chapters on mount
  useEffect(() => {
    let ignore = false;
    setLoading(true);

    (async () => {
      try {
        const r    = await authFetch(`${API}/stories/${storyId}/chapters`);
        if (ignore) return;
        const data = await r.json();
        if (ignore) return;

        let chs = Array.isArray(data) ? data : [];
        if (chs.length === 0) {
          const res   = await authFetch(`${API}/stories/${storyId}/chapters`, { method: "POST" });
          if (ignore) return;
          const newCh = await res.json();
          chs = [newCh];
        }

        setChapters(chs);
        const first = chs[0];
        setCurrentChapterId(first.id);
        setChapterName(first.title || "");
        setSavedName(first.title || "");
        setSavedContent(first.content || "");
        if (quillRef.current) {
          quillRef.current.root.innerHTML = first.content || "";
        }
      } catch (err) {
        if (!ignore) console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [storyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── When currentChapterId changes (and Quill is ready), update editor content
  useEffect(() => {
    if (!quillRef.current || !currentChapterId) return;
    const ch = chapters.find(c => c.id === currentChapterId);
    if (ch) {
      quillRef.current.root.innerHTML = ch.content || "";
    }
  }, [currentChapterId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save current chapter
  const saveCurrentChapter = useCallback(async () => {
    if (!currentChapterId || !quillRef.current) return;
    const content = quillRef.current.root.innerHTML;
    const title   = chapterName;
    try {
      await authFetch(`${API}/chapters/${currentChapterId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, content }),
      });
      setSavedName(title);
      setSavedContent(content);
      setChapters(prev =>
        prev.map(c => c.id === currentChapterId ? { ...c, title, content } : c)
      );
    } catch (err) {
      console.error("Save error:", err);
    }
  }, [currentChapterId, chapterName]);

  // ── Switch chapter
  const switchToChapter = async (chId) => {
    if (chId === currentChapterId) return;
    await saveCurrentChapter();
    const ch = chapters.find(c => c.id === chId);
    setCurrentChapterId(chId);
    setChapterName(ch?.title || "");
    setSavedName(ch?.title || "");
    setSavedContent(ch?.content || "");
    if (quillRef.current) {
      quillRef.current.root.innerHTML = ch?.content || "";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Add chapter
  const handleAddChapter = async () => {
    await saveCurrentChapter();
    try {
      const res   = await authFetch(`${API}/stories/${storyId}/chapters`, { method: "POST" });
      const newCh = await res.json();
      setChapters(prev => [...prev, newCh]);
      setCurrentChapterId(newCh.id);
      setChapterName("");
      setSavedName("");
      setSavedContent("");
      if (quillRef.current) quillRef.current.root.innerHTML = "";
    } catch (err) {
      console.error("Add chapter error:", err);
    }
  };

  // ── Delete chapter
  const handleDeleteChapter = async (chId) => {
    if (chapters.length <= 1) return;
    try {
      await authFetch(`${API}/chapters/${chId}`, { method: "DELETE" });
      const remaining = chapters.filter(c => c.id !== chId);
      setChapters(remaining);
      setDeleteConfirmId(null);
      if (chId === currentChapterId) {
        const next = remaining[0];
        setCurrentChapterId(next.id);
        setChapterName(next.title || "");
        setSavedName(next.title || "");
        setSavedContent(next.content || "");
        if (quillRef.current) quillRef.current.root.innerHTML = next.content || "";
      }
    } catch (err) {
      console.error("Delete chapter error:", err);
    }
  };

  // ── Unsaved check
  const hasUnsavedChanges = () => {
    const currentContent = quillRef.current?.root.innerHTML || "";
    return chapterName !== savedName || currentContent !== savedContent;
  };

  // ── Publish
  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    await saveCurrentChapter();

    // Validate every chapter before hitting the server.
    // Use live values for the current chapter because the state update
    // from saveCurrentChapter hasn't been applied yet.
    const liveContent = quillRef.current?.root.innerHTML || "";
    const errs = [];
    chapters.forEach((ch, i) => {
      const title   = ch.id === currentChapterId ? chapterName : (ch.title   || "");
      const content = ch.id === currentChapterId ? liveContent : (ch.content || "");
      const num = i + 1;
      if (!title.trim()) errs.push(`Chapter ${num} has no title.`);
      const isEmpty = !content.trim() || content.trim() === "<p><br></p>";
      if (isEmpty) errs.push(`Chapter ${num} has no content.`);
    });

    if (errs.length > 0) {
      setPublishError(errs.join(" "));
      setPublishing(false);
      return;
    }

    try {
      const res  = await authFetch(`${API}/stories/${storyId}/publish`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        navigate(`/read/story/${storyId}`);
      } else {
        setPublishError((data.errors || []).join(" "));
      }
    } catch {
      setPublishError("Something went wrong.");
    } finally {
      setPublishing(false);
    }
  };

  // ── Back
  const handleBack = () => {
    if (hasUnsavedChanges()) { setBackConfirm(true); return; }
    navigate(`/write/${storyId}/settings`);
  };

  // ── Save as draft
  const handleSaveAsDraft = async () => {
    await saveCurrentChapter();
    await authFetch(`${API}/stories/${storyId}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "draft" }),
    });
    navigate(`/profile/${user?.username}`);
  };

  // ── Preview
  const handlePreview = async () => {
    await saveCurrentChapter();
    navigate(`/write/${storyId}/preview`);
  };

  const currentIndex = chapters.findIndex(c => c.id === currentChapterId);

  return (
    <div className="editor-page">
      <Navbar />

      <div className="editor-layout">

        {/* ── Main Editor ── */}
        <div className="editor-main">
          <h2 className="editor-chapter-heading">
            {loading ? "Loading…" : `Chapter ${currentIndex + 1}`}
          </h2>

          <div className="editor-chapter-name-row">
            <label className="editor-chapter-name-label">Chapter Name:</label>
            <input
              className="editor-chapter-name-input"
              placeholder="Untitled"
              value={chapterName}
              onChange={e => setChapterName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="editor-quill-wrapper">
            <div ref={editorContainerRef} className="editor-quill-container" />
          </div>

          {publishError && <p className="editor-publish-error">{publishError}</p>}

          <div className="editor-actions">
            <button className="editor-btn editor-btn-outline" onClick={handleBack} disabled={loading}>BACK</button>
            <button className="editor-btn editor-btn-outline" onClick={handlePreview} disabled={loading}>PREVIEW</button>
            <button className="editor-btn editor-btn-outline" onClick={handleSaveAsDraft} disabled={loading}>SAVE AS DRAFT</button>
            <button className="editor-btn editor-btn-dark" onClick={handlePublish} disabled={publishing || loading}>
              {publishing ? "Publishing…" : "PUBLISH"}
            </button>
          </div>
        </div>

        {/* ── Chapter Sidebar ── */}
        <aside className="editor-sidebar">
          <p className="editor-sidebar-label">Chapters</p>
          <ul className="editor-chapter-list">
            {chapters.map((ch, i) => (
              <li
                key={ch.id}
                className={`editor-chapter-item${ch.id === currentChapterId ? " active" : ""}`}
                onClick={() => switchToChapter(ch.id)}
              >
                <span className="editor-chapter-name">
                  {ch.title || `Chapter ${i + 1}`}
                </span>
                <button
                  className={`editor-trash-btn${chapters.length <= 1 ? " disabled" : ""}`}
                  onClick={e => { e.stopPropagation(); if (chapters.length > 1) setDeleteConfirmId(ch.id); }}
                  title="Delete chapter"
                >
                  <BsTrash />
                </button>
              </li>
            ))}
          </ul>
          <button className="editor-add-chapter-btn" onClick={handleAddChapter} disabled={loading}>
            <span>+</span> ADD CHAPTER
          </button>
        </aside>
      </div>

      {/* ── Delete confirmation popup ── */}
      {deleteConfirmId && (
        <div className="editor-overlay">
          <div className="editor-popup">
            <p className="editor-popup-text">
              Are you sure you want to delete this chapter? This cannot be undone.
            </p>
            <div className="editor-popup-actions">
              <button className="editor-btn editor-btn-outline" onClick={() => setDeleteConfirmId(null)}>CANCEL</button>
              <button className="editor-btn editor-btn-danger" onClick={() => handleDeleteChapter(deleteConfirmId)}>DELETE</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Back confirmation popup ── */}
      {backConfirm && (
        <div className="editor-overlay">
          <div className="editor-popup">
            <p className="editor-popup-text">
              You have unsaved changes. Are you sure you want to go back?
            </p>
            <div className="editor-popup-actions">
              <button className="editor-btn editor-btn-outline" onClick={() => setBackConfirm(false)}>STAY</button>
              <button className="editor-btn editor-btn-dark" onClick={() => navigate(`/write/${storyId}/settings`)}>GO BACK</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default StoryEditor;
