import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ReadCategory.css";

import bannerImg from "../assets/readBanner.jpg"; 

// ── Placeholder data — swap with real API calls when backend is ready ────────

const PLACEHOLDER_TAGS = [
  "Action", "Adventure", "Betrayal", "Chase", "Chemistry", "Clues", "Comedy",
  "Crime", "Danger", "Dark", "Dance", "Detective", "Discovery", "Drama",
  "Fighting", "Friendship", "Funny", "Happy", "Horror", "Hurt", "Illegal",
  "Laboratory", "Life", "Magic", "Murder", "Mystery", "Poison", "Romance",
  "Scary", "School", "Science", "Secretagent", "Secrets", "Spooky", "Sports",
  "Suspense", "Tragedy", "Virus", "Weapons",
];

const PLACEHOLDER_STORIES = [
  {
    id: 1,
    title: "The Mystery of the Underground Laboratory",
    authors: ["hmrigs"],
    summary: "Vihas was an ordinary boy until he found a key. But the key leads to an underground science lab. Let's join him and see what he finds.",
    tags: ["Experiments", "Science", "Illegal", "scary", "danger", "discovery", "suspense", "dark", "drama", "fighting", "laboratory", "chemistry", "spooky", "weapons", "murder", "crime", "secrets", "hurt", "virus", "clues"],
    status: "Complete",
    chapters: 57,
    likes: 327,
    comments: 108,
    cover: "/assets/covers/tmotul.png",
  },
    {
    id: 5,
    title: "Dreamer Girl",
    authors: ["pascalChampionhehe"],
    summary: "Ever since Lizzy's mother got sick, her life changed. Then relatives, the Dohl's, came to visit. But something's up with them, like they're trying to hide something.",
    tags: ["Mystery", "Secrets", "Poison", "Suspense", "Magic", "School"],
    status: "Complete",
    chapters: 3,
    likes: 17,
    comments: 9,
    cover: "/assets/covers/dg.png",
  },
  {
    id: 3,
    title: "The Man at the Window",
    authors: ["duckboi0804"],
    summary: "Every day when Amaya comes home from school there is a man watching from the window of his apartment. He's always there. Every single day. He never moves. And one day, he waves at her. The next day, he's not there. But the light is still on in his room.",
    tags: ["life", "secrets", "scary", "fighting", "dark", "danger", "suspense", "school"],
    status: "Complete",
    chapters: 22,
    likes: 12,
    comments: 5,
    cover: "/assets/covers/tmatw.png",
  },
  {
    id: 4,
    title: "The Just Right Detective Agency",
    authors: ["CyberKitty", "TimeBellaOfficial"],
    summary: "A story about four friends who decide to become detectives and solve many confusing cases.",
    tags: ["secretagent", "secrets", "detective", "clues", "danger", "drama", "friends", "happy"],
    status: "Ongoing",
    chapters: 5,
    likes: 3,
    comments: 1,
    cover: "/assets/covers/tjrda.png",
  },
  {
    id: 5,
    title: "A CRIME",
    authors: ["deepfried_steak"],
    summary: "Just a simple murder mystery story for all to read.",
    tags: ["Crime", "Murder", "Detective", "Fighting", "Danger", "Clues", "Suspense"],
    status: "Ongoing",
    chapters: 11,
    likes: 3,
    comments: 0,
    cover: "/assets/covers/ac.png",
  },
];

const CATEGORY_NAMES = {
  1: "Adventure", 2: "Animal Stories", 3: "Comedy", 4: "Dreams", 5: "Family", 6: "Friendship", 7: "Horror", 8: "Magic", 9: "Mystery", 10: "Romance", 11: "School Life", 12: "Science Fiction", 13: "Sports Fiction", 14: "Superheroes",
};

const MAX_TAGS = 20;

// Component

