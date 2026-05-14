import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Icons (inline SVG components) ────────────────────────────────────────────
const Icon = ({ d, color = "#0d2d5e" }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  students:  "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  experts:   "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  content:   "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  tags:      "M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z",
  categories:"M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z",
  admins:    "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
  profile:   "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  logout:    "M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z",
};

// ── Placeholder data ──────────────────────────────────────────────────────────
const STATS = {
  totalUsers: 123,
  totalStudents: 91,
  totalExperts: 32,
  totalStories: 142,
};

const STORIES_OVER_TIME = [
  { month: "Jan", stories: 8 },
  { month: "Feb", stories: 14 },
  { month: "Mar", stories: 10 },
  { month: "Apr", stories: 22 },
  { month: "May", stories: 18 },
  { month: "Jun", stories: 30 },
  { month: "Jul", stories: 25 },
  { month: "Aug", stories: 12 },
  { month: "Sep", stories: 20 },
  { month: "Oct", stories: 28 },
  { month: "Nov", stories: 16 },
  { month: "Dec", stories: 35 },
];

const STORIES_BY_CATEGORY = [
  { name: "Mystery",        value: 28 },
  { name: "Adventure",      value: 22 },
  { name: "Romance",        value: 18 },
  { name: "Horror",         value: 14 },
  { name: "Science Fiction",value: 12 },
  { name: "Other",          value: 48 },
];

const STORIES_BY_TYPE = [
  { name: "Individual", value: 95 },
  { name: "Collaborated", value: 47 },
];

const CATEGORY_COLORS = ["#0d2d5e","#1a4a8a","#2563b0","#4a90d9","#7ab8f5","#aed4f7"];
const TYPE_COLORS = ["#0d2d5e", "#7ab8f5"];

// ── Students placeholder data
const STUDENTS = Array.from({ length: 12 }, (_, i) => ({
  userId: `STU${String(i + 1).padStart(3, "0")}`,
  username: ["DarkxWolf17","ClaireLess","Midnight Tyger","Arratagus","mercywasnothere","hmrigs","CyberKitty","deepfried_steak","TimeBellaOfficial","pascalChampionhehe","Jillybean","singintheblues"][i],
  email: `user${i + 1}@example.com`,
  joined: `${String(Math.floor(Math.random() * 28) + 1).padStart(2,"0")} Jan 2025`,
  stories: Math.floor(Math.random() * 10),
  status: i % 4 === 0 ? "Suspended" : "Active",
}));

// ── Experts placeholder data
const EXPERTS = Array.from({ length: 6 }, (_, i) => ({
  userId: `EXP${String(i + 1).padStart(3, "0")}`,
  username: ["Jillybean","singintheblues","ArtsyMoth","LinguaFranca","WordSmith99","PenAndPaper"][i],
  email: `expert${i + 1}@example.com`,
  joined: `${String(Math.floor(Math.random() * 28) + 1).padStart(2,"0")} Jan 2025`,
  reviews: Math.floor(Math.random() * 50),
  status: i % 5 === 0 ? "Suspended" : "Active",
}));

// ── Content placeholder data
const CONTENT = Array.from({ length: 8 }, (_, i) => ({
  storyId: `STR${String(i + 1).padStart(3, "0")}`,
  title: ["Dreamer Girl","The Mystery of the Underground Laboratory","The Man at the Window","A CRIME","What Remains","The Just Right Detective Agency","A Soul for the Stars","Echoes in the Dark"][i],
  author: ["pascalChampionhehe","hmrigs","duckboi0804","deepfried_steak","backdoor","CyberKitty","ArtsyMoth","ClaireLess"][i],
  category: ["Dreams","Mystery","Mystery","Mystery","Mystery","Mystery","Science Fiction","Horror"][i],
  status: i % 3 === 0 ? "Under Review" : "Published",
}));

