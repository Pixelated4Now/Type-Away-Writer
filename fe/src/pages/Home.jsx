import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Home.css";

// Images
import heroBookImg from "../assets/magicBook.jpg";
import writingPadImg from "../assets/homeBanner.jpg";
import exploreImg from "../assets/write.png";
import workTogetherImg from "../assets/collaborate.jpg";
import getInspiredImg from "../assets/reading.jpg";
import shareLoveImg from "../assets/like.jpg";
import bookmarkImg from "../assets/readingList.jpg";
import expertImg from "../assets/expertReview.png";
import footerLogo from "../assets/logo.png";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-text">
          <h1>Become a writer!</h1>
          <p>
            Type-Away-Writer lets anyone make a story in seconds. It empowers
            young writers to create unique stories and let their imagination
            take flight like never before!
          </p>
        </div>
        <div className="hero-image">
          <img src={heroBookImg} alt="Open book with glowing globe" />
        </div>
      </section>

      {/* ── Get Started Banner ── */}
      <section className="get-started-banner">
        <div className="banner-image">
          <img src={writingPadImg} alt="Writing pad and pen" />
        </div>
        <div className="banner-text">
          <h2>Get Started</h2>
          <p>
            Write captivating stories, read enchanting novels, and
            discover hidden talents
          </p>
          <button className="btn-start-writing" onClick={() => navigate("/write")}>
            START WRITING
          </button>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="how-it-works">
        <h2>How it Works</h2>

        <div className="feature-row">
          
          <div className="feature-text">
            <h3>Explore Your Creativity</h3>
            <p>
              Unleash your imagination with our easy-to-use story editor,
              designed to make writing your own stories exciting and effortless.
              Publish your work in just a click and share your creativity with a
              vibrant community ready to read, enjoy, and celebrate your ideas.
            </p>
          </div>
          <div className="feature-image">
            <img src={exploreImg} alt="Explore creativity" />
          </div>
        </div>

        <div className="feature-row reverse">
          <div className="feature-text">
            <h3>Work Together</h3>
            <p>
              Team-work makes the dream work! Collaborate with friends and
              fellow young authors. Share ideas, build plots, and co-create
              exciting stories.
            </p>
          </div>
          <div className="feature-image">
            <img src={workTogetherImg} alt="Work together" />
          </div>
        </div>

        <div className="feature-row">
          <div className="feature-text">
            <h3>Get Inspired</h3>
            <p>
              Dive into a world of stories created by young writers just like you.
              Discover new ideas, explore different genres, and let each story
              spark your imagination. Get inspired, learn from others, and
              sharpen your own creativity into something amazing.
            </p>
          </div>
          <div className="feature-image">
            <img src={getInspiredImg} alt="Get inspired" />
          </div>
        </div>

        <div className="feature-row reverse">
          <div className="feature-text">
            <h3>Share Your Love</h3>
            <p>
              Your likes count! Show support by liking your favorite stories and
              leaving thoughtful comments. Every like and comment helps fellow
              authors grow and feel proud of their work.
            </p>
          </div>
          <div className="feature-image">
            <img src={shareLoveImg} alt="Share your love" />
          </div>
        </div>

        <div className="feature-row">
          <div className="feature-text">
            <h3>Bookmark Favourites</h3>
            <p>
              Never lose track of the stories you love by saving them to your
              personal reading lists. Build your own collection of amazing stories
              and keep your creativity close at hand.
            </p>
          </div>
          <div className="feature-image">
            <img src={bookmarkImg} alt="Bookmark favourites" />
          </div>
        </div>

        <div className="join-cta">
          <button className="btn-join" onClick={() => navigate("/register")}>
            JOIN THE COMMUNITY
          </button>
        </div>
      </section>

      {/* ── There's More ── */}
      <section className="theres-more">
        <h2>There's more</h2>
        <div className="expert-review-card">
          <div className="expert-review-text">
            <h3>Expert Review</h3>
            <p>
              Submit your stories to receive expert feedback from language experts and other
              authors to improve on the basics and learn new techniques.
            </p>
          </div>
          <div className="expert-review-image">
            <img src={expertImg} alt="Language expert reviewing" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;