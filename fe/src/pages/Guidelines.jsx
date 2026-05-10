import Navbar from "../components/Navbar";
import Footer from "../components/Footer";


import bannerImg from "../assets/writeBanner.jpg"; 

const Guidelines = () => {
  return (
    <>
      <style>{`
        .guidelines-page {
          font-family: 'Manrope', sans-serif;
          color: #111;
          background: #fff;
          width: 100vw;
        }
 
        /* ── Hero Banner ── */
        .guidelines-hero {
          background: #CCCCCC;
          display: flex;
          align-items: stretch;
          min-height: 200px;
          overflow: hidden;
        }
 
        .guidelines-hero-image {
          width: 500px;
          flex-shrink: 0;
          overflow: hidden;
        }
 
        .guidelines-hero-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
 
        .guidelines-hero-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: center;
          text-align: right;
          padding: 40px 56px;
        }
 
        .guidelines-hero-text h1 {
          font-size: 36px;
          font-weight: 800;
          color: #111;
          margin: 0 0 12px;
        }
 
        .guidelines-hero-text p {
          font-size: 14px;
          font-weight: 500;
          color: #444;
          line-height: 1.6;
          max-width: 340px;
          margin: 0;
        }
 
        /* ── Main Content ── */
        .guidelines-content {
          max-width: 860px;
          margin: 0 auto;
          padding: 56px 48px 72px;
        }
 
        .guidelines-content > h2 {
          font-size: 30px;
          font-weight: 800;
          text-align: center;
          margin: 0 0 24px;
        }
 
        .guidelines-intro {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 1.7;
          margin: 0 0 24px;
        }
 
        .guidelines-content hr {
          border: none;
          border-top: 1px solid #e0e0e0;
          margin: 0 0 32px;
        }
 
        /* ── Individual Sections ── */
        .guidelines-section {
          margin-bottom: 32px;
        }
 
        .guidelines-section h3 {
          font-size: 20px;
          font-weight: 800;
          text-align: center;
          margin: 0 0 16px;
          color: #111;
        }
 
        .guidelines-section p {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 1.7;
          margin: 0 0 12px;
        }
 
        .guidelines-section ul {
          margin: 8px 0 16px 8px;
          padding: 0;
          list-style: none;
        }
 
        .guidelines-section ul li {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 1.6;
          padding-left: 16px;
          position: relative;
          margin-bottom: 4px;
        }
 
        .guidelines-section ul li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #555;
        }
 
        /* ── Responsive ── */
        @media (max-width: 768px) {
          .guidelines-hero {
            flex-direction: column;
          }
 
          .guidelines-hero-image {
            width: 100%;
            height: 180px;
          }
 
          .guidelines-hero-text {
            align-items: flex-start;
            text-align: left;
            padding: 28px 24px;
          }
 
          .guidelines-content {
            padding: 40px 24px;
          }
        }
      `}</style> 


    <div className="guidelines-page">
      <Navbar />

      {/* Hero Banner */}
      <section className="guidelines-hero">
        <div className="guidelines-hero-image">
          <img src={bannerImg} alt="Laptop and notebook" />
        </div>
        <div className="guidelines-hero-text">
          <h1>Community Guidelines</h1>
          <p>
            As a community member of Type-Away-Writer,
            it's important to always engage with others
            with the aim to help them improve.
          </p>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="guidelines-content">
        <h2>Guidelines</h2>

        <p className="guidelines-intro">
          We want to make sure the Type-Away-Writer community feels safe, secure, and happy, so
          everyone has the opportunity to share their stories with others. To make that happen,
          we've put together some community guides that we'd like to share with you.
        </p>

        <hr />

        <section className="guidelines-section">
          <h3>Be Constructive</h3>
          <p>
            As community members, you should aim to provide actionable advice that the recipient
            can use to make themselves better at writing. For example, useful feedback could mean:
          </p>
          <ul>
            <li>Advice on how to overcome writer's block</li>
            <li>Feedback on how to improve story structure</li>
            <li>Overall character development</li>
            <li>Focusing on a specific chapter, paragraph, or even sentence</li>
          </ul>
          <p>The bottom line is, make sure the recipient can improve based on your feedback.</p>
        </section>

        <hr />

        <section className="guidelines-section">
          <h3>Be Professional</h3>
          <p>
            As readers or writers, the best way to participate in the community is to approach
            others professionally.
          </p>
          <p>
            That means you leave your emotions at the door, and be objective when engaging with
            other community members, despite the emotional nature of storytelling. If you're on
            the receiving end, don't take offense if someone doesn't like your work. Being
            professional also means you, as a community member, are motivated to improve, whether
            you are a writer hoping to master your craft or a reader looking for great entertainment.
          </p>
          <p>The idea is to acquire knowledge through social interactions.</p>
        </section>

        <hr />

        <section className="guidelines-section">
          <h3>Be Respectful</h3>
          <p>
            We insist that while you are on Type-Away-Writer, you respect everyone you engage with.
          </p>
          <p>
            The internet is a place where people can freely voice their judgement, but it also gives
            community members the means to disrespect or insult others from their computer screen.
            We absolutely insist you shouldn't be overly critical, or disrespectful.
          </p>
          <p>Remember to always treat others the way you would want to be treated.</p>
        </section>

        <hr />

        <section className="guidelines-section">
          <h3>Writing Guidelines</h3>
          <p>The following content is not permitted and will be removed from Type-Away-Writer:</p>
          <ul>
            <li>Plagiarised content.</li>
            <li>Content that promotes the sale of any services.</li>
            <li>Illegal content that are not child-friendly.</li>
            <li>Content that promotes or incites illegal crimes, violent acts, or terrorism.</li>
          </ul>
          <p>
            We assess each submission on its own and may choose to not approve and/or remove content
            at any time if it is deemed inappropriate for our community.
          </p>
        </section>

        <hr />

        <section className="guidelines-section">
          <h3>Report Community Violations</h3>
          <p>
            Submitting reports on content that is against Type-Away-Writer's guidelines allows
            everyone on our platform to feel safe. If you see anything that is questionable, please
            use the Report button or let us know at support@typeawaywriter.com.
          </p>
          <p>For reference, Type-Away-Writer does not allow:</p>
          <ul>
            <li>Spam posts.</li>
            <li>Content offering fraudulent goods, services, schemes, or promotions.</li>
            <li>Bullying and harassment.</li>
            <li>Hate speech, based on race, ethnicity, religious affiliation, sexual orientation, sex, gender, gender identity and serious disease or disability.</li>
            <li>Promotion of violence towards others (including terrorist activity).</li>
            <li>Self-harm or content glorifying suicide.</li>
            <li>Pornographic or nude images.</li>
            <li>Content glorifying any form of abuse or violence against animals or people.</li>
            <li>Intellectual property violations and plagiarism by other Type-Away-Writer authors.</li>
            <li>Translations, adaptations, or re-uploads, whether authorized or unauthorized, that are not of your own original authorship.</li>
            <li>Impersonating other people or organizations.</li>
            <li>Stories that describe sexual or adult-oriented themes with minors (under the age of 18).</li>
          </ul>
          <p>
            If you see anything listed above, you can report it, along with anything else that may
            appear concerning. When you report something on the platform please give us additional
            information, to help our team resolve issues as swiftly as possible. For example, if you
            are reporting a story, include the story name and the reasons for your report.
          </p>
          <p>
            The Type-Away-Writer support team works hard to review and resolve all claims reported.
            Each report is investigated inline with Type-Away-Writer's guidelines and can result in
            the removal of specific content or entire user accounts if deemed necessary by our team.
            Please note, all reports come to us at Type-Away-Writer directly, not the user in
            question. We also give people control over their own experience by allowing them to block
            other users. With your help, we can make sure all our authors and readers have an
            enjoyable experience.
          </p>
        </section>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default Guidelines;