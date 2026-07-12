import Link from "next/link";

const beliefs = [
  {
    number: "01",
    title: "Worth is not a price",
    text: "The world often measures people through salary, status, appearance and approval. WearWorth exists to challenge that idea. Your worth is not something the world gets to calculate.",
  },
  {
    number: "02",
    title: "Clothing can carry meaning",
    text: "A garment can remind someone of a struggle survived, a dream protected or a version of themselves they are still becoming.",
  },
  {
    number: "03",
    title: "Identity deserves expression",
    text: "People do not only dress for attention. They dress to feel aligned with themselves. We create pieces that help inner identity become visible.",
  },
  {
    number: "04",
    title: "Belonging should not require conformity",
    text: "Real community does not ask people to become identical. It gives different people a reason to recognise, respect and understand one another.",
  },
];

const chapters = [
  {
    title: "Built From Broken",
    text: "For the person who had to rebuild without applause.",
  },
  {
    title: "Dreams Don’t Sleep",
    text: "For the people working while the world is resting.",
  },
  {
    title: "Quiet Power",
    text: "For strength that does not need to announce itself.",
  },
  {
    title: "Still Becoming",
    text: "For anyone who refuses to believe their story is finished.",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-grid container">
          <div className="about-hero-copy">
            <p className="eyebrow">THE WEARWORTH PHILOSOPHY</p>

            <h1>
              Worth was never
              <span>a price tag.</span>
            </h1>

            <p className="about-hero-lead">
              WearWorth is a fashion brand built around one human truth:
              people do not only wear fabric. They wear memory, courage,
              identity, belonging and possibility.
            </p>

            <Link href="/products" className="button primary">
              EXPLORE THE FIRST DROP
            </Link>
          </div>

          <div className="about-hero-art">
            <div className="about-quote-card">
              <p>THE WEARWORTH BELIEF</p>

              <blockquote>
                “The world may decide your price. Only you decide your worth.”
              </blockquote>

              <span>WEARWORTH — 2026</span>
            </div>

            <div className="about-word-mark">
              <span>W</span>
              <strong>WORTH</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="about-origin container">
        <div className="about-section-label">
          <span>01</span>
          <p>WHY WE EXIST</p>
        </div>

        <div className="about-origin-copy">
          <h2>
            Fashion is often used to impress strangers.
            <em>We want it to remind you who you are.</em>
          </h2>

          <div className="about-origin-columns">
            <p>
              WearWorth began with a question: why do so many clothing brands
              speak loudly about style but say so little about the person
              wearing it?
            </p>

            <p>
              We believe clothing can become a personal symbol. It can remind
              someone that they survived, that they still belong, that their
              dreams remain valid or that their story is not finished.
            </p>
          </div>
        </div>
      </section>

      <section className="about-manifesto">
        <div className="container about-manifesto-grid">
          <div>
            <p className="eyebrow">THE MANIFESTO</p>

            <span className="about-manifesto-number">02</span>
          </div>

          <div className="about-manifesto-copy">
            <p>I am not what the world priced me at.</p>
            <p>I am not my rejection.</p>
            <p>I am not the mistake I made.</p>
            <p>I am not the opinion that tried to reduce me.</p>

            <strong>I am what I survived.</strong>
            <strong>I am what I believe.</strong>
            <strong>I am what I am still becoming.</strong>

            <blockquote>
              I do not wear clothes to disappear into the crowd. I wear them
              as evidence that my story belongs in the world.
            </blockquote>
          </div>
        </div>
      </section>

      <section className="about-beliefs container">
        <div className="about-beliefs-heading">
          <p className="eyebrow">WHAT WE BELIEVE</p>

          <h2>Four ideas behind every WearWorth chapter.</h2>
        </div>

        <div className="about-beliefs-list">
          {beliefs.map((belief) => (
            <article key={belief.number}>
              <span>{belief.number}</span>

              <h3>{belief.title}</h3>

              <p>{belief.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-chapters">
        <div className="container">
          <div className="premium-section-head section-head">
            <div>
              <p className="eyebrow">HUMAN CHAPTERS</p>

              <h2>Collections inspired by real emotional journeys.</h2>
            </div>

            <Link href="/products">SHOP ALL CHAPTERS →</Link>
          </div>

          <div className="about-chapter-list">
            {chapters.map((chapter, index) => (
              <article key={chapter.title}>
                <span>0{index + 1}</span>

                <div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.text}</p>
                </div>

                <Link href="/products">EXPLORE →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-community container">
        <div className="about-section-label">
          <span>03</span>
          <p>THE HUMAN WALL</p>
        </div>

        <div className="about-community-copy">
          <h2>
            Customers should not be treated like traffic.
            <em>They should become part of the story.</em>
          </h2>

          <p>
            Our future Human Wall will allow people to share the personal
            meaning behind what they wear: a first job, a difficult recovery,
            a new beginning, a friendship, a loss, a dream or a moment of
            courage.
          </p>

          <p>
            The goal is not to collect empty social proof. The goal is to
            create recognition between real people.
          </p>
        </div>
      </section>

      <section className="about-final">
        <div className="container about-final-grid">
          <div>
            <p className="eyebrow">THIS IS ONLY THE BEGINNING</p>

            <h2>
              Wear what you survived.
              <span>Wear what you dream.</span>
            </h2>
          </div>

          <div>
            <p>
              WearWorth is being built for people who refuse to let the world
              define their value.
            </p>

            <Link href="/products" className="button light-button">
              WEAR YOUR WORTH
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}