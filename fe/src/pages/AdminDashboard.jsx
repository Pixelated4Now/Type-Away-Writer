import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const authFetch = (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const actionBtn = (bg) => ({
  background: bg, color: '#fff', border: 'none', borderRadius: 6,
  padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginRight: 6,
});

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

// ── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ label, value, bg }) => (
  <div style={{ background: bg, color: '#fff', borderRadius: 12, padding: 24, flex: 1, minWidth: 160 }}>
    <div style={{ fontSize: 36, fontWeight: 700 }}>{value}</div>
    <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{label}</div>
  </div>
);

const STATUS_STYLES = {
  Active:          { background: '#e8f5e9', color: '#2e7d32' },
  Suspended:       { background: '#ffebee', color: '#c62828' },
  Published:       { background: '#e8f5e9', color: '#2e7d32' },
  'Under Review':  { background: '#fff8e1', color: '#f57f17' },
};

const StatusBadge = ({ status }) => (
  <span style={{
    ...(STATUS_STYLES[status] || {}),
    fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block',
  }}>{status}</span>
);

const AdminTable = ({ columns, rows }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{
      width: '100%', borderCollapse: 'collapse', background: '#fff',
      borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} style={{
              background: '#0d2d5e', color: '#fff', fontSize: 13, fontWeight: 600,
              padding: '12px 16px', textAlign: 'left',
            }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ fontSize: 13, color: '#333', padding: '12px 16px' }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <div style={{ fontSize: 20, fontWeight: 700, color: '#0d2d5e', marginBottom: 20 }}>{title}</div>
    {children}
  </div>
);

const addBtnStyle = {
  background: '#0d2d5e', color: '#fff', border: 'none', borderRadius: 8,
  padding: '8px 20px', fontSize: 14, cursor: 'pointer', marginTop: 16, display: 'inline-block',
};

const PIE_COLORS   = ['#0d2d5e', '#3b4270', '#8fa8cf', '#5c6bc0', '#42a5f5', '#26c6da'];
const COLAB_COLORS = ['#0d2d5e', '#8fa8cf'];

