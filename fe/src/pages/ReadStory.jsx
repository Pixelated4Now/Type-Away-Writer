import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ReadStory.css";

import readingListImg from "../assets/addToList.png"; 
import shareImg from "../assets/share.png"; 
import likeImg from "../assets/likeAChapter.png"; 
import likedImg from "../assets/likedAChapter.png"; 

// ── Placeholder data — replace with API calls when backend is ready ──────────

const PLACEHOLDER_STORY = {
  id: 1,
  title: "Dreamer Girl",
  authors: ["pascalChampionhehe"],
  summary: "Ever since Lizzy's mother got sick, her life changed. Then relatives, the Dohl's, came to visit. But something's up with them, like they're trying to hide something.",
  status: "Complete",
  cover: "/assets/covers/dg.png",
  chapters: [
    {
      id: 1,
      name: "Lizzy",
      content: `Lively, jazzy music drifted through the speakers at Café Brunette. Rain ran down the windows in fast little streaks. Orange and golden leaves stood out against the dreary, gray sky. Fall was here. Lizzy Gables watched the steady rain, and ignored the hostile guests seated at her and her father's table.

"It's been quite a while, hasn't it, Lizzy?" her father said. His voice was stiff. No one liked Mrs. and Mr. Dohl. Not even Lizzy's father, who was the nicest man she knew. Lizzy paid no attention to his efforts to spark conversation.

Mrs. Dohl cleared her throat.

"My, how long has it been?" Mrs. Dohl's voice was cold, like ice, and sharp, like needles.

"Quite a few years, I would reckon," Mr. Dohl said. His voice gave off a similar feeling as Mrs. Dohl's, but deeper. Lizzy turned her attention to the bouquets of roses and baby's breath and lavender. Miniature pumpkins were sprinkled all over the café. Lizzy could smell pumpkin spice and cinnamon drifting through the café.

Lizzy stood.

"I'll be right back," she said. She turned away from the table, and was making her way down to the back patio, when something caught her ear.

"My, Lizzy's quite the little dreamer," Mrs. Dohl cooed. "She's such a little doll."

She shook her head in disbelief, and continued on to the back patio. Her heart skipped beats and fumbled in her chest, though, she had no idea why.`,
      comments: [
        { id: 1, username: "Jillybean", role: "expert", avatar: "/assets/avatars/jb.png", datetime: "2025-12-16T11:11:00", text: "This is a great story and it really captures how wonderful writing is! I'd love to see more about Lizzy and the Dohls and what kind of things were there. Well done!" },
        { id: 2, username: "Midnight Tyger", role: "reader", avatar: "/assets/avatars/peopleReading.jpg", datetime: "2025-12-14T09:36:00", text: "How can people NOT view this? This is amazing 😭" },
        { id: 3, username: "ClaireLess", role: "reader", avatar: "/assets/avatars/jl.png", datetime: "2025-12-18T11:02:00", text: "This was epic bye the way" },
      ],
    },
    {
      id: 2,
      name: "Dollhouse",
      content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Augue nisl dui augue lacinia lectus varius venenatis tristique nisl tempus at. Faucibus mattis litora amet mattis consequat cursus blandit.

Platea fermentum aptent mollis turpis nullam et ornare dictum dictum libero. Sollicitudin litora mi vehicula fames habitant porttitor inceptos cursus class neque lectus ac. Rutrum tempus lobortis blandit porttitor conubia eleifend aenean ad at velit. Nam fames neque condimentum est nam at ante.

Faucibus sem hendrerit amet lobortis ultrices. Odio consectetur eros aptent consequat maecenas pulvinar ultricies dapibus felis sociosqu quis nec praesent. Lacus integer conubia nulla vehicula pellentesque justo cras lacus class rutrum sodales tortor sed. Nunc lectus odio tempus inceptos nec ex ultricies.

Gravida class facilisis fermentum et est mollis euismod tellus mattis est turpis non. Faucibus conubia neque in sociosqu lectus ac egestas orci id netus blandit netus praesent sollicitudin aliquam. Tristique consectetur praesent varius dictum aenean curae convallis massa egestas quam. Donec viverra auctor hac nulla consequat integer class molestie justo.

Consectetur consectetur mi nibh elit semper est. Placerat auctor mauris tellus imperdiet vivamus posuere eleifend vulputate finibus massa. Nibh leo volutpat fringilla nibh tristique est auctor luctus fusce habitasse.

Orci elit dignissim viverra hendrerit auctor praesent eleifend donec purus hac. Praesent arcu nullam posuere non phasellus tortor enim suscipit gravida elementum. Sagittis augue ac pellentesque ut iaculis massa gravida erat imperdiet nullam per.

Ornare cursus rutrum habitant ligula venenatis nisl auctor inceptos. Pharetra vivamus interdum magna nibh inceptos adipiscing inceptos.

Vestibulum semper volutpat ut ornare tristique netus phasellus. Ipsum ullamcorper porta nulla pellentesque lacinia nostra ultrices non risus ipsum venenatis tristique.

Fusce tincidunt fringilla posuere inceptos donec dolor nisl nisl nec id pulvinar tristique sollicitudin commodo pellentesque. Ornare dictumst sagittis dolor maximus aliquam aliquet consequat dolor felis tincidunt integer congue viverra. Euismod odio suspendisse est volutpat tellus vitae purus.

In quisque risus suscipit praesent finibus vehicula tellus vulputate quisque quisque consequat. Accumsan et congue posuere dui nunc inceptos sapien purus ex massa odio nostra. Taciti per sem ac non congue maecenas nunc proin euismod torquent sit eleifend lorem orci. Urna donec risus potenti ac interdum class eu consequat ante cursus turpis nisi. Posuere sodales scelerisque vestibulum feugiat ullamcorper curabitur. Pulvinar morbi aptent fusce a neque arcu eleifend nostra.

Habitasse enim volutpat dolor dignissim quam sodales per feugiat odio velit interdum condimentum quam pellentesque ut. Sodales sodales condimentum amet vitae platea congue posuere dapibus suscipit potenti eu dictumst dictumst.

Ex hac hac integer leo commodo ante risus malesuada ultrices morbi tempor condimentum senectus ornare. Porttitor dictum lacinia lacinia eget mauris rhoncus orci maecenas pulvinar nostra. Tempor ex per scelerisque dolor justo mauris lectus augue erat pharetra maecenas phasellus euismod pellentesque et. Vivamus convallis turpis fringilla diam bibendum torquent ultricies quis.

Facilisis consequat mattis habitant enim tempor velit risus etiam sit tempus mi molestie sed rutrum commodo. Maximus suscipit faucibus interdum in tristique dictum quam ultricies id id imperdiet pretium augue nostra. Euismod ut eget a ut vel sociosqu ornare imperdiet.

Dapibus quisque dignissim orci vulputate metus tortor nostra enim etiam odio pharetra. Volutpat tristique curabitur ultrices hac non viverra mattis tortor elit.
Finibus volutpat ornare himenaeos consectetur cras sem. Purus ante potenti est curae mauris leo sociosqu rhoncus non phasellus nisl ad maximus.`,
      comments: [
        { id: 4, username: "Midnight Tyger", role: "reader", avatar: "/assets/avatars/peopleReading.jpg", datetime: "2025-12-16T12:54:00", text: "Can you pleease a THOUSAND more PEEEASE?!\nIt was soooooo good." },
        { id: 5, username: "mercywasnothere", role: "reader", avatar: "/assets/avatars/mwh.jpg", datetime: "2025-12-16T10:37:00", text: "a delight to read and I'm super excited to see more chapters 🙂" },
      ],
    },
    {
      id: 3,
      name: "Creature",
      content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Iaculis nisi condimentum commodo torquent sagittis fames non. Fusce lacinia quisque diam nulla gravida. Risus porttitor venenatis est gravida posuere. Rhoncus hac nostra convallis euismod volutpat curabitur lorem semper augue.

Sagittis ullamcorper senectus fermentum quis laoreet urna sed duis nec felis aenean habitant tincidunt dictumst malesuada. Fermentum class habitant erat nibh sapien litora orci tristique vitae ex fringilla taciti vitae. Magna id congue fusce dui nostra elementum venenatis orci. Id tincidunt ipsum metus massa facilisis congue litora. Congue posuere maecenas ad cras inceptos habitasse ex quam.Orci hac hendrerit tempus sem convallis convallis class varius non donec urna. Venenatis purus primis aenean sollicitudin aptent mauris luctus quisque ultricies vitae vivamus quis euismod. Interdum vulputate enim feugiat ultrices pretium. Arcu pellentesque condimentum class iaculis rhoncus fermentum auctor vehicula mi. Taciti litora dolor taciti adipiscing ante donec sit pellentesque consequat nec phasellus nulla auctor lectus.
Vestibulum sed hac eget urna nisl faucibus proin placerat rutrum tempus ultricies. Arcu laoreet himenaeos aenean auctor tellus praesent. Condimentum mauris molestie venenatis nam amet elit facilisis cras hac consectetur habitasse. Fames bibendum suscipit augue mattis inceptos mi consequat volutpat in per fringilla ligula. Nulla dapibus fermentum ullamcorper fermentum aliquet morbi pulvinar litora litora gravida aptent finibus ligula rhoncus.

Cursus aliquet fusce quam amet amet ante fringilla eget semper urna. Imperdiet laoreet iaculis quisque ultrices justo dictumst nisl feugiat accumsan nibh. Hac ultrices nisl egestas volutpat morbi libero cras.Aliquam lobortis varius dui viverra cras leo velit quis tellus. Pulvinar est placerat blandit vitae aliquet justo. Conubia enim ultricies mauris sit semper leo rutrum vitae non hac tellus sociosqu eleifend malesuada.Sapien morbi nisl vivamus risus consectetur potenti quam ipsum mattis gravida eros. Faucibus integer magna fusce nam sit nulla. Morbi dui conubia mollis ex sollicitudin integer lobortis convallis torquent porttitor etiam ligula pellentesque. Inceptos sociosqu primis elementum fermentum maecenas phasellus luctus mi. Aliquet ultrices nostra sed sociosqu interdum sodales rhoncus nec in elit sit fermentum facilisis. Ultricies sodales pharetra diam curae cras morbi elementum ligula praesent lacus amet faucibus quisque lobortis. Nisi bibendum rutrum vehicula sagittis nulla metus potenti purus proin nostra consectetur viverra suspendisse cursus nec.

Eget sapien vivamus litora convallis diam torquent dictumst venenatis auctor. Sollicitudin pellentesque pellentesque enim donec orci ad egestas primis laoreet maecenas rutrum sociosqu semper elementum ultrices. Fringilla vehicula donec fames maecenas luctus blandit sit sagittis. Mauris proin dapibus habitant tellus aptent fringilla habitant litora dui rutrum nec. Dapibus leo eros egestas erat suspendisse adipiscing hendrerit litora. Sagittis ante turpis porta mollis sociosqu gravida cursus sagittis cubilia. Venenatis maximus amet finibus ornare duis quam cras mollis bibendum. Finibus vitae pretium semper commodo finibus augue cursus nec morbi auctor cursus nunc pharetra. Praesent tellus ipsum vel non curabitur. Fusce id habitant tristique suspendisse ultrices sed vehicula ex non gravida semper.

Porttitor fermentum elit per luctus dictumst justo orci leo. Ullamcorper per turpis iaculis ad mauris luctus ex nunc accumsan turpis. Sed nunc faucibus varius duis convallis aliquet congue. Molestie mauris conubia turpis nostra hac donec dolor porttitor. Litora nunc imperdiet ligula ipsum condimentum vestibulum tristique turpis nam. Metus posuere augue vivamus lacinia suspendisse dolor lacinia primis. Nec commodo ipsum arcu mollis est dignissim nullam lacus bibendum senectus felis in libero. Ipsum leo nullam consequat elementum commodo tempus cursus. Cras proin varius scelerisque justo suscipit dictum at hendrerit amet dictum eleifend pulvinar`,
      comments: [
        { id: 6, username: "singintheblues", role: "expert", avatar: "/assets/avatars/sb.jpg", datetime: "2025-12-22T19:17:00", text: "Lizzy's determination is admirable - but the challenge of such a ritual does seem nearly insurmountable. I'm intrigued to see how the curse is finally lifted. Thank you for sharing this story with us!" },
        { id: 7, username: "Arratagus", role: "reader", avatar: "/assets/avatars/as.jpg", datetime: "2025-12-25T11:57:00", text: "liked it very much but maybe try adding some more lore" },
        { id: 8, username: "pascalChampionhehe", role: "author", avatar: "/assets/avatars/pc.jpg", datetime: "2025-12-25T18:34:00", text: "that's a good idea. I'll try in the sequel. I have this one all written out on Documents already, but the second one I think will be a little LESS focused on the love triangle between Atlas, Phoebe, and Ianira.", replyTo: 7 },
        { id: 9, username: "Midnight Tyger", role: "reader", avatar: "/assets/avatars/peopleReading.jpg", datetime: "2025-12-20T12:04:00", text: "This is such an amazing story! The characters are well developed and the writing is AMAZING! I LOVE IT! :)" },
      ],
    },
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDatetime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const sortComments = (comments) => {
  const experts = comments
    .filter((c) => c.role === "expert")
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  const others = comments
    .filter((c) => c.role !== "expert")
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  return [...experts, ...others];
};

// ── Sub-components ───────────────────────────────────────────────────────────

const RoleBadge = ({ role }) => {
  if (role === "expert") return <span className="badge badge-expert">LANGUAGE EXPERT</span>;
  if (role === "author") return <span className="badge badge-author">AUTHOR</span>;
  return null;
};

const CommentItem = ({ comment, isReply = false }) => (
  <div className={`comment-item ${isReply ? "comment-reply" : ""}`}>
    <img src={comment.avatar} alt={comment.username} className="comment-avatar" />
    <div className="comment-body">
      <div className="comment-header">
        <span className="comment-username">{comment.username}</span>
        <RoleBadge role={comment.role} />
        <span className="comment-datetime">{formatDatetime(comment.datetime)}</span>
      </div>
      <p className="comment-text">{comment.text}</p>
      <button className="reply-btn">REPLY</button>
    </div>
  </div>
);

// Main page

const ReadStory = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();

  // Replace with real API fetch when backend is ready
  const story = PLACEHOLDER_STORY;
  const totalChapters = story.chapters.length;

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");

  const chapter = story.chapters[currentChapterIndex];
  const isFirst = currentChapterIndex === 0;
  const isLast = currentChapterIndex === totalChapters - 1;
  const sortedComments = sortComments(chapter.comments);

  const goToChapter = (index) => {
    setCurrentChapterIndex(index);
    setDropdownOpen(false);
    setCommentText("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLike = () => {
    setLiked((prev) => !prev);
    // TODO: send like/unlike to backend
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    // TODO: send comment to backend
    setCommentText("");
  };

  const chapterDropdownRef = useRef(null);

    useEffect(() => {
    const handleClick = (e) => {
        if (chapterDropdownRef.current && !chapterDropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    }, []);

  const [heroColor, setHeroColor] = useState("rgba(201, 212, 232, 0.4)"); // fallback colour

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = story.cover;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 40) { // sample every 10th pixel
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
            }
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            setHeroColor(`rgba(${r}, ${g}, ${b}, 0.35)`);
        };
    }, [story.cover]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="story-page">
      <Navbar />

      {/* ── Story Hero ── */}
      <section className="story-hero" style={{ background: heroColor }}>
        <div className="story-hero-inner">
          <img src={story.cover} alt={story.title} className="story-hero-cover" />
          <div className="story-hero-info">
            <p className="story-hero-meta">
              {story.status} • {totalChapters} Chapter{totalChapters !== 1 ? "s" : ""}
            </p>
            <h1 className="story-hero-title">{story.title}</h1>
            <p className="story-hero-author">by {[...story.authors].sort().join(", ")}</p>
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

          {/* Chapter dropdown */}
          <div className="chapter-dropdown-wrapper" ref={chapterDropdownRef}>
            <button
              className="chapter-dropdown-trigger"
              onClick={() => setDropdownOpen((p) => !p)}
            >
              <span>Chapter {currentChapterIndex + 1}: {chapter.name}</span>
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
                    Chapter {i + 1}: {ch.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="sidebar-btn sidebar-btn-primary">
            <img src={readingListImg} alt="Stack of books" /> Add to reading list
          </button>
          <button className="sidebar-btn sidebar-btn-secondary">
            <img src={shareImg} alt="Stack of books" /> Share
          </button>
        </aside>

        {/* ── Main Reading Area ── */}
        <main className="story-main">

          {/* Chapter title */}
          <h2 className="chapter-title">
            Chapter {currentChapterIndex + 1}: {chapter.name}
          </h2>

          {/* Chapter content */}
          <div className="chapter-content">
            {chapter.content.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <hr className="chapter-divider" />

          {/* Chapter navigation buttons */}
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

          {/* Like button */}
          <button
            className={`like-btn ${liked ? "liked" : ""}`}
            onClick={handleLike}
          >
            <img src={likeImg} alt="Like icon" /> {liked ? "LIKED" : "LIKE"}
          </button>

          {/* Comment input */}
          <div className="comment-input-area">
            <textarea
              className="comment-textarea"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="comment-submit-row">
              <button className="comment-submit-btn" onClick={handleComment}>
                COMMENT
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="comments-list">
            {sortedComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>

        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ReadStory;