// ── Tags placeholder data
const TAGS = ["action","adventure","betrayal","chase","chemistry","clues","comedy","crime","danger","dark","detective","discovery","drama","fighting","friendship","funny","happy","horror","hurt","illegal","laboratory","life","magic","murder","mystery","poison","romance","scary","school","science","secretagent","secrets","spooky","suspense","tragedy","virus","weapons"];

// ── Categories placeholder data
const CATEGORIES = [
  { id: 1, name: "Adventure",       stories: 22, image: "/assets/categories/adventure.jpg" },
  { id: 2, name: "Animal Stories",  stories: 8,  image: "/assets/categories/animals.jpg" },
  { id: 3, name: "Comedy",          stories: 5,  image: "/assets/categories/comedy.jpg" },
  { id: 4, name: "Dreams",          stories: 11, image: "/assets/categories/dreams.jpg" },
  { id: 5, name: "Family",          stories: 7,  image: "/assets/categories/family.jpg" },
  { id: 6, name: "Mystery",         stories: 28, image: "/assets/categories/mystery.jpg" },
];

// ── Admins placeholder data
const ADMINS = [
  { userId: "ADM001", username: "superadmin", email: "admin@typeaway.com", role: "Super Admin", joined: "01 Jan 2024" },
  { userId: "ADM002", username: "moderator1", email: "mod1@typeaway.com",  role: "Moderator",   joined: "15 Mar 2024" },
];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, bg }) => (
  <div style={{
    background: bg,
    borderRadius: 12,
    padding: "24px 28px",
    flex: 1,
    minWidth: 160,
  }}>
    <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, margin: "0 0 12px" }}>{label}</p>
    <p style={{ color: "#fff", fontWeight: 800, fontSize: 40, margin: 0, lineHeight: 1 }}>{value}</p>
  </div>
);

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const colors = {
    Active:       { bg: "#e6f4ea", color: "#2e7d32" },
    Suspended:    { bg: "#fdecea", color: "#c62828" },
    Published:    { bg: "#e6f4ea", color: "#2e7d32" },
    "Under Review":{ bg: "#fff8e1", color: "#f57f17" },
  };
  const s = colors[status] || { bg: "#eee", color: "#555" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 20, padding: "3px 12px",
      fontSize: 12, fontWeight: 700,
    }}>{status}</span>
  );
};

