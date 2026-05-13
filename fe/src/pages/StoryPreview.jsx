import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "./ReadStory.css";

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

const renderContent = (content) => {
  if (!content) return null;
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return content.split("\n\n").map((para, i) => <p key={i}>{para}</p>);
};

const StoryPreview = () => {
  useEffect(() => { document.title = "Preview | Type-Away-Writer"; }, []);

  const { id: storyId } = useParams();
  const navigate        = useNavigate();
  useAuth();

  const [story,               setStory]               = useState(null);
  const [loading,             setLoading]             = useState(true);
  const [error,               setError]               = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [dropdownOpen,        setDropdownOpen]        = useState(false);
  const [heroColor,           setHeroColor]           = useState("rgba(201, 212, 232, 0.4)");
  const [publishError,        setPublishError]        = useState(null);
  const [publishing,          setPublishing]          = useState(false);

  const chapterDropdownRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    authFetch(`${API}/stories/${storyId}`)
      .then(r => { if (!r.ok) throw new Error("Story not found"); return r.json(); })
      .then(data => setStory(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [storyId]);

  useEffect(() => {
    if (!story?.cover_image_url) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = story.cover_image_url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx    = canvas.getContext("2d");
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 40) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
      setHeroColor(`rgba(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}, 0.35)`);
    };
  }, [story?.cover_image_url]);

  useEffect(() => {
    const fn = (e) => {
      if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
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

  const goToChapter = (index) => {
    setCurrentChapterIndex(index);
    setDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return (
    <div className="story-page"><Navbar />
      <p style={{ padding: "60px 40px", color: "#888" }}>Loading preview…</p>
    <Footer /></div>
  );
  if (error || !story) return (
    <div className="story-page"><Navbar />
      <p style={{ padding: "60px 40px", color: "#c00" }}>{error || "Story not found."}</p>
    <Footer /></div>
  );

  const chapter       = story.chapters[currentChapterIndex];
  const totalChapters = story.chapters.length;
  const isFirst       = currentChapterIndex === 0;
  const isLast        = currentChapterIndex === totalChapters - 1;

  return (
    <div className="story-page">
      <Navbar />

      <div style={{ background: "#fffbea", textAlign: "center", padding: "8px", fontSize: "13px", fontWeight: 600, color: "#92400e", borderBottom: "1px solid #fde68a" }}>
        PREVIEW — this is how your story will look when published
      </div>

      {/* ── Hero ── */}
      <section className="story-hero" style={{ background: heroColor }}>
        <div className="story-hero-inner">
          {story.cover_image_url && (
            <img src={story.cover_image_url} alt={story.title} className="story-hero-cover" />
          )}
          <div className="story-hero-info">
            <p className="story-hero-meta">
              {story.work_status === "complete" ? "Complete" : "Ongoing"} • {totalChapters} Chapter{totalChapters !== 1 ? "s" : ""}
            </p>
            <h1 className="story-hero-title">{story.title}</h1>
            <p className="story-hero-author">by {[...(story.authors || [])].sort().join(", ")}</p>
            <p className="story-hero-summary">{story.summary}</p>
          </div>
        </div>
        <div className="story-hero-doodle" />
      </section>

      {/* ── Content ── */}
      <div className="story-content-area">

        {/* ── Sidebar ── */}
        <aside className="story-sidebar">
          <p className="sidebar-label">Chapters</p>
          <div className="chapter-dropdown-wrapper" ref={chapterDropdownRef}>
            <button className="chapter-dropdown-trigger" onClick={() => setDropdownOpen(p => !p)}>
              <span>Chapter {currentChapterIndex + 1}: {chapter.title}</span>
              <span className="chapter-arrow">{dropdownOpen ? "▴" : "▾"}</span>
            </button>
            {dropdownOpen && (
              <ul className="chapter-dropdown-list">
                {story.chapters.map((ch, i) => (
                  <li key={ch.id}
                    className={`chapter-dropdown-item${i === currentChapterIndex ? " active" : ""}`}
                    onClick={() => goToChapter(i)}>
                    Chapter {ch.chapter_number}: {ch.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <button className="sidebar-btn sidebar-btn-primary" onClick={() => navigate(`/write/${storyId}/chapters`)}>
              Edit Story
            </button>
            <button className="sidebar-btn sidebar-btn-primary" onClick={handlePublish} disabled={publishing}>
              {publishing ? "Publishing…" : "Publish"}
            </button>
            {publishError && <p style={{ color: "#e53e3e", fontSize: "12px", margin: 0 }}>{publishError}</p>}
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="story-main">
          <h2 className="chapter-title">
            Chapter {chapter.chapter_number}: {chapter.title}
          </h2>

          <div className="chapter-content">
            {renderContent(chapter.content)}
          </div>

          <hr className="chapter-divider" />

          <div className={`chapter-nav ${isFirst ? "chapter-nav-end" : isLast ? "chapter-nav-start" : "chapter-nav-both"}`}>
            {!isFirst && (
              <button className="chapter-nav-btn" onClick={() => goToChapter(currentChapterIndex - 1)}>
                PREVIOUS CHAPTER
              </button>
            )}
            {!isLast && (
              <button className="chapter-nav-btn chapter-nav-btn-dark" onClick={() => goToChapter(currentChapterIndex + 1)}>
                NEXT CHAPTER
              </button>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default StoryPreview;
