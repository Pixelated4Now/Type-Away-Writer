import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import bannerImg from "../assets/readBanner.jpg"; 

// ── Placeholder category data ──────────────────────────────────────────────
// Replace this with a useEffect fetch from your database when it's ready.
// Each object needs: { id, name, image }
const CATEGORIES = [
  { id: 1,  name: "Adventure",       image: "/assets/categories/adventure.jpg" },
  { id: 2,  name: "Animal Stories",  image: "/assets/categories/animals.jpg" },
  { id: 3,  name: "Comedy",          image: "/assets/categories/comedy.jpg" },
  { id: 4,  name: "Dreams",          image: "/assets/categories/dreams.jpg" },
  { id: 5,  name: "Family",          image: "/assets/categories/family.jpg" },
  { id: 6,  name: "Friendship",      image: "/assets/categories/friends.jpg" },
  { id: 7,  name: "Horror",          image: "/assets/categories/horror.jpg" },
  { id: 8,  name: "Magic",           image: "/assets/categories/magic.jpg" },
  { id: 9,  name: "Mystery",         image: "/assets/categories/mystery.jpg" },
  { id: 10, name: "Romance",         image: "/assets/categories/romance.jpg" },
  { id: 11, name: "School Life",     image: "/assets/categories/schoolLife.jpg" },
  { id: 12, name: "Science Fiction", image: "/assets/categories/scienceFiction.jpg" },
  { id: 13, name: "Sports Fiction",  image: "/assets/categories/sports.jpg" },
  { id: 14, name: "Superheroes",     image: "/assets/categories/superhero.jpg" },
];

const ReadPage = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    // Navigates to a filtered story list for that category
    navigate(`/read/${category.id}`);
  };

  return (
    <>
      <style>{`
        .read-page {
          font-family: 'Manrope', sans-serif;
          color: #111;
          background: #fff;
          width: 100vw;
        }

        /* ── Hero Banner ── */
        .read-hero {
          background: #F1E3C6;
          display: flex;
          align-items: stretch;
          min-height: 200px;
          overflow: hidden;
        }

        .read-hero-image {
          width: 400px;
          flex-shrink: 0;
          overflow: hidden;
        }

        .read-hero-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .read-hero-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          text-align: right;
          padding: 40px 56px;
        }

        .read-hero-text h1 {
          font-size: 36px;
          font-weight: 800;
          color: #111;
          margin: 0 0 12px;
        }

        .read-hero-text p {
          font-size: 14px;
          font-weight: 500;
          color: #444;
          line-height: 1.65;
          max-width: 380px;
          margin: 0;
        }

        /* ── Browse Section ── */
        .browse-section {
          max-width: 900px;
          margin: 0 auto;
          padding: 56px 48px 72px;
        }

        .browse-section h2 {
          font-size: 28px;
          font-weight: 800;
          text-align: center;
          margin: 0 0 40px;
          color: #111;
        }

        /* ── Category Grid ── */
        .category-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        /* ── Category Card ── */
        .category-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f4f4f4;
          border-radius: 12px;
          padding: 0 0 0 28px;
          height: 90px;
          cursor: pointer;
          border: none;
          outline: none;
          text-align: left;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
        }

        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }

        .category-card:active {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .category-name {
          font-size: 17px;
          font-weight: 700;
          color: #111;
          font-family: 'Manrope', sans-serif;
        }

        .category-image {
          width: 100px;
          height: 90px;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 35px 0 0 35px;
        }

        .category-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ── Responsive ── */
        @media (max-width: 680px) {
          .read-hero {
            flex-direction: column;
          }

          .read-hero-image {
            width: 100%;
            height: 180px;
          }

          .read-hero-text {
            align-items: flex-start;
            text-align: left;
            padding: 28px 24px;
          }

          .browse-section {
            padding: 40px 20px 56px;
          }

          .category-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="read-page">
        <Navbar />

        {/* ── Hero Banner ── */}
        <section className="read-hero">
          <div className="read-hero-image">
            <img src={bannerImg} alt="Stack of books" />
          </div>
          <div className="read-hero-text">
            <h1>Start Reading!</h1>
            <p>
              Pick a category and start exploring stories you'll love. Whether it's adventure,
              mystery, or fantasy, there's something waiting just for you.
              Dive in and discover your next favourite story!
            </p>
          </div>
        </section>

        {/* ── Browse Categories ── */}
        <section className="browse-section">
          <h2>Browse Categories</h2>
          <div className="category-grid">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                className="category-card"
                onClick={() => handleCategoryClick(category)}
              >
                <span className="category-name">{category.name}</span>
                <div className="category-image">
                  <img src={category.image} alt={category.name} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default ReadPage;