const ReadCategory = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const categoryName = CATEGORY_NAMES[categoryId] || "Stories";

  // ── Search form state
  const [titleInput, setTitleInput] = useState("");
  const [authorInput, setAuthorInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDropdown, setTagDropdown] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [completionStatus, setCompletionStatus] = useState("All");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // ── Results state
  const [stories, setStories] = useState(PLACEHOLDER_STORIES);
  const [searched, setSearched] = useState(false);

  // ── Refs for closing dropdowns on outside click
  const tagRef = useRef(null);
  const statusRef = useRef(null);

  // ── Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (tagRef.current && !tagRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Tag autocomplete: filter on input change
  const handleTagInput = (e) => {
    const val = e.target.value;
    setTagInput(val);
    if (val.trim() === "") {
      setTagDropdown([]);
      setShowDropdown(false);
      return;
    }
    const matches = PLACEHOLDER_TAGS.filter(
      (t) =>
        t.toLowerCase().startsWith(val.toLowerCase()) &&
        !selectedTags.includes(t)
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

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  // ── Search handler
  // Replace the filter logic below with a real API call when backend is ready
  const handleSearch = () => {
    let results = PLACEHOLDER_STORIES;

    if (titleInput.trim()) {
      results = results.filter((s) =>
        s.title.toLowerCase().includes(titleInput.toLowerCase())
      );
    }
    if (authorInput.trim()) {
      results = results.filter((s) =>
        s.authors.some((a) =>
          a.toLowerCase().includes(authorInput.toLowerCase())
        )
      );
    }
    if (selectedTags.length > 0) {
      results = results.filter((s) =>
        selectedTags.every((t) => s.tags.includes(t))
      );
    }
    if (completionStatus !== "All") {
      results = results.filter((s) => s.status === completionStatus);
    }

    setStories(results);
    setSearched(true);
  };

  return (
    <div className="category-page">
      <Navbar />

      {/* ── Hero Banner ── */}
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

      {/* ── Page Title ── */}
      <h2 className="category-title">{categoryName}</h2>

      {/* ── Main Content: Stories + Work Search ── */}
      <div className="category-main">

        {/* ── Story List ── */}
        <div className="story-list">
          {stories.length > 0 ? (
            stories.map((story) => (
              <div
                key={story.id}
                className="story-card"
                onClick={() => navigate(`/read/story/${story.id}`)}
              >
                <div className="story-cover">
                  <img src={story.cover} alt={story.title} />
                </div>
                <div className="story-info">
                  <h3 className="story-title">{story.title}</h3>
                  <p className="story-authors">
                    by {[...story.authors].sort().join(", ")}
                  </p>
                  <p className="story-summary">{story.summary}</p>
                  <div className="story-tags">
                    {story.tags.map((tag) => (
                      <span key={tag} className="story-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="story-meta">
                    <span className="story-status">{story.status}</span>
                    <span>{story.chapters} chapters</span>
                  </div>
                  <div className="story-stats">
                    {story.likes} likes • {story.comments} comments
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results">
              There are currently no stories matching your search criteria.{" "} <br></br>
              Try adjusting your search or{" "}
              <Link to="/write" className="no-results-link">write your own story</Link>
              {" "}on Type-Away-Writer.
            </p>
          )}
        </div>

        {/* ── Work Search ── */}
        <aside className="work-search">
          <h3 className="work-search-title">Work Search</h3>

          {/* Title */}
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

          {/* Author */}
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

          {/* Tags */}
          <div className="search-field" ref={tagRef}>
            <label>Tags:</label>
            <div className={`tag-input-box ${showDropdown ? "active" : ""}`}>
              {selectedTags.map((tag) => (
                <span key={tag} className="selected-tag">
                  {tag}
                  <button
                    className="remove-tag"
                    onClick={() => removeTag(tag)}
                  >×</button>
                </span>
              ))}
              {selectedTags.length < MAX_TAGS && (
                <input
                  type="text"
                  placeholder={selectedTags.length === 0 ? "Search matching tags to include" : ""}
                  value={tagInput}
                  onChange={handleTagInput}
                  onFocus={() => {
                    if (tagDropdown.length > 0) setShowDropdown(true);
                  }}
                  className="tag-text-input"
                />
              )}
            </div>
            {showDropdown && (
              <ul className="tag-dropdown">
                {tagDropdown.map((tag) => (
                  <li
                    key={tag}
                    className="tag-dropdown-item"
                    onMouseDown={() => addTag(tag)}
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Completion Status */}
          <div className="search-field" ref={statusRef}>
            <label>Completion status:</label>
            <div
              className={`status-select ${showStatusDropdown ? "active" : ""}`}
              onClick={() => setShowStatusDropdown((prev) => !prev)}
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
                    onMouseDown={() => {
                      setCompletionStatus(s);
                      setShowStatusDropdown(false);
                    }}
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