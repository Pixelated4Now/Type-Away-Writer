import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BsPencil, BsTrash, BsX } from "react-icons/bs";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "./UserProfile.css";

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

// ── Story card (reuses ReadCategory story-card CSS classes) ───────────────────

const StoryCard = ({ story, isOwn, isDraft, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const cover = imgSrc(story.cover_image_url);
  return (
    <div className="story-card">
      <div
        className="story-cover"
        style={cover ? { backgroundImage: `url(${cover})` } : {}}
        onClick={() => !isDraft && navigate(`/read/story/${story.id}`)}
      />
      <div className="story-info">
        <p
          className="story-title"
          onClick={() => !isDraft && navigate(`/read/story/${story.id}`)}
          style={{ cursor: isDraft ? "default" : "pointer" }}
        >
          {story.title}
        </p>
        {(story.authors || []).length > 0 && (
          <p className="story-authors">{story.authors.join(", ")}</p>
        )}
        {story.summary && <p className="story-summary">{story.summary}</p>}
        {(story.tags || []).length > 0 && (
          <div className="story-tags">
            {story.tags.map((tag) => (
              <span key={tag} className="story-tag">{tag}</span>
            ))}
          </div>
        )}
        {!isDraft && (
          <div className="story-meta">
            <span className="story-stats">♥ {story.likes_count || 0}</span>
            <span className="story-stats">{story.chapter_count || 0} ch</span>
            <span className="story-stats">{story.comment_count || 0} comments</span>
          </div>
        )}
        {isOwn && (
          <div className="up-card-actions">
            <button className="up-btn-sm up-btn-outline-sm" onClick={onEdit}>Edit</button>
            <button className="up-btn-sm up-btn-danger-sm" onClick={onDelete}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── User row (Following / Followers tabs) ────────────────────────────────────

const UserRow = ({ u, onAction, actionLabel }) => {
  const navigate = useNavigate();
  const avatar = imgSrc(u.avatar_url);
  return (
    <div className="up-user-row">
      <div className="up-user-row-left" onClick={() => navigate(`/profile/${u.username}`)}>
        {avatar
          ? <img src={avatar} alt="avatar" className="up-user-avatar" />
          : <span className="up-user-initials">{u.username[0].toUpperCase()}</span>
        }
        <span className="up-user-name">{u.username}</span>
        {u.is_expert_verified && <span className="up-expert-badge-sm">Expert</span>}
      </div>
      {onAction && (
        <button className="up-btn-sm up-btn-outline-sm" onClick={onAction}>{actionLabel}</button>
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

  // Reading list detail
  const [openList,     setOpenList]     = useState(null);

  // Delete confirmations
  const [deleteStory,  setDeleteStory]  = useState(null); // { id, isDraft }
  const [deleteListId, setDeleteListId] = useState(null);

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

    authFetch(`${API}/users/${username}`)
      .then((r) => r.json())
      .then((data) => {
        if (ignore) return;
        if (data.message) { navigate("/", { replace: true }); return; }
        setProfile(data);
        setLoading(false);
      })
      .catch(() => { if (!ignore) setLoading(false); });

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

  // Header upload
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
    const { id, isDraft } = deleteStory;
    await authFetch(`${API}/stories/${id}`, { method: "DELETE" });
    const key = isDraft ? "drafts" : "stories";
    setTabData((prev) => ({ ...prev, [key]: (prev[key] || []).filter((s) => s.id !== id) }));
    setDeleteStory(null);
  };

  // Open reading list detail
  const openReadingList = async (listId) => {
    try {
      const r = await authFetch(`${API}/users/reading-lists/${listId}/stories`);
      const d = await r.json();
      setOpenList({ ...d.list, stories: d.stories || [] });
    } catch { /* silent */ }
  };

  // Remove story from list
  const removeFromList = async (storyId) => {
    await authFetch(`${API}/reading-lists/${openList.id}/stories/${storyId}`, { method: "DELETE" });
    setOpenList((prev) => ({ ...prev, stories: prev.stories.filter((s) => s.id !== storyId) }));
  };

  // Delete reading list
  const handleDeleteList = async () => {
    if (!deleteListId) return;
    await authFetch(`${API}/users/reading-lists/${deleteListId}`, { method: "DELETE" });
    setTabData((prev) => ({ ...prev, lists: (prev.lists || []).filter((l) => l.id !== deleteListId) }));
    if (openList?.id === deleteListId) setOpenList(null);
    setDeleteListId(null);
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

  if (loading) return (
    <div className="up-page"><Navbar /><p className="up-loading">Loading…</p><Footer /></div>
  );
  if (!profile) return null;

  const stories   = tabData.stories   || [];
  const drafts    = tabData.drafts    || [];
  const lists     = tabData.lists     || [];
  const following = tabData.following || [];
  const followers = tabData.followers || [];

  const canFollow  = user && !isOwnProfile && user.account_type === "student";
  const heroBg     = imgSrc(profile.header_image_url);
  const avatarSrc  = imgSrc(profile.avatar_url);

  const TABS = [
    { id: "about",     label: "About" },
    { id: "stories",   label: "Stories" },
    ...(isOwnProfile ? [{ id: "drafts", label: "Drafts" }] : []),
    { id: "lists",     label: "Reading Lists" },
    { id: "following", label: "Following" },
    { id: "followers", label: "Followers" },
  ];

  return (
    <div className="up-page">
      <Navbar />

      {/* ── Hero ── */}
      <div
        className="up-hero"
        style={heroBg ? { backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        {isOwnProfile && (
          <div className="up-hero-top-btns">
            <button className="up-hero-img-btn" onClick={() => headerInputRef.current?.click()}>
              <BsPencil /> Change header
            </button>
            {profile.header_image_url && (
              <button className="up-hero-img-btn up-hero-img-btn-danger" onClick={handleRemoveHeader}>
                <BsX /> Remove header
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
            {isOwnProfile && (
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
              {profile.is_expert_verified && <span className="up-expert-badge">Expert</span>}
            </div>
            <p className="up-hero-stats">
              {profile.story_count} {parseInt(profile.story_count) === 1 ? "story" : "stories"} ·{" "}
              {profile.follower_count} {parseInt(profile.follower_count) === 1 ? "follower" : "followers"} ·{" "}
              {profile.following_count} following
            </p>
          </div>

          <div className="up-hero-actions">
            {isOwnProfile && (
              <button className="up-btn up-btn-outline" onClick={startEdit}>Edit Profile</button>
            )}
            {canFollow && (
              <button
                className={`up-btn ${profile.is_following ? "up-btn-outline" : "up-btn-dark"}`}
                onClick={handleFollow}
              >
                {profile.is_following ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
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
                <div className="up-edit-actions">
                  <button className="up-btn up-btn-outline" onClick={cancelEdit} disabled={saving}>Cancel</button>
                  <button className="up-btn up-btn-dark"    onClick={saveEdit}   disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="up-bio">
                {profile.bio || (isOwnProfile
                  ? "You haven't added a bio yet. Click Edit Profile to add one."
                  : "No bio yet."
                )}
              </p>
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
                isDraft={false}
                onEdit={() => navigate(`/write/${s.id}/settings`)}
                onDelete={() => setDeleteStory({ id: s.id, isDraft: false })}
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
                isDraft={true}
                onEdit={() => navigate(`/write/${s.id}/settings`)}
                onDelete={() => setDeleteStory({ id: s.id, isDraft: true })}
              />
            ))}
          </div>
        )}

        {/* Reading Lists */}
        {activeTab === "lists" && (
          openList ? (
            <div className="up-list-detail">
              <button className="up-back-btn" onClick={() => setOpenList(null)}>← Back to lists</button>
              <h3 className="up-list-detail-title">{openList.title}</h3>
              {openList.stories.length === 0 ? (
                <p className="up-empty">This list is empty.</p>
              ) : openList.stories.map((s) => {
                const cover = imgSrc(s.cover_image_url);
                return (
                  <div key={s.id} className="up-list-story-row">
                    <div className="up-list-story-left" onClick={() => navigate(`/read/story/${s.id}`)}>
                      {cover && <img src={cover} alt="" className="up-list-story-cover" />}
                      <div>
                        <p className="up-list-story-title">{s.title}</p>
                        <p className="up-list-story-authors">{(s.authors || []).join(", ")}</p>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <button className="up-remove-btn" onClick={() => removeFromList(s.id)} title="Remove">
                        <BsX />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              {lists.length === 0 ? (
                <p className="up-empty">No reading lists yet.</p>
              ) : lists.map((list) => (
                <div key={list.id} className="up-list-row">
                  <div className="up-list-row-info" onClick={() => openReadingList(list.id)}>
                    <span className="up-list-name">{list.title}</span>
                    <span className="up-list-meta">
                      {list.story_count} {parseInt(list.story_count) === 1 ? "story" : "stories"} ·{" "}
                      {list.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                  {isOwnProfile && (
                    <button
                      className="up-remove-btn"
                      onClick={(e) => { e.stopPropagation(); setDeleteListId(list.id); }}
                      title="Delete list"
                    >
                      <BsTrash />
                    </button>
                  )}
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
            ) : following.map((u) => (
              <UserRow
                key={u.id}
                u={u}
                onAction={isOwnProfile ? () => handleUnfollow(u.username) : null}
                actionLabel="Unfollow"
              />
            ))}
          </div>
        )}

        {/* Followers */}
        {activeTab === "followers" && (
          <div className="up-user-list">
            {followers.length === 0 ? (
              <p className="up-empty">No followers yet.</p>
            ) : followers.map((u) => (
              <UserRow
                key={u.id}
                u={u}
                onAction={isOwnProfile ? () => handleRemoveFollower(u.id) : null}
                actionLabel="Remove"
              />
            ))}
          </div>
        )}

      </div>

      {/* ── Delete story confirm ── */}
      {deleteStory && (
        <div className="up-overlay">
          <div className="up-popup">
            <p className="up-popup-text">
              Delete this {deleteStory.isDraft ? "draft" : "story"}? This cannot be undone.
            </p>
            <div className="up-popup-actions">
              <button className="up-btn up-btn-outline" onClick={() => setDeleteStory(null)}>Cancel</button>
              <button className="up-btn up-btn-danger" onClick={handleDeleteStory}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete list confirm ── */}
      {deleteListId && (
        <div className="up-overlay">
          <div className="up-popup">
            <p className="up-popup-text">
              Delete this reading list? This cannot be undone.
            </p>
            <div className="up-popup-actions">
              <button className="up-btn up-btn-outline" onClick={() => setDeleteListId(null)}>Cancel</button>
              <button className="up-btn up-btn-danger" onClick={handleDeleteList}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserProfile;
