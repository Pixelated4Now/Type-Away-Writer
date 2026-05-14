import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "./ReadStory.css";
import "./Commenting.css";

import readingListImg from "../assets/addToList.png";
import shareImg       from "../assets/share.png";
import likeImg        from "../assets/likeAChapter.png";
import likedImg       from "../assets/likedAChapter.png";
import reviewImg from "../assets/reviewSubmit.png";
import { ImPencil } from "react-icons/im";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Attach the stored JWT to any request that requires auth
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDatetime = (isoString) =>
  new Date(isoString).toLocaleString("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

// Sort top-level comments: experts first (newest), then others (newest)
const sortTopLevel = (comments) => {
  const experts = comments.filter((c) => c.role === "expert")
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  const others  = comments.filter((c) => c.role !== "expert")
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  return [...experts, ...others];
};

// Collect all descendant IDs of a comment (for client-side cascade on delete)
const collectDescendants = (commentId, all) => {
  const children = all.filter((c) => c.parentId === commentId);
  let ids = children.map((c) => c.id);
  children.forEach((ch) => { ids = ids.concat(collectDescendants(ch.id, all)); });
  return ids;
};

// Map a raw API comment to the shape the components expect
const mapComment = (c, storyAuthors = []) => ({
  id:         c.id,
  username:   c.user?.username || "Unknown",
  avatar:     c.user?.avatar_url ? `${API}${c.user.avatar_url}` : null,
  role:       c.user?.account_type === "expert" ? "expert"
            : storyAuthors.includes(c.user?.username) ? "author"
            : "reader",
  datetime:   c.created_at,
  text:       c.content,
  parentId:   c.parent_id ?? null,
  chapter_id: c.chapter_id ?? null,
});

// ── RoleBadge ─────────────────────────────────────────────────────────────────

const RoleBadge = ({ role }) => {
  if (role === "expert") return <span className="badge badge-expert">LANGUAGE EXPERT</span>;
  if (role === "author") return <span className="badge badge-author">AUTHOR</span>;
  return null;
};

// ── CommentThread (recursive) ─────────────────────────────────────────────────

const CommentThread = ({ comment, allComments, depth, onReply, onDelete, currentUser }) => {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const children = allComments
    .filter((c) => c.parentId === comment.id)
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText("");
    setReplyOpen(false);
  };

  return (
    <div className={`comment-thread ${depth > 0 ? "comment-indented" : ""}`}>
      <div className="comment-item">
        {comment.avatar
          ? <img src={comment.avatar} alt={comment.username} className="comment-avatar" />
          : <span className="comment-avatar-initials">{comment.username[0].toUpperCase()}</span>
        }
        <div className="comment-body">
          <div className="comment-header">
            <Link to={`/profile/${comment.username}`} className="author-link comment-username">{comment.username}</Link>
            <RoleBadge role={comment.role} />
            <span className="comment-datetime">{formatDatetime(comment.datetime)}</span>
          </div>
          <p className="comment-text">{comment.text}</p>
          <div className="comment-actions">
            <button className="reply-btn" onClick={() => setReplyOpen((p) => !p)}>REPLY</button>
            {comment.username === currentUser && (
              <button className="delete-btn" onClick={() => onDelete(comment.id)}>DELETE</button>
            )}
          </div>
          {replyOpen && (
            <div className="reply-input-area">
              <textarea
                className="comment-textarea reply-textarea"
                placeholder="Write a comment..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="reply-submit-row">
                <button className="comment-submit-btn" onClick={handleSubmitReply}>REPLY</button>
                <button className="cancel-btn" onClick={() => { setReplyOpen(false); setReplyText(""); }}>CANCEL</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {children.map((child) => (
        <CommentThread key={child.id} comment={child} allComments={allComments}
          depth={depth + 1} onReply={onReply} onDelete={onDelete} currentUser={currentUser} />
      ))}
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const ReadStory = () => {
  useEffect(() => { document.title = 'Read | Type-Away-Writer'; }, []);

  const { storyId }    = useParams();
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const currentUser    = user?.username ?? null;

  // ── Submit for Review modal
  const [reviewModalOpen,   setReviewModalOpen]   = useState(false);
  const [expertSearch,      setExpertSearch]      = useState("");
  const [expertSuggestions, setExpertSuggestions] = useState([]);
  const [selectedExpert,    setSelectedExpert]    = useState(null); // {id, username}
  const [reviewSubmitting,  setReviewSubmitting]  = useState(false);
  const [reviewSuccess,     setReviewSuccess]     = useState(false);
  const [reviewError,       setReviewError]       = useState(null);

  // ── Story data
  const [story, setStory]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // ── Chapter
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen]               = useState(false);

  // ── Like
  const [liked, setLiked]         = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // ── Comments (flat list for current chapter)
  const [comments, setComments]     = useState([]);
  const [commentText, setCommentText] = useState("");

  // ── Reading lists
  const [readingLists, setReadingLists]   = useState([]);
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const [showCreateForm, setShowCreateForm]     = useState(false);
  const [newListTitle, setNewListTitle]         = useState("");
  const [newListPublic, setNewListPublic]       = useState(false);

  // ── Hero colour
  const [heroColor, setHeroColor] = useState("rgba(201, 212, 232, 0.4)");

  // ── Refs
  const chapterDropdownRef = useRef(null);
  const listDropdownRef    = useRef(null);

  // ── Fetch story on mount
  useEffect(() => {
    setLoading(true);
    authFetch(`${API}/stories/${storyId}`)
      .then((r) => { if (!r.ok) throw new Error("Story not found"); return r.json(); })
      .then((data) => {
        setStory(data);
        setLiked(data.user_liked);
        setLikesCount(data.likes_count);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [storyId]);

  // ── Fetch comments for the current chapter whenever chapter changes
  useEffect(() => {
    if (!story) return;
    const chapter = story.chapters[currentChapterIndex];
    if (!chapter) return;
    authFetch(`${API}/stories/${storyId}/comments?chapter=${chapter.id}`)
      .then((r) => r.json())
      .then((data) => setComments(
        (Array.isArray(data) ? data : []).map((c) => mapComment(c, story.authors))
      ))
      .catch(console.error);
  }, [story, storyId, currentChapterIndex]);

  // ── Fetch reading lists if logged in
  useEffect(() => {
    if (!user) return;
    authFetch(`${API}/users/me/reading-lists`)
      .then((r) => r.json())
      .then((data) =>
        setReadingLists((Array.isArray(data) ? data : []).map((l) => ({
          id:       l.id,
          title:    l.title,
          isPublic: l.is_public,
          storyIds: l.story_ids || [],
        })))
      )
      .catch(console.error);
  }, [user]);

  // ── Extract dominant colour from cover
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
      for (let i = 0; i < data.length; i += 40) { r += data[i]; g += data[i+1]; b += data[i+2]; count++; }
      setHeroColor(`rgba(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)}, 0.35)`);
    };
  }, [story?.cover_image_url]);

  // ── Close chapter dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Close list dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (listDropdownRef.current && !listDropdownRef.current.contains(e.target)) {
        setListDropdownOpen(false); setShowCreateForm(false);
        setNewListTitle(""); setNewListPublic(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // ── Early returns for loading / error
  if (loading) return (
    <div className="story-page"><Navbar />
      <p style={{ padding: "60px 40px", color: "#888" }}>Loading story…</p>
    <Footer /></div>
  );
  if (error || !story) return (
    <div className="story-page"><Navbar />
      <p style={{ padding: "60px 40px", color: "#c00" }}>{error || "Story not found."}</p>
    <Footer /></div>
  );

  const chapter      = story.chapters[currentChapterIndex];
  const totalChapters = story.chapters.length;
  const isFirst      = currentChapterIndex === 0;
  const isLast       = currentChapterIndex === totalChapters - 1;
  const topLevel     = sortTopLevel(comments.filter((c) => c.parentId === null));

  // ── Chapter navigation
  const goToChapter = (index) => {
    setCurrentChapterIndex(index);
    setDropdownOpen(false);
    setCommentText("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Like toggle
  const handleLike = async () => {
    if (!user) return;
    try {
      const res  = await authFetch(`${API}/stories/${storyId}/like`, { method: "POST" });
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    } catch (err) { console.error("Like error:", err); }
  };

  // ── Post comment (top-level, on current chapter)
  const handleComment = async () => {
    if (!commentText.trim() || !user) return;
    try {
      const res  = await authFetch(`${API}/stories/${storyId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chapter_id: chapter.id, content: commentText.trim() }),
      });
      const data = await res.json();
      setComments((prev) => [...prev, mapComment(data, story.authors)]);
      setCommentText("");
    } catch (err) { console.error("Comment error:", err); }
  };

  // ── Post reply
  const handleReply = async (parentId, text) => {
    if (!user) return;
    try {
      const res  = await authFetch(`${API}/stories/${storyId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chapter_id: chapter.id, content: text, parent_id: parentId }),
      });
      const data = await res.json();
      setComments((prev) => [...prev, mapComment(data, story.authors)]);
    } catch (err) { console.error("Reply error:", err); }
  };

  // ── Delete comment
  const handleDelete = async (commentId) => {
    try {
      await authFetch(`${API}/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => {
        const toRemove = new Set([commentId, ...collectDescendants(commentId, prev)]);
        return prev.filter((c) => !toRemove.has(c.id));
      });
    } catch (err) { console.error("Delete error:", err); }
  };

  // ── Add story to existing reading list
  const handleAddToList = async (listId) => {
    const list = readingLists.find((l) => l.id === listId);
    if (!list || list.storyIds.includes(parseInt(storyId, 10))) return;
    // Optimistic
    setReadingLists((prev) =>
      prev.map((l) => l.id === listId ? { ...l, storyIds: [...l.storyIds, parseInt(storyId, 10)] } : l)
    );
    try {
      await authFetch(`${API}/reading-lists/${listId}/stories`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ story_id: parseInt(storyId, 10) }),
      });
    } catch (err) { console.error("Add to list error:", err); }
  };

  // ── Create new reading list then add story
  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    try {
      const res      = await authFetch(`${API}/users/me/reading-lists`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: newListTitle.trim(), is_public: newListPublic }),
      });
      const newList  = await res.json();
      const mapped   = { id: newList.id, title: newList.title, isPublic: newList.is_public, storyIds: [] };
      setReadingLists((prev) => [...prev, mapped]);

      // Add story to new list
      await authFetch(`${API}/reading-lists/${newList.id}/stories`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ story_id: parseInt(storyId, 10) }),
      });
      setReadingLists((prev) =>
        prev.map((l) => l.id === newList.id ? { ...l, storyIds: [parseInt(storyId, 10)] } : l)
      );
    } catch (err) { console.error("Create list error:", err); }
    setNewListTitle(""); setNewListPublic(false); setShowCreateForm(false);
  };

  // ── Expert search
  const handleExpertSearch = async (value) => {
    setExpertSearch(value);
    setSelectedExpert(null);
    if (!value.trim()) { setExpertSuggestions([]); return; }
    try {
      const res  = await authFetch(`${API}/users/experts?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      setExpertSuggestions(Array.isArray(data) ? data : []);
    } catch { setExpertSuggestions([]); }
  };

  const handleReviewSubmit = async () => {
    if (!selectedExpert) { setReviewError("Please choose an expert."); return; }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res  = await authFetch(`${API}/stories/${storyId}/review-requests`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ expert_id: selectedExpert.id }),
      });
      const data = await res.json();
      if (data.success) { setReviewSuccess(true); }
      else setReviewError(data.message || "Something went wrong.");
    } catch { setReviewError("Something went wrong."); }
    finally { setReviewSubmitting(false); }
  };

  const openReviewModal = () => {
    setReviewModalOpen(true);
    setExpertSearch("");
    setExpertSuggestions([]);
    setSelectedExpert(null);
    setReviewSuccess(false);
    setReviewError(null);
  };

  const isAuthor = story && currentUser && story.authors?.includes(currentUser);

  const privateLists = readingLists.filter((l) => !l.isPublic);
  const publicLists  = readingLists.filter((l) =>  l.isPublic);
  const storyIdInt   = parseInt(storyId, 10);

  return (
    <div className="story-page">
      <Navbar />

      {/* ── Story Hero ── */}
      <section className="story-hero" style={{ background: heroColor }}>
        <div className="story-hero-inner">
          <img src={story.cover_image_url} alt={story.title} className="story-hero-cover" />
          <div className="story-hero-info">
            <p className="story-hero-meta">
              {story.work_status === "complete" ? "Complete" : "Ongoing"} • {totalChapters} Chapter{totalChapters !== 1 ? "s" : ""}
            </p>
            <h1 className="story-hero-title">{story.title}</h1>
            <p className="story-hero-author">
              by {[...(story.authors || [])].sort().map((name, i, arr) => (
                <span key={name}>
                  <Link to={`/profile/${name}`} className="author-link">{name}</Link>
                  {i < arr.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
            <p className="story-hero-summary">{story.summary}</p>
          </div>
        </div>
        <div className="story-hero-doodle" />
      </section>

      {/* ── Content Area ── */}
      <div className="story-content-area">

        {/* ── Left Sidebar ── */}
        <aside className="story-sidebar">
          
          <p className="sidebar-label">Chapters</p>

          <div className="chapter-dropdown-wrapper" ref={chapterDropdownRef}>
            <button
              className="chapter-dropdown-trigger"
              onClick={() => setDropdownOpen((p) => !p)}
            >
              <span>Chapter {currentChapterIndex + 1}: {chapter.title}</span>
              <span className="chapter-arrow">{dropdownOpen ? "▴" : "▾"}</span>
            </button>
            {dropdownOpen && (
              <ul className="chapter-dropdown-list">
                {story.chapters.map((ch, i) => (
                  <li
                    key={ch.id}
                    className={`chapter-dropdown-item ${i === currentChapterIndex ? "active" : ""}`}
                    onClick={() => goToChapter(i)}
                  >
                    Chapter {ch.chapter_number}: {ch.title}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add to Reading List */}
          <div className="reading-list-wrapper" ref={listDropdownRef}>
            <button
              className="sidebar-btn sidebar-btn-primary"
              onClick={() => { setListDropdownOpen((p) => !p); setShowCreateForm(false); setNewListTitle(""); setNewListPublic(false); }}
            >
              <img src={readingListImg} alt="Reading list" />
              Add to reading list
            </button>

            {listDropdownOpen && (
              <div className="reading-list-dropdown">
                {!user && <p className="list-empty-msg">Log in to use reading lists.</p>}

                {user && privateLists.length > 0 && (
                  <>
                    <p className="list-section-label">Private Lists</p>
                    {privateLists.map((list) => {
                      const saved = list.storyIds.includes(storyIdInt);
                      return (
                        <div key={list.id} className={`list-item ${saved ? "list-item-saved" : ""}`} onClick={() => handleAddToList(list.id)}>
                          <span className="list-item-title">{list.title}</span>
                          {saved && <span className="list-checkmark">✓</span>}
                        </div>
                      );
                    })}
                  </>
                )}

                {user && publicLists.length > 0 && (
                  <>
                    <p className="list-section-label">Public Lists</p>
                    {publicLists.map((list) => {
                      const saved = list.storyIds.includes(storyIdInt);
                      return (
                        <div key={list.id} className={`list-item ${saved ? "list-item-saved" : ""}`} onClick={() => handleAddToList(list.id)}>
                          <span className="list-item-title">{list.title}</span>
                          {saved && <span className="list-checkmark">✓</span>}
                        </div>
                      );
                    })}
                  </>
                )}

                {user && privateLists.length === 0 && publicLists.length === 0 && !showCreateForm && (
                  <p className="list-empty-msg">You have no reading lists yet.</p>
                )}

                {user && !showCreateForm ? (
                  <div className="list-create-trigger" onClick={() => setShowCreateForm(true)}>
                    <span className="list-create-icon">⊕</span>
                    <span>Create New List</span>
                  </div>
                ) : user && (
                  <div className="list-create-form">
                    <input
                      type="text"
                      className="list-title-input"
                      placeholder="Reading List Title"
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                    />
                    <div className="list-form-row">
                      <label className="list-public-label">
                        <input type="checkbox" checked={newListPublic} onChange={(e) => setNewListPublic(e.target.checked)} className="list-public-checkbox" />
                        Public
                      </label>
                      <button className="list-add-btn" onClick={handleCreateList}>Add</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="sidebar-btn sidebar-btn-secondary" style={{ marginBottom: "40px" }}>
            <img src={shareImg} alt="Share" /> Share
          </button>

          {isAuthor && (
            <>
              <button className="sidebar-btn sidebar-btn-primary" style={{ marginBottom: "4px" }} onClick={openReviewModal}> <img src={reviewImg} alt="Submit for review" />
                Submit for Review
              </button>
              <button className="sidebar-btn sidebar-btn-secondary" onClick={() => navigate(`/write/${storyId}/settings`)}>
                <ImPencil /> Edit
              </button>
            </>
          )}

        </aside>

        {/* ── Main Reading Area ── */}
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

          <button className={`like-btn ${liked ? "liked" : ""}`} onClick={handleLike} style={{ margin: "24px 0 8px" }}>
            <img src={liked ? likedImg : likeImg} alt="Like icon" />
            {liked ? "LIKED" : "LIKE"} {likesCount > 0 && `· ${likesCount}`}
          </button>

          {user ? (
            <div className="comment-input-area">
              <textarea
                className="comment-textarea"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="comment-submit-row">
                <button className="comment-submit-btn" onClick={handleComment}>COMMENT</button>
              </div>
            </div>
          ) : (
            <p style={{ color: "#888", margin: "24px 0", fontSize: "14px" }}>
              Log in to leave a comment.
            </p>
          )}

          <div className="comments-list">
            {topLevel.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                allComments={comments}
                depth={0}
                onReply={handleReply}
                onDelete={handleDelete}
                currentUser={currentUser}
              />
            ))}
          </div>
        </main>
      </div>

      <Footer />

      {/* ── Submit for Review modal ── */}
      {reviewModalOpen && (
        <div className="review-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setReviewModalOpen(false); }}>
          <div className="review-modal">
            <button className="review-modal-close" onClick={() => setReviewModalOpen(false)}>×</button>

            {reviewSuccess ? (
              <div className="review-success">
                <span className="review-success-icon">✓</span>
                <p className="review-success-text">
                  Your story has been submitted for review. You'll hear from {selectedExpert?.username} soon!
                </p>
              </div>
            ) : (
              <>
                <h2 className="review-modal-title">Submit your story for review by a language expert!</h2>
                <p className="review-modal-intro">
                  Fee-fi-fo-fum! I spy with my eye… a young, aspiring author who wants to become better at writing stories.
                  Choose a language expert to review your story and help you take your writing to the next level.
                  They'll give you helpful tips and feedback to make your story even better.
                  And fear not — they're very nice people!
                </p>

                <label className="review-modal-label">Choose a language expert:</label>
                <div className="review-expert-input-wrap">
                  <input
                    className="review-expert-input"
                    placeholder="Start typing for suggestions!"
                    value={expertSearch}
                    onChange={e => handleExpertSearch(e.target.value)}
                  />
                  {expertSuggestions.length > 0 && (
                    <ul className="review-expert-dropdown">
                      {expertSuggestions.map(exp => (
                        <li key={exp.id} className="review-expert-item"
                          onClick={() => { setSelectedExpert(exp); setExpertSearch(exp.username); setExpertSuggestions([]); }}>
                          {exp.username}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {reviewError && <p className="review-error">{reviewError}</p>}

                <button className="review-submit-btn" onClick={handleReviewSubmit} disabled={reviewSubmitting}>
                  {reviewSubmitting ? "Submitting…" : "SUBMIT"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadStory;
