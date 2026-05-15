import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BsPencil, BsTrash, BsX, BsImageFill, BsXCircle, BsLock, BsUnlock } from "react-icons/bs";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "./UserProfile.css";
import "./ReadCategory.css";

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

const imgSrc = (path) => (path ? `${API}${path}` : null);
const listCoverSrc = (url) => (!url ? null : url.startsWith("http") ? url : `${API}${url}`);

const STATUS_DISPLAY = { published: "Complete", draft: "Ongoing" };

// ── Story card — matches ReadCategory.jsx structure exactly ───────────────────

const StoryCard = ({ story, isOwn, onEdit, onDelete, clickable = true, redDelete = false }) => {
  const navigate = useNavigate();
  return (
    <div
      className={`story-card${clickable ? "" : " story-card-static"}`}
      onClick={clickable ? () => navigate(`/read/story/${story.id}`) : undefined}
    >
      <div className="story-cover">
        {story.cover_image_url && (
          <img
            src={story.cover_image_url}
            alt={story.title}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        )}
      </div>
      <div className="story-info">
        <h3 className="story-title">{story.title}</h3>
        {(story.authors || []).length > 0 && (
          <p className="story-authors">by {story.authors.join(", ")}</p>
        )}
        {story.summary && <p className="story-summary">{story.summary}</p>}
        {(story.tags || []).length > 0 && (
          <div className="story-tags">
            {story.tags.map((tag) => (
              <span key={tag} className="story-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="story-meta">
          <span className="story-status">{STATUS_DISPLAY[story.status] || story.status}</span>
          <span>{story.chapter_count} chapter{story.chapter_count !== 1 ? "s" : ""}</span>
        </div>
        <div className="story-stats">
          {story.likes_count || 0} likes • {story.comment_count || 0} comments
        </div>
        {isOwn && (onEdit || onDelete) && (
          <div className="up-card-actions">
            {onEdit && (
              <button
                className="up-btn-sm up-btn-dark-sm"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
              >EDIT</button>
            )}
            {onDelete && (
              <button
                className={redDelete ? "up-rl-delete-btn" : "up-btn-sm up-btn-danger-sm"}
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >DELETE</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── User row (Following / Followers tabs) ────────────────────────────────────

const UserRow = ({ u, onAction, actionLabel }) => {
  const navigate = useNavigate();
  const avatar = listCoverSrc(u.avatar_url);
  const isExpert = u.account_type === "expert" || u.is_expert_verified;
  return (
    <div className="up-user-row">
      <div className="up-user-row-top" onClick={() => navigate(`/profile/${u.username}`)}>
        {avatar
          ? <img src={avatar} alt="avatar" className="up-user-avatar" />
          : <span className="up-user-initials">{u.username[0].toUpperCase()}</span>
        }
        <span className="up-user-name">{u.username}</span>
        {isExpert && <span className="up-expert-badge-sm">LANGUAGE EXPERT</span>}
      </div>
      {onAction && (
        <div className="up-user-row-action">
          <button className="up-user-action-btn" onClick={onAction}>{actionLabel}</button>
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const UserProfile = () => {
  const { username } = useParams();
  const navigate     = useNavigate();
  const { user, login } = useAuth();

  const isOwnProfile = user?.username?.toLowerCase() === username?.toLowerCase();

  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("about");
  const [tabData,      setTabData]      = useState({});
  const [tabLoaded,    setTabLoaded]    = useState({});

  // Edit profile
  const [editMode,     setEditMode]     = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio,      setEditBio]      = useState("");
  const [editError,    setEditError]    = useState("");
  const [saving,       setSaving]       = useState(false);

  // Logged-in user's following set (for button state on other profiles)
  const [myFollowingIds, setMyFollowingIds] = useState(new Set());

  // Reading list detail
  const [openList,     setOpenList]     = useState(null);

  // Delete confirmations
  const [deleteStory,  setDeleteStory]  = useState(null); // { id, isDraft }
  const [deleteListId, setDeleteListId] = useState(null);

  // Reading list edit mode
  const [listEditMode,   setListEditMode]   = useState(false);
  const [listEditName,   setListEditName]   = useState("");
  const [listEditPublic, setListEditPublic] = useState(true);

  const avatarInputRef = useRef(null);
  const headerInputRef = useRef(null);

  useEffect(() => {
    document.title = `${username} | Type-Away-Writer`;
  }, [username]);

  // Fetch profile on username change
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setTabData({});
    setTabLoaded({});
    setActiveTab("about");
    setOpenList(null);
    setMyFollowingIds(new Set());

    authFetch(`${API}/users/${username}`)
      .then((r) => r.json())
      .then((data) => {
        if (ignore) return;
        if (data.message) { navigate("/", { replace: true }); return; }
        setProfile(data);
        setLoading(false);
      })
      .catch(() => { if (!ignore) setLoading(false); });

    // Fetch the logged-in student's own following list for O(1) button-state lookups
    if (user && user.account_type === "student") {
      authFetch(`${API}/users/${user.username}/following`)
        .then((r) => r.json())
        .then((data) => {
          if (ignore || !Array.isArray(data)) return;
          setMyFollowingIds(new Set(data.map((u) => u.id)));
        })
        .catch(() => {});
    }

    return () => { ignore = true; };
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load tab data lazily
  const loadTab = useCallback(async (tab) => {
    if (tabLoaded[tab]) return;
    setTabLoaded((prev) => ({ ...prev, [tab]: true }));

    try {
      if (tab === "stories") {
        const r = await authFetch(`${API}/users/${username}/stories`);
        const d = await r.json();
        setTabData((prev) => ({ ...prev, stories: Array.isArray(d) ? d : [] }));
      } else if (tab === "collaborations") {
        const r = await authFetch(`${API}/users/${username}/collaborations`);
        const d = await r.json();
        setTabData((prev) => ({ ...prev, collaborations: Array.isArray(d) ? d : [] }));
      } else if (tab === "drafts") {
        const r = await authFetch(`${API}/users/${username}/drafts`);
        const d = await r.json();
        setTabData((prev) => ({ ...prev, drafts: Array.isArray(d) ? d : [] }));
      } else if (tab === "lists") {
        const r = await authFetch(`${API}/users/${username}/reading-lists`);
        const d = await r.json();
        setTabData((prev) => ({ ...prev, lists: Array.isArray(d) ? d : [] }));
      } else if (tab === "following") {
        const r = await authFetch(`${API}/users/${username}/following`);
        const d = await r.json();
        setTabData((prev) => ({ ...prev, following: Array.isArray(d) ? d : [] }));
      } else if (tab === "followers") {
        const r = await authFetch(`${API}/users/${username}/followers`);
        const d = await r.json();
        setTabData((prev) => ({ ...prev, followers: Array.isArray(d) ? d : [] }));
      }
    } catch { /* silent */ }
  }, [username, tabLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = (tab) => {
    setActiveTab(tab);
    setOpenList(null);
    loadTab(tab);
  };

  // Follow / Unfollow
  const handleFollow = async () => {
    if (!profile) return;
    const method = profile.is_following ? "DELETE" : "POST";
    await authFetch(`${API}/users/${username}/follow`, { method });
    setProfile((prev) => ({
      ...prev,
      is_following:    !prev.is_following,
      follower_count:  parseInt(prev.follower_count) + (prev.is_following ? -1 : 1),
    }));
  };

  // Edit profile
  const startEdit = () => {
    setEditUsername(profile.username);
    setEditBio(profile.bio || "");
    setEditError("");
    setEditMode(true);
  };

  const cancelEdit = () => setEditMode(false);

  const saveEdit = async () => {
    setSaving(true);
    setEditError("");
    try {
      const res  = await authFetch(`${API}/users/me`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: editUsername, bio: editBio }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.message || "Save failed."); return; }

      setProfile((prev) => ({ ...prev, username: data.username, bio: data.bio }));

      // Keep auth context in sync
      const token = localStorage.getItem("authToken");
      login(token, { ...user, username: data.username });

      setEditMode(false);
      if (data.username.toLowerCase() !== username.toLowerCase()) {
        navigate(`/profile/${data.username}`, { replace: true });
      }
    } catch { setEditError("Something went wrong."); }
    finally { setSaving(false); }
  };

  // Avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r1   = await authFetch(`${API}/upload/avatar`, { method: "POST", body: fd });
      const d1   = await r1.json();
      const r2   = await authFetch(`${API}/users/me/avatar`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ avatar_url: d1.url }),
      });
      const d2   = await r2.json();
      setProfile((prev) => ({ ...prev, avatar_url: d2.avatar_url }));
      const token = localStorage.getItem("authToken");
      login(token, { ...user, avatar_url: d2.avatar_url });
    } catch { /* silent */ }
  };

  // Header upload / remove
  const handleHeaderUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r1 = await authFetch(`${API}/upload/header`, { method: "POST", body: fd });
      const d1 = await r1.json();
      const r2 = await authFetch(`${API}/users/me/header`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ header_image_url: d1.url }),
      });
      const d2 = await r2.json();
      setProfile((prev) => ({ ...prev, header_image_url: d2.header_image_url }));
    } catch { /* silent */ }
  };

  const handleRemoveHeader = async () => {
    await authFetch(`${API}/users/me/header`, { method: "DELETE" });
    setProfile((prev) => ({ ...prev, header_image_url: null }));
  };

  // Story delete
  const handleDeleteStory = async () => {
    if (!deleteStory) return;
    const { id, isDraft, tabKey } = deleteStory;
    await authFetch(`${API}/stories/${id}`, { method: "DELETE" });
    const key = tabKey ?? (isDraft ? "drafts" : "stories");
    setTabData((prev) => ({ ...prev, [key]: (prev[key] || []).filter((s) => s.id !== id) }));
    setDeleteStory(null);
  };

  // Open reading list detail
  const openReadingList = async (listId) => {
    try {
      const r = await authFetch(`${API}/users/reading-lists/${listId}/stories`);
      const d = await r.json();
      setOpenList({ ...d.list, stories: d.stories || [] });
      setListEditMode(false);
    } catch { /* silent */ }
  };

  // Remove a story from the open list (edit mode — no confirmation)
  const removeFromList = async (storyId) => {
    await authFetch(`${API}/reading-lists/${openList.id}/stories/${storyId}`, { method: "DELETE" });
    setOpenList((prev) => ({ ...prev, stories: prev.stories.filter((s) => s.id !== storyId) }));
    setTabData((prev) => ({
      ...prev,
      lists: (prev.lists || []).map((l) =>
        l.id === openList.id
          ? { ...l, story_count: Math.max(0, parseInt(l.story_count) - 1) }
          : l
      ),
    }));
  };

  // Delete reading list
  const handleDeleteList = async () => {
    if (!deleteListId) return;
    await authFetch(`${API}/users/reading-lists/${deleteListId}`, { method: "DELETE" });
    setTabData((prev) => ({ ...prev, lists: (prev.lists || []).filter((l) => l.id !== deleteListId) }));
    if (openList?.id === deleteListId) { setOpenList(null); setListEditMode(false); }
    setDeleteListId(null);
  };

  // Reading list edit mode
  const startListEdit = () => {
    setListEditName(openList.title);
    setListEditPublic(openList.is_public);
    setListEditMode(true);
  };

  const cancelListEdit = () => setListEditMode(false);

  const handleSaveListEdit = async () => {
    try {
      const r = await authFetch(`${API}/users/reading-lists/${openList.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: listEditName.trim(), is_public: listEditPublic }),
      });
      const d = await r.json();
      setOpenList((prev) => ({ ...prev, title: d.title, is_public: d.is_public }));
      setTabData((prev) => ({
        ...prev,
        lists: (prev.lists || []).map((l) =>
          l.id === openList.id ? { ...l, title: d.title, is_public: d.is_public } : l
        ),
      }));
      setListEditMode(false);
    } catch { /* silent */ }
  };

  // Unfollow (from own Following tab)
  const handleUnfollow = async (targetUsername) => {
    await authFetch(`${API}/users/${targetUsername}/follow`, { method: "DELETE" });
    setTabData((prev) => ({
      ...prev,
      following: (prev.following || []).filter((u) => u.username !== targetUsername),
    }));
  };

  // Remove follower (from own Followers tab)
  const handleRemoveFollower = async (followerId) => {
    await authFetch(`${API}/users/${profile.username}/followers/${followerId}`, { method: "DELETE" });
    setTabData((prev) => ({
      ...prev,
      followers: (prev.followers || []).filter((u) => u.id !== followerId),
    }));
  };

  // Follow / Unfollow a person listed on another user's Following or Followers tab
  const handleFollowUser = async (targetUsername, targetId) => {
    await authFetch(`${API}/users/${targetUsername}/follow`, { method: "POST" });
    setMyFollowingIds((prev) => new Set([...prev, targetId]));
  };

  const handleUnfollowUser = async (targetUsername, targetId) => {
    await authFetch(`${API}/users/${targetUsername}/follow`, { method: "DELETE" });
    setMyFollowingIds((prev) => {
      const next = new Set(prev);
      next.delete(targetId);
      return next;
    });
  };

  if (loading) return (
    <div className="up-page"><Navbar /><p className="up-loading">Loading…</p><Footer /></div>
  );
  if (!profile) return null;

  const stories        = tabData.stories        || [];
  const collaborations = tabData.collaborations || [];
  const drafts         = tabData.drafts         || [];
  const lists          = tabData.lists          || [];
  const following      = tabData.following      || [];
  const followers      = tabData.followers      || [];

  const isExpertProfile = profile.account_type === "expert";
  const canFollow  = user && !isOwnProfile && user.account_type === "student";
  const heroBg     = imgSrc(profile.header_image_url);
  const avatarSrc  = imgSrc(profile.avatar_url);

  const TABS = isExpertProfile
    ? [
        { id: "about",     label: "About" },
        { id: "lists",     label: "Reading Lists" },
        { id: "followers", label: "Followers" },
      ]
    : [
        { id: "about",           label: "About" },
        { id: "stories",         label: "Stories" },
        ...(isOwnProfile ? [{ id: "collaborations", label: "Collaborations" }] : []),
        ...(isOwnProfile ? [{ id: "drafts",         label: "Drafts" }] : []),
        { id: "lists",           label: "Reading Lists" },
        { id: "following",       label: "Following" },
        { id: "followers",       label: "Followers" },
      ];

  return (
    <div className="up-page">
      <Navbar />

      {/* ── Hero ── */}
      <div className="up-hero">
        {heroBg && (
          <div className="up-hero-bg" style={{ backgroundImage: `url(${heroBg})` }} />
        )}
        {isOwnProfile && editMode && (
          <div className="up-hero-header-btns">
            <button className="up-header-icon-btn" onClick={() => headerInputRef.current?.click()} title="Change header image">
              <BsImageFill />
            </button>
            {profile.header_image_url && (
              <button className="up-header-icon-btn" onClick={handleRemoveHeader} title="Remove header image">
                <BsXCircle />
              </button>
            )}
            <input ref={headerInputRef} type="file" accept="image/*" hidden onChange={handleHeaderUpload} />
          </div>
        )}

        <div className="up-hero-inner">
          <div className="up-avatar-wrap">
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="up-avatar" />
              : <span className="up-avatar-initials">{profile.username[0].toUpperCase()}</span>
            }
            {isOwnProfile && editMode && (
              <>
                <button className="up-avatar-edit" onClick={() => avatarInputRef.current?.click()} title="Change photo">
                  <BsPencil />
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
              </>
            )}
          </div>

          <div className="up-hero-info">
            <div className="up-hero-name-row">
              <h1 className="up-username">{profile.username}</h1>
              {profile.is_expert_verified && <span className="up-expert-badge">Language Expert</span>}
            </div>
            {!isExpertProfile && (
              <p className="up-hero-stats">
                {profile.story_count} {parseInt(profile.story_count) === 1 ? "story" : "stories"}
              </p>
            )}
          </div>

          {canFollow && (
            <div className="up-hero-actions">
              <button
                className={`up-btn ${profile.is_following ? "up-btn-outline" : "up-btn-dark"}`}
                onClick={handleFollow}
              >
                {profile.is_following ? "UNFOLLOW" : "FOLLOW"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="up-tabs-bar">
        <div className="up-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`up-tab${activeTab === t.id ? " active" : ""}`}
              onClick={() => switchTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {isOwnProfile && (
          editMode ? (
            <div className="up-edit-bar-actions">
              <button className="up-btn up-btn-outline up-edit-profile-btn" onClick={cancelEdit} disabled={saving}>CANCEL</button>
              <button className="up-btn up-btn-dark up-edit-profile-btn" onClick={saveEdit} disabled={saving}>
                {saving ? "SAVING…" : "SAVE CHANGES"}
              </button>
            </div>
          ) : (
            <button className="up-btn up-btn-dark up-edit-profile-btn" onClick={startEdit}>
              EDIT PROFILE
            </button>
          )
        )}
      </div>

      {/* ── Tab content ── */}
      <div className="up-content">

        {/* About */}
        {activeTab === "about" && (
          <div className="up-about">
            {editMode ? (
              <div className="up-edit-form">
                <div className="up-edit-field">
                  <label className="up-edit-label">Username</label>
                  <input
                    className="up-edit-input"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div className="up-edit-field">
                  <label className="up-edit-label">
                    Bio <span className="up-char-count">{editBio.length}/500</span>
                  </label>
                  <textarea
                    className="up-edit-textarea"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={500}
                    rows={5}
                    placeholder="Tell readers about yourself…"
                  />
                </div>
                {editError && <p className="up-edit-error">{editError}</p>}
              </div>
            ) : (
              <div className="up-bio-block">
                {profile.bio && <p className="up-bio">{profile.bio}</p>}
                <p className="up-joined">
                  <strong>Joined</strong>{" "}
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stories */}
        {activeTab === "stories" && (
          <div className="up-story-grid">
            {stories.length === 0 ? (
              <p className="up-empty">No published stories yet.</p>
            ) : stories.map((s) => (
              <StoryCard
                key={s.id}
                story={s}
                isOwn={isOwnProfile}
                onEdit={() => navigate(`/write/${s.id}/settings`)}
                onDelete={() => setDeleteStory({ id: s.id, isDraft: false })}
              />
            ))}
          </div>
        )}

        {/* Collaborations */}
        {activeTab === "collaborations" && (
          <div className="up-story-grid">
            {collaborations.length === 0 ? (
              <p className="up-empty">No collaborations yet.</p>
            ) : collaborations.map((s) => (
              <StoryCard
                key={s.id}
                story={s}
                isOwn={true}
                clickable={false}
                onEdit={() => navigate(`/write/${s.id}/chapters`)}
                onDelete={user?.id === s.author_id
                  ? () => setDeleteStory({ id: s.id, tabKey: "collaborations" })
                  : undefined}
              />
            ))}
          </div>
        )}

        {/* Drafts */}
        {activeTab === "drafts" && (
          <div className="up-story-grid">
            {drafts.length === 0 ? (
              <p className="up-empty">No drafts yet.</p>
            ) : drafts.map((s) => (
              <StoryCard
                key={s.id}
                story={s}
                isOwn={true}
                clickable={false}
                onEdit={() => navigate(`/write/${s.id}/settings`)}
                onDelete={() => setDeleteStory({ id: s.id, isDraft: true })}
              />
            ))}
          </div>
        )}

        {/* Reading Lists */}
        {activeTab === "lists" && (
          openList ? (
            /* ── Detail view ── */
            <div>
              <button className="up-back-btn" onClick={() => { setOpenList(null); setListEditMode(false); }}>
                ← Back to lists
              </button>

              <h2 className="up-list-detail-heading">
                {listEditMode ? (listEditName || openList.title) : openList.title}
              </h2>

              <div className="up-list-detail-meta-row">
                <p className="up-list-detail-meta">
                  {(listEditMode ? listEditPublic : openList.is_public)
                    ? <BsUnlock className="up-lock-icon" />
                    : <BsLock className="up-lock-icon" />}
                  {(listEditMode ? listEditPublic : openList.is_public) ? "Public" : "Private"}
                  {" · "}
                  {openList.stories.length} {openList.stories.length === 1 ? "Story" : "Stories"}
                </p>
                {isOwnProfile && (
                  listEditMode ? (
                    <div className="up-card-actions">
                      <button className="up-btn-sm up-btn-dark-sm" onClick={handleSaveListEdit}>SAVE CHANGES</button>
                      <button className="up-btn-sm up-btn-outline-sm" onClick={cancelListEdit}>CANCEL</button>
                    </div>
                  ) : (
                    <div className="up-card-actions">
                      <button className="up-btn-sm up-btn-dark-sm" onClick={startListEdit}>EDIT</button>
                      <button className="up-rl-delete-btn" onClick={() => setDeleteListId(openList.id)}>DELETE</button>
                    </div>
                  )
                )}
              </div>

              {listEditMode && (
                <div className="up-list-edit-form">
                  <div className="up-list-edit-field">
                    <label className="up-list-edit-label">List Name:</label>
                    <input
                      className="up-list-edit-input"
                      value={listEditName}
                      onChange={(e) => setListEditName(e.target.value)}
                    />
                  </div>
                  <div className="up-list-edit-field">
                    <label className="up-list-edit-label">Visibility:</label>
                    <select
                      className="up-list-edit-select"
                      value={listEditPublic ? "public" : "private"}
                      onChange={(e) => setListEditPublic(e.target.value === "public")}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
              )}

              {openList.stories.length === 0 ? (
                <p className="up-empty">No stories saved here yet.</p>
              ) : (
                <div className="up-story-grid">
                  {openList.stories.map((s) => (
                    <StoryCard
                      key={s.id}
                      story={{ ...s, cover_image_url: listCoverSrc(s.cover_image_url) }}
                      isOwn={listEditMode}
                      onDelete={listEditMode ? () => removeFromList(s.id) : undefined}
                      redDelete={true}
                      clickable={!listEditMode}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── List view ── */
            <div className="up-story-grid">
              {lists.length === 0 ? (
                <p className="up-empty">No reading lists yet.</p>
              ) : lists.map((list) => (
                <div key={list.id} className="story-card story-card-static">
                  <div className="story-cover">
                    {list.cover_image_url ? (
                      <img
                        src={listCoverSrc(list.cover_image_url)}
                        alt={list.title}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div className="up-list-cover-placeholder" />
                    )}
                  </div>
                  <div className="story-info">
                    <h3 className="story-title">{list.title}</h3>
                    <p className="story-authors">
                      {list.is_public
                        ? <BsUnlock className="up-lock-icon" />
                        : <BsLock className="up-lock-icon" />}
                      {list.is_public ? "Public" : "Private"}
                      {" · "}
                      {list.story_count} {parseInt(list.story_count) === 1 ? "story" : "stories"}
                    </p>
                    <div className="up-card-actions">
                      <button
                        className="up-btn-sm up-btn-dark-sm"
                        onClick={() => openReadingList(list.id)}
                      >VIEW READING LIST</button>
                      {isOwnProfile && (
                        <button
                          className="up-rl-delete-btn"
                          onClick={(e) => { e.stopPropagation(); setDeleteListId(list.id); }}
                        >DELETE</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Following */}
        {activeTab === "following" && (
          <div className="up-user-list">
            {following.length === 0 ? (
              <p className="up-empty">Not following anyone yet.</p>
            ) : (
              <>
                <p className="up-user-list-header">{following.length} Following</p>
                {following.map((u) => {
                  let onAction = null;
                  let actionLabel = "";
                  if (isOwnProfile) {
                    onAction = () => handleUnfollow(u.username);
                    actionLabel = "UNFOLLOW";
                  } else if (user && user.account_type === "student" &&
                             u.username?.toLowerCase() !== user.username?.toLowerCase()) {
                    if (myFollowingIds.has(u.id)) {
                      onAction = () => handleUnfollowUser(u.username, u.id);
                      actionLabel = "UNFOLLOW";
                    } else {
                      onAction = () => handleFollowUser(u.username, u.id);
                      actionLabel = "FOLLOW";
                    }
                  }
                  return (
                    <UserRow key={u.id} u={u} onAction={onAction} actionLabel={actionLabel} />
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Followers */}
        {activeTab === "followers" && (
          <div className="up-user-list">
            {followers.length === 0 ? (
              <p className="up-empty">No followers yet.</p>
            ) : (
              <>
                <p className="up-user-list-header">{followers.length} Followers</p>
                {followers.map((u) => {
                  let onAction = null;
                  let actionLabel = "";
                  if (isOwnProfile) {
                    onAction = () => handleRemoveFollower(u.id);
                    actionLabel = "REMOVE FOLLOWER";
                  } else if (user && user.account_type === "student" &&
                             u.username?.toLowerCase() !== user.username?.toLowerCase()) {
                    if (myFollowingIds.has(u.id)) {
                      onAction = () => handleUnfollowUser(u.username, u.id);
                      actionLabel = "UNFOLLOW";
                    } else {
                      onAction = () => handleFollowUser(u.username, u.id);
                      actionLabel = "FOLLOW";
                    }
                  }
                  return (
                    <UserRow key={u.id} u={u} onAction={onAction} actionLabel={actionLabel} />
                  );
                })}
              </>
            )}
          </div>
        )}

      </div>

      {/* ── Delete story confirm ── */}
      {deleteStory && (
        <div className="up-del-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteStory(null); }}>
          <div className="up-del-modal">
            <button className="up-del-modal-close" onClick={() => setDeleteStory(null)}>×</button>
            <h2 className="up-del-modal-title">Delete Your Story</h2>
            <p className="up-del-modal-body">Are you sure you want to delete this story? 😢</p>
            <div className="up-del-modal-footer">
              <button className="up-del-confirm-btn" onClick={handleDeleteStory}>YES</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete list confirm ── */}
      {deleteListId && (
        <div className="up-del-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteListId(null); }}>
          <div className="up-del-modal">
            <button className="up-del-modal-close" onClick={() => setDeleteListId(null)}>×</button>
            <h2 className="up-del-modal-title">Delete Reading List</h2>
            <p className="up-del-modal-body">Are you sure you want to delete this reading list? 😢</p>
            <div className="up-del-modal-footer">
              <button className="up-del-confirm-btn" onClick={handleDeleteList}>YES</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserProfile;
