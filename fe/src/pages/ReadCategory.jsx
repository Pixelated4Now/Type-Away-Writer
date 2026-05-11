import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ReadCategory.css";
import bannerImg from "../assets/readBanner.jpg";

const API     = process.env.REACT_APP_API_URL || "http://localhost:5000";
const MAX_TAGS = 20;

// Map DB status values to display labels and back
const STATUS_DISPLAY = { published: "Complete", draft: "Ongoing" };

const ReadCategory = () => {
  const { categoryId } = useParams();
  const navigate       = useNavigate();

  // ── Category & tag data from API
  const [category, setCategory]   = useState(null);
  const [allTags, setAllTags]     = useState([]);   // string[]

  // ── Search form state
  const [titleInput, setTitleInput]         = useState("");
  const [authorInput, setAuthorInput]       = useState("");
  const [tagInput, setTagInput]             = useState("");
  const [selectedTags, setSelectedTags]     = useState([]);
  const [tagDropdown, setTagDropdown]       = useState([]);
  const [showDropdown, setShowDropdown]     = useState(false);
  const [completionStatus, setCompletionStatus] = useState("All");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // ── Results state
  const [stories, setStories]         = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  // ── Refs for outside-click closing
  const tagRef    = useRef(null);
  const statusRef = useRef(null);

  // ── Fetch categories + tags once on mount
  useEffect(() => {
    Promise.all([
      fetch(`${API}/categories`).then((r) => r.json()),
      fetch(`${API}/tags`).then((r) => r.json()),
    ])
      .then(([cats, tags]) => {
        setCategory(cats.find((c) => c.id === parseInt(categoryId, 10)) || null);
        setAllTags(tags.map((t) => t.name));
      })
      .catch(console.error);
  }, [categoryId]);

  // ── Fetch stories (called on mount and on search)
  const fetchStories = useCallback(
    async (filters = {}) => {
      setStoriesLoading(true);
      try {
        const params = new URLSearchParams({ category_id: categoryId });
        if (filters.title)  params.set("title",  filters.title);
        if (filters.author) params.set("author", filters.author);
        if (filters.tags)   params.set("tags",   filters.tags);
        if (filters.status) params.set("status", filters.status);

        const res  = await fetch(`${API}/stories?${params}`);
        const data = await res.json();
        setStories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("fetchStories error:", err);
        setStories([]);
      } finally {
        setStoriesLoading(false);
      }
    },
    [categoryId]
  );

  useEffect(() => { fetchStories(); }, [fetchStories]);

  // ── Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (tagRef.current    && !tagRef.current.contains(e.target))    setShowDropdown(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatusDropdown(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Tag autocomplete
  const handleTagInput = (e) => {
    const val = e.target.value;
    setTagInput(val);
    if (!val.trim()) { setTagDropdown([]); setShowDropdown(false); return; }
    const matches = allTags.filter(
      (t) => t.toLowerCase().startsWith(val.toLowerCase()) && !selectedTags.includes(t)
    );
    setTagDropdown(matches);
    setShowDropdown(matches.length > 0);
  };

  const addTag = (tag) => {
    if (selectedTags.length >= MAX_TAGS) return;
    setSelectedTags((prev) => [...prev, tag]);
    setTagInput("");
    setTagDropdown([]);
    setShowDropdown(false);
  };

  const removeTag = (tag) => setSelectedTags((prev) => prev.filter((t) => t !== tag));

  // ── Search handler — fires a new API fetch
  const handleSearch = () => {
    const filters = {};
    if (titleInput.trim())   filters.title  = titleInput.trim();
    if (authorInput.trim())  filters.author = authorInput.trim();
    if (selectedTags.length) filters.tags   = selectedTags.join(",");
    if (completionStatus !== "All") filters.status = completionStatus.toLowerCase();
    fetchStories(filters);
  };

  const categoryName = category?.name || "Stories";

  return (
    <div className="category-page">
      <Navbar />

      <section className="category-hero">
        <div className="category-hero-image">
          <img src={bannerImg} alt="Books" />
        </div>
        <div className="category-hero-text">
          <h1>Start Reading!</h1>
          <p>
            Pick a category and start exploring stories you'll love. Whether it's adventure,
            mystery, or fantasy, there's something waiting just for you.
            Dive in and discover your next favourite story!
          </p>
        </div>
      </section>

      <h2 className="category-title">{categoryName}</h2>

      <div className="category-main">

        {/* ── Story List ── */}
        <div className="story-list">
          {storiesLoading ? (
            <p style={{ color: "#888", padding: "24px 0" }}>Loading stories…</p>
          ) : stories.length > 0 ? (
            stories.map((story) => (
              <div
                key={story.id}
                className="story-card"
                onClick={() => navigate(`/read/story/${story.id}`)}
              >
                <div className="story-cover">
                  <img
                    src={story.cover_image_url || "/assets/covers/default.png"}
                    alt={story.title}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
                <div className="story-info">
                  <h3 className="story-title">{story.title}</h3>
                  <p className="story-authors">
                    by {[...(story.authors || [])].sort().join(", ")}
                  </p>
                  <p className="story-summary">{story.summary}</p>
                  <div className="story-tags">
                    {(story.tags || []).map((tag) => (
                      <span key={tag} className="story-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="story-meta">
                    <span className="story-status">
                      {STATUS_DISPLAY[story.status] || story.status}
                    </span>
                    <span>{story.chapter_count} chapter{story.chapter_count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="story-stats">
                    {story.likes_count} likes • {story.comment_count} comments
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results">
              There are currently no stories matching your search criteria.<br />
              Try adjusting your search or{" "}
              <Link to="/write" className="no-results-link">write your own story</Link>
              {" "}on Type-Away-Writer.
            </p>
          )}
        </div>

        {/* ── Work Search ── */}
        <aside className="work-search">
          <h3 className="work-search-title">Work Search</h3>

          <div className="search-field">
            <label>Title:</label>
            <input
              type="text"
              placeholder="Search title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="search-field">
            <label>Author:</label>
            <input
              type="text"
              placeholder="Search author name"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="search-field" ref={tagRef}>
            <label>Tags:</label>
            <div className={`tag-input-box ${showDropdown ? "active" : ""}`}>
              {selectedTags.map((tag) => (
                <span key={tag} className="selected-tag">
                  {tag}
                  <button className="remove-tag" onClick={() => removeTag(tag)}>×</button>
                </span>
              ))}
              {selectedTags.length < MAX_TAGS && (
                <input
                  type="text"
                  placeholder={selectedTags.length === 0 ? "Search matching tags to include" : ""}
                  value={tagInput}
                  onChange={handleTagInput}
                  onFocus={() => { if (tagDropdown.length > 0) setShowDropdown(true); }}
                  className="tag-text-input"
                />
              )}
            </div>
            {showDropdown && (
              <ul className="tag-dropdown">
                {tagDropdown.map((tag) => (
                  <li key={tag} className="tag-dropdown-item" onMouseDown={() => addTag(tag)}>
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="search-field" ref={statusRef}>
            <label>Completion status:</label>
            <div
              className={`status-select ${showStatusDropdown ? "active" : ""}`}
              onClick={() => setShowStatusDropdown((p) => !p)}
            >
              <span>{completionStatus === "All" ? "Search status" : completionStatus}</span>
              <span className="status-arrow">▾</span>
            </div>
            {showStatusDropdown && (
              <ul className="status-dropdown">
                {["All", "Complete", "Ongoing"].map((s) => (
                  <li
                    key={s}
                    className={`status-option ${completionStatus === s ? "selected" : ""}`}
                    onMouseDown={() => { setCompletionStatus(s); setShowStatusDropdown(false); }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="search-btn" onClick={handleSearch}>SEARCH</button>
        </aside>
      </div>

      <Footer />
    </div>
  );
};

export default ReadCategory;