// ── Main component ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');

  // Dashboard stats
  const [stats,       setStats]       = useState({ total_users: 0, total_students: 0, total_experts: 0, total_stories: 0 });
  const [barData,     setBarData]     = useState([]);
  const [catPieData,  setCatPieData]  = useState([]);
  const [colabPieData,setColabPieData]= useState([]);

  // Section data (null = not yet loaded)
  const [students,   setStudents]   = useState(null);
  const [experts,    setExperts]    = useState(null);
  const [stories,    setStories]    = useState(null);
  const [tags,       setTags]       = useState(null);
  const [categories, setCategories] = useState(null);
  const [admins,     setAdmins]     = useState(null);

  // Story delete confirm
  const [deleteStoryId, setDeleteStoryId] = useState(null);

  // Tag UI
  const [tagSearch,  setTagSearch]  = useState('');
  const [addingTag,  setAddingTag]  = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Category UI
  const [editCatId,   setEditCatId]   = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [addingCat,   setAddingCat]   = useState(false);
  const [newCatName,  setNewCatName]  = useState('');

  // Loaded flags
  const [loaded, setLoaded] = useState({});
  const mark = (s) => setLoaded((p) => ({ ...p, [s]: true }));

  // ── Fetchers ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loaded.dashboard) return;
    mark('dashboard');
    Promise.all([
      authFetch(`${API}/admin/stats`).then((r) => r.json()),
      authFetch(`${API}/admin/stats/stories-over-time`).then((r) => r.json()),
      authFetch(`${API}/admin/stats/stories-by-category`).then((r) => r.json()),
      authFetch(`${API}/admin/stats/collaboration`).then((r) => r.json()),
    ]).then(([s, bar, cat, colab]) => {
      setStats(s);
      setBarData(Array.isArray(bar) ? bar : []);
      setCatPieData(Array.isArray(cat) ? cat : []);
      setColabPieData([
        { name: 'Individual',   value: colab?.individual   || 0 },
        { name: 'Collaborated', value: colab?.collaborated || 0 },
      ]);
    }).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetch1 = (url, setter) =>
      authFetch(url).then((r) => r.json()).then((d) => setter(Array.isArray(d) ? d : [])).catch(console.error);

    if (activeSection === 'students'   && !loaded.students)   { mark('students');   fetch1(`${API}/admin/users?type=student`, setStudents); }
    if (activeSection === 'experts'    && !loaded.experts)    { mark('experts');    fetch1(`${API}/admin/users?type=expert`,  setExperts); }
    if (activeSection === 'content'    && !loaded.content)    { mark('content');    fetch1(`${API}/admin/stories`,            setStories); }
    if (activeSection === 'tags'       && !loaded.tags)       { mark('tags');       fetch1(`${API}/admin/tags`,               setTags); }
    if (activeSection === 'categories' && !loaded.categories) { mark('categories'); fetch1(`${API}/admin/categories`,         setCategories); }
    if (activeSection === 'admins'     && !loaded.admins)     { mark('admins');     fetch1(`${API}/admin/admins`,             setAdmins); }
  }, [activeSection]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleLogout = () => { localStorage.removeItem('authToken'); navigate('/login'); };

  const handleSuspend = async (userId, type) => {
    const res  = await authFetch(`${API}/admin/users/${userId}/suspend`, { method: 'PATCH' });
    const data = await res.json();
    const setter = type === 'student' ? setStudents : setExperts;
    setter((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: data.is_active } : u));
  };

  const handleDeleteStory = async () => {
    await authFetch(`${API}/admin/stories/${deleteStoryId}`, { method: 'DELETE' });
    setStories((prev) => prev.filter((s) => s.id !== deleteStoryId));
    setDeleteStoryId(null);
  };

  const handleDeleteTag = async (id) => {
    await authFetch(`${API}/admin/tags/${id}`, { method: 'DELETE' });
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    const res  = await authFetch(`${API}/admin/tags`, { method: 'POST', body: JSON.stringify({ name: newTagName.trim() }) });
    const data = await res.json();
    if (data?.id) setTags((prev) => prev.find((t) => t.id === data.id) ? prev : [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewTagName(''); setAddingTag(false);
  };

  const handleSaveCategoryEdit = async (id) => {
    const res  = await authFetch(`${API}/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name: editCatName.trim() }) });
    const data = await res.json();
    if (data?.id) setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name: data.name } : c));
    setEditCatId(null);
  };

  const handleDeleteCategory = async (id) => {
    await authFetch(`${API}/admin/categories/${id}`, { method: 'DELETE' });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const res  = await authFetch(`${API}/admin/categories`, { method: 'POST', body: JSON.stringify({ name: newCatName.trim() }) });
    const data = await res.json();
    if (data?.id) setCategories((prev) => [...prev, { ...data, story_count: 0 }]);
    setNewCatName(''); setAddingCat(false);
  };

  // ── Row builders ─────────────────────────────────────────────────────────────

  const studentRows = (students || []).map((u) => [
    u.id, u.username, u.email, fmtDate(u.created_at), u.story_count,
    <StatusBadge key={u.id} status={u.is_active ? 'Active' : 'Suspended'} />,
    <span key={u.id}>
      <button style={actionBtn('#0d2d5e')}>View</button>
      <button style={actionBtn(u.is_active ? '#c62828' : '#2e7d32')} onClick={() => handleSuspend(u.id, 'student')}>
        {u.is_active ? 'Suspend' : 'Unsuspend'}
      </button>
    </span>,
  ]);

  const expertRows = (experts || []).map((u) => [
    u.id, u.username, u.email, fmtDate(u.created_at), u.review_count,
    <StatusBadge key={u.id} status={u.is_active ? 'Active' : 'Suspended'} />,
    <span key={u.id}>
      <button style={actionBtn('#0d2d5e')}>View</button>
      <button style={actionBtn(u.is_active ? '#c62828' : '#2e7d32')} onClick={() => handleSuspend(u.id, 'expert')}>
        {u.is_active ? 'Suspend' : 'Unsuspend'}
      </button>
    </span>,
  ]);

  const storyRows = (stories || []).map((s) => [
    s.id, s.title, s.author, s.category || '—',
    <StatusBadge key={s.id} status="Published" />,
    <span key={s.id}>
      <button style={actionBtn('#0d2d5e')} onClick={() => navigate(`/read/story/${s.id}`)}>View</button>
      <button style={actionBtn('#c62828')} onClick={() => setDeleteStoryId(s.id)}>Remove</button>
    </span>,
  ]);

  const categoryRows = [
    ...(categories || []).map((c) => [
      c.id,
      editCatId === c.id
        ? <input
            key={`edit-${c.id}`}
            value={editCatName}
            onChange={(e) => setEditCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveCategoryEdit(c.id)}
            autoFocus
            style={{ border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', fontSize: 13, width: '90%' }}
          />
        : c.name,
      c.story_count,
      <span key={c.id}>
        {editCatId === c.id ? (
          <>
            <button style={actionBtn('#2e7d32')} onClick={() => handleSaveCategoryEdit(c.id)}>Save</button>
            <button style={actionBtn('#888')}     onClick={() => setEditCatId(null)}>Cancel</button>
          </>
        ) : (
          <>
            <button style={actionBtn('#0d2d5e')} onClick={() => { setEditCatId(c.id); setEditCatName(c.name); }}>Edit</button>
            <button style={actionBtn('#c62828')} onClick={() => handleDeleteCategory(c.id)}>Delete</button>
          </>
        )}
      </span>,
    ]),
    ...(addingCat ? [[
      '—',
      <input
        key="new-cat"
        value={newCatName}
        onChange={(e) => setNewCatName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
        placeholder="Category name…"
        autoFocus
        style={{ border: '1px solid #ddd', borderRadius: 4, padding: '4px 8px', fontSize: 13, width: '90%' }}
      />,
      '—',
      <span key="new-cat-actions">
        <button style={actionBtn('#2e7d32')} onClick={handleAddCategory}>Save</button>
        <button style={actionBtn('#888')} onClick={() => { setAddingCat(false); setNewCatName(''); }}>Cancel</button>
      </span>,
    ]] : []),
  ];

  const adminRows = (admins || []).map((a) => [
    a.id, a.username, a.email, 'Admin', fmtDate(a.created_at),
    <span key={a.id}>
      <button style={actionBtn('#0d2d5e')}>Edit</button>
      <button style={actionBtn('#c62828')}>Remove</button>
    </span>,
  ]);

  const filteredTags = (tags || []).filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  // ── Nav ──────────────────────────────────────────────────────────────────────

  const navItems = [
    { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
    { id: 'students',   label: 'Students',   icon: '🎓' },
    { id: 'experts',    label: 'Experts',    icon: '🏅' },
    { id: 'content',    label: 'Content',    icon: '📖' },
    { id: 'tags',       label: 'Tags',       icon: '🏷️' },
    { id: 'categories', label: 'Categories', icon: '📂' },
    { id: 'admins',     label: 'Admins',     icon: '🔑' },
  ];

  const navStyle = (id) => ({
    padding: '10px 24px', cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', gap: 10,
    ...(activeSection === id
      ? { background: '#eef3fb', color: '#0d2d5e', fontWeight: 600 }
      : { color: 'rgba(255,255,255,0.8)' }),
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: '#f4f6fb', fontFamily: 'sans-serif', minHeight: '100vh' }}>

      {/* Sidebar — fixed so it never participates in page scroll */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: 240, height: '100vh',
        background: '#0d2d5e', color: '#fff',
        padding: '24px 0', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', overflowY: 'auto', zIndex: 100,
      }}>
        <div>
          <div style={{ padding: '0 24px', marginBottom: 32, fontWeight: 700, fontSize: 18 }}>
            ✏️ TypeAway.
          </div>
          {navItems.map((item) => (
            <div
              key={item.id}
              style={navStyle(item.id)}
              onClick={() => setActiveSection(item.id)}
              onMouseEnter={(e) => { if (activeSection !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { if (activeSection !== item.id) e.currentTarget.style.background = ''; }}
            >
              <span>{item.icon}</span><span>{item.label}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', margin: '16px 0' }} />
          <div
            style={{ padding: '10px 24px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.8)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
          >
            <span>👤</span><span>Profile</span>
          </div>
          <div
            style={{ padding: '10px 24px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.8)' }}
            onClick={handleLogout}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
          >
            <span>🚪</span><span>Logout</span>
          </div>
        </div>
      </div>

      {/* Main — offset by sidebar width */}
      <div style={{ marginLeft: 240, padding: 32, minHeight: '100vh' }}>

        {/* ── Dashboard ── */}
        {activeSection === 'dashboard' && (
          <Section title="Dashboard">
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
              <StatCard label="Total Users"            value={stats.total_users}    bg="#3b4270" />
              <StatCard label="Total Students"         value={stats.total_students} bg="#1a2340" />
              <StatCard label="Total Language Experts" value={stats.total_experts}  bg="#8fa8cf" />
              <StatCard label="Total Stories"          value={stats.total_stories}  bg="#3b4270" />
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: 300, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0d2d5e', marginBottom: 16 }}>Stories Over Time</div>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0d2d5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>Loading chart…</div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0d2d5e', marginBottom: 8 }}>Stories by Category</div>
                  {catPieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={catPieData} dataKey="value" cx="50%" cy="50%" outerRadius={60}>
                          {catPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>Loading chart…</div>
                  )}
                </div>
                <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0d2d5e', marginBottom: 8 }}>Individual vs Collaborated</div>
                  {colabPieData.some((d) => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={colabPieData} dataKey="value" cx="50%" cy="50%" outerRadius={60}>
                          {colabPieData.map((_, i) => <Cell key={i} fill={COLAB_COLORS[i % COLAB_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 13 }}>Loading chart…</div>
                  )}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ── Students ── */}
        {activeSection === 'students' && (
          <Section title="Students">
            {students === null
              ? <p style={{ color: '#666' }}>Loading…</p>
              : <AdminTable
                  columns={['User ID', 'Username', 'Email Address', 'Date Joined', 'Stories', 'Status', 'Actions']}
                  rows={studentRows}
                />
            }
          </Section>
        )}

        {/* ── Experts ── */}
        {activeSection === 'experts' && (
          <Section title="Experts">
            {experts === null
              ? <p style={{ color: '#666' }}>Loading…</p>
              : <AdminTable
                  columns={['User ID', 'Username', 'Email Address', 'Date Joined', 'Reviews', 'Status', 'Actions']}
                  rows={expertRows}
                />
            }
          </Section>
        )}

        {/* ── Content ── */}
        {activeSection === 'content' && (
          <Section title="Content">
            {stories === null
              ? <p style={{ color: '#666' }}>Loading…</p>
              : <AdminTable
                  columns={['Story ID', 'Title', 'Author', 'Category', 'Status', 'Actions']}
                  rows={storyRows}
                />
            }
          </Section>
        )}

        {/* ── Tags ── */}
        {activeSection === 'tags' && (
          <Section title="Tags">
            <input
              type="text"
              placeholder="Search tags…"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              style={{
                width: '100%', border: '1px solid #ddd', borderRadius: 8,
                padding: '8px 12px', fontSize: 14, marginBottom: 16,
                boxSizing: 'border-box', outline: 'none',
              }}
            />
            {tags === null
              ? <p style={{ color: '#666' }}>Loading…</p>
              : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {filteredTags.map((tag) => (
                      <span key={tag.id} style={{
                        background: '#0d2d5e', color: '#fff', borderRadius: 20,
                        padding: '4px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        {tag.name}
                        <button
                          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}
                          onClick={() => handleDeleteTag(tag.id)}
                        >×</button>
                      </span>
                    ))}
                  </div>
                  {addingTag ? (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="New tag name…"
                        autoFocus
                        style={{ border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}
                      />
                      <button style={actionBtn('#0d2d5e')} onClick={handleAddTag}>Add</button>
                      <button style={actionBtn('#888')} onClick={() => { setAddingTag(false); setNewTagName(''); }}>Cancel</button>
                    </div>
                  ) : (
                    <button style={addBtnStyle} onClick={() => setAddingTag(true)}>+ Add Tag</button>
                  )}
                </>
              )
            }
          </Section>
        )}

        {/* ── Categories ── */}
        {activeSection === 'categories' && (
          <Section title="Categories">
            {categories === null
              ? <p style={{ color: '#666' }}>Loading…</p>
              : <>
                  <AdminTable
                    columns={['ID', 'Category Name', 'Total Stories', 'Actions']}
                    rows={categoryRows}
                  />
                  {!addingCat && (
                    <button style={addBtnStyle} onClick={() => setAddingCat(true)}>+ Add Category</button>
                  )}
                </>
            }
          </Section>
        )}

        {/* ── Admins ── */}
        {activeSection === 'admins' && (
          <Section title="Admins">
            {admins === null
              ? <p style={{ color: '#666' }}>Loading…</p>
              : <AdminTable
                  columns={['User ID', 'Username', 'Email Address', 'Role', 'Date Joined', 'Actions']}
                  rows={adminRows}
                />
            }
          </Section>
        )}

      </div>

      {/* ── Delete story confirmation ── */}
      {deleteStoryId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={(e) => { if (e.target === e.currentTarget) setDeleteStoryId(null); }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 400, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0d2d5e', marginBottom: 12 }}>Remove Story</div>
            <p style={{ fontSize: 14, color: '#444', marginBottom: 24 }}>
              Are you sure you want to remove this story? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ ...actionBtn('#c62828'), padding: '8px 24px', fontSize: 14 }} onClick={handleDeleteStory}>YES</button>
              <button style={{ ...actionBtn('#888'),    padding: '8px 24px', fontSize: 14 }} onClick={() => setDeleteStoryId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