// ── Table ─────────────────────────────────────────────────────────────────────
const AdminTable = ({ columns, rows }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead>
        <tr style={{ background: "#0d2d5e" }}>
          {columns.map((col) => (
            <th key={col} style={{ color: "#fff", padding: "12px 16px", textAlign: "left", fontWeight: 600, whiteSpace: "nowrap" }}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #e8e8e8", background: i % 2 === 0 ? "#fff" : "#f9fafc" }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: "12px 16px", color: "#333" }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div>
    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0d2d5e", margin: "0 0 24px" }}>{title}</h2>
    {children}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    useEffect(() => { document.title = 'Dashboard | Type-Away-Writer'; }, []);

  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [tagSearch, setTagSearch] = useState("");

  const navItems = [
    { id: "dashboard",  label: "Dashboard",  icon: ICONS.dashboard },
    { id: "students",   label: "Students",   icon: ICONS.students },
    { id: "experts",    label: "Experts",    icon: ICONS.experts },
    { id: "content",    label: "Content",    icon: ICONS.content },
    { id: "tags",       label: "Tags",       icon: ICONS.tags },
    { id: "categories", label: "Categories", icon: ICONS.categories },
    { id: "admins",     label: "Admins",     icon: ICONS.admins },
  ];

  const filteredTags = TAGS.filter((t) =>
    t.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Manrope', sans-serif", background: "#f4f6fb" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, background: "#fff", borderRight: "1px solid #e8e8e8",
        display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh",
      }}>
        {/* Brand */}
        <div style={{ padding: "28px 24px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🖨️</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#0d2d5e" }}>TypeAway.</span>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid #e8e8e8", margin: "0 24px 16px" }} />

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "10px 14px", marginBottom: 4,
                background: activeSection === item.id ? "#eef3fb" : "transparent",
                border: "none", borderRadius: 8, cursor: "pointer",
                color: activeSection === item.id ? "#0d2d5e" : "#555",
                fontFamily: "'Manrope', sans-serif",
                fontSize: 14, fontWeight: activeSection === item.id ? 700 : 500,
                transition: "background 0.15s ease",
              }}
            >
              <Icon d={item.icon} color={activeSection === item.id ? "#0d2d5e" : "#888"} />
              {item.label}
            </button>
          ))}
        </nav>

        <hr style={{ border: "none", borderTop: "1px solid #e8e8e8", margin: "0 24px 12px" }} />

        {/* Profile + Logout */}
        <div style={{ padding: "0 12px 24px" }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 12,
            width: "100%", padding: "10px 14px", marginBottom: 4,
            background: "transparent", border: "none", borderRadius: 8,
            cursor: "pointer", fontFamily: "'Manrope', sans-serif",
            fontSize: 14, fontWeight: 500, color: "#555",
          }}>
            <Icon d={ICONS.profile} color="#888" /> Profile
          </button>
          <button
            onClick={() => { localStorage.removeItem("authToken"); navigate("/login"); }}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", padding: "10px 14px",
              background: "transparent", border: "none", borderRadius: 8,
              cursor: "pointer", fontFamily: "'Manrope', sans-serif",
              fontSize: 14, fontWeight: 500, color: "#c62828",
            }}
          >
            <Icon d={ICONS.logout} color="#c62828" /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: "40px 40px 72px", overflowY: "auto" }}>

        {/* ══ DASHBOARD ══ */}
        {activeSection === "dashboard" && (
          <div>
            {/* Stat cards */}
            <div style={{ display: "flex", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
              <StatCard label="Total Users:"           value={STATS.totalUsers}    bg="#3b4270" />
              <StatCard label="Total Students:"        value={STATS.totalStudents} bg="#1a2340" />
              <StatCard label="Total Language Experts:"value={STATS.totalExperts}  bg="#1a2340" />
              <StatCard label="Total Stories:"         value={STATS.totalStories}  bg="#8fa8cf" />
            </div>

            {/* Charts row */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

              {/* Stories Over Time */}
              <div style={{ flex: 2, minWidth: 300, background: "#fff", borderRadius: 12, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <h3 style={{ fontWeight: 800, fontSize: 18, color: "#111", margin: "0 0 24px" }}>Stories Over Time</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={STORIES_OVER_TIME}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="stories" fill="#0d2d5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Right column: two pie charts */}
              <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 24 }}>

                {/* Stories by Category */}
                <div style={{ background: "#fff", borderRadius: 12, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <h3 style={{ fontWeight: 800, fontSize: 18, color: "#111", margin: "0 0 16px" }}>Stories by Category</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={STORIES_BY_CATEGORY} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                        {STORIES_BY_CATEGORY.map((_, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Individual vs Collaborated */}
                <div style={{ background: "#fff", borderRadius: 12, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                  <h3 style={{ fontWeight: 800, fontSize: 18, color: "#111", margin: "0 0 16px" }}>Individual vs Collaborated</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={STORIES_BY_TYPE} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                        {STORIES_BY_TYPE.map((_, i) => (
                          <Cell key={i} fill={TYPE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ══ STUDENTS ══ */}
        {activeSection === "students" && (
          <Section title="Students">
            <AdminTable
              columns={["User ID", "Username", "Email Address", "Date Joined", "Stories", "Status", "Actions"]}
              rows={STUDENTS.map((s) => [
                s.userId, s.username, s.email, s.joined, s.stories,
                <StatusBadge status={s.status} />,
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={actionBtn("#0d2d5e")}>View</button>
                  <button style={actionBtn("#c62828")}>Suspend</button>
                </div>
              ])}
            />
          </Section>
        )}

        {/* ══ EXPERTS ══ */}
        {activeSection === "experts" && (
          <Section title="Language Experts">
            <AdminTable
              columns={["User ID", "Username", "Email Address", "Date Joined", "Reviews", "Status", "Actions"]}
              rows={EXPERTS.map((e) => [
                e.userId, e.username, e.email, e.joined, e.reviews,
                <StatusBadge status={e.status} />,
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={actionBtn("#0d2d5e")}>View</button>
                  <button style={actionBtn("#c62828")}>Suspend</button>
                </div>
              ])}
            />
          </Section>
        )}

        {/* ══ CONTENT ══ */}
        {activeSection === "content" && (
          <Section title="Content">
            <AdminTable
              columns={["Story ID", "Title", "Author", "Category", "Status", "Actions"]}
              rows={CONTENT.map((c) => [
                c.storyId, c.title, c.author, c.category,
                <StatusBadge status={c.status} />,
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={actionBtn("#0d2d5e")}>View</button>
                  <button style={actionBtn("#c62828")}>Remove</button>
                </div>
              ])}
            />
          </Section>
        )}

        {/* ══ TAGS ══ */}
        {activeSection === "tags" && (
          <Section title="Tags">
            <input
              type="text"
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              style={{
                width: "100%", maxWidth: 360, height: 40,
                border: "1px solid #ccc", borderRadius: 8,
                padding: "0 14px", fontSize: 14, fontFamily: "'Manrope', sans-serif",
                outline: "none", marginBottom: 24, boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {filteredTags.map((tag) => (
                <div key={tag} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#eef3fb", borderRadius: 20,
                  padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "#0d2d5e",
                }}>
                  {tag}
                  <button style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#c62828", fontWeight: 800, fontSize: 14,
                    padding: 0, lineHeight: 1,
                  }}>×</button>
                </div>
              ))}
            </div>
            <button style={{
              marginTop: 24, height: 40, padding: "0 24px",
              background: "#0d2d5e", color: "#fff", border: "none",
              borderRadius: 8, fontFamily: "'Manrope', sans-serif",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              + Add Tag
            </button>
          </Section>
        )}

        {/* ══ CATEGORIES ══ */}
        {activeSection === "categories" && (
          <Section title="Categories">
            <AdminTable
              columns={["ID", "Category Name", "Total Stories", "Actions"]}
              rows={CATEGORIES.map((c) => [
                c.id, c.name, c.stories,
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={actionBtn("#0d2d5e")}>Edit</button>
                  <button style={actionBtn("#c62828")}>Delete</button>
                </div>
              ])}
            />
            <button style={{
              marginTop: 24, height: 40, padding: "0 24px",
              background: "#0d2d5e", color: "#fff", border: "none",
              borderRadius: 8, fontFamily: "'Manrope', sans-serif",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              + Add Category
            </button>
          </Section>
        )}

        {/* ══ ADMINS ══ */}
        {activeSection === "admins" && (
          <Section title="Admins">
            <AdminTable
              columns={["User ID", "Username", "Email Address", "Role", "Date Joined", "Actions"]}
              rows={ADMINS.map((a) => [
                a.userId, a.username, a.email, a.role, a.joined,
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={actionBtn("#0d2d5e")}>Edit</button>
                  <button style={actionBtn("#c62828")}>Remove</button>
                </div>
              ])}
            />
            <button style={{
              marginTop: 24, height: 40, padding: "0 24px",
              background: "#0d2d5e", color: "#fff", border: "none",
              borderRadius: 8, fontFamily: "'Manrope', sans-serif",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              + Add Admin
            </button>
          </Section>
        )}

      </main>
    </div>
  );
};

// ── Small helper for action buttons
const actionBtn = (bg) => ({
  height: 30, padding: "0 14px", background: bg, color: "#fff",
  border: "none", borderRadius: 6, fontFamily: "'Manrope', sans-serif",
  fontSize: 12, fontWeight: 700, cursor: "pointer",
});

export default AdminDashboard;