import Link from "next/link";

const collections = [
  {
    number: "01",
    title: "Built From Broken",
    subtitle: "For the people who rebuilt themselves without applause.",
    quote: "What tried to end me became part of what built me.",
    tone: "Dark resilience",
    href: "/products",
  },
  {
    number: "02",
    title: "Dreams Don’t Sleep",
    subtitle: "For late nights, first attempts and impossible plans.",
    quote: "Some dreams only survive because someone refuses to rest.",
    tone: "Restless ambition",
    href: "/products",
  },
  {
    number: "03",
    title: "Quiet Power",
    subtitle: "For strength that does not need to announce itself.",
    quote: "Not every powerful person needs to be loud.",
    tone: "Calm confidence",
    href: "/products",
  },
  {
    number: "04",
    title: "Still Becoming",
    subtitle: "For anyone who knows their story is not finished.",
    quote: "I am not behind. I am still becoming.",
    tone: "Growth and possibility",
    href: "/products",
  },
  {
    number: "05",
    title: "Own Your Story",
    subtitle: "For people who stopped apologising for who they are.",
    quote: "My story does not need permission to exist.",
    tone: "Identity and truth",
    href: "/products",
  },
  {
    number: "06",
    title: "No Permission Needed",
    subtitle: "For those who choose themselves before approval arrives.",
    quote: "I stopped waiting for the world to understand me.",
    tone: "Defiant freedom",
    href: "/products",
  },
];

const principles = [
  {
    number: "01",
    title: "A feeling comes first",
    text: "Every collection starts with a real human emotion before it becomes a graphic, garment or campaign.",
  },
  {
    number: "02",
    title: "The product carries the story",
    text: "The design, copy, colour, fabric and photography should all support one emotional idea.",
  },
  {
    number: "03",
    title: "The customer completes it",
    text: "A collection becomes meaningful when someone connects it to their own memory, dream or journey.",
  },
];

export default function CollectionsPage() {
  return (
    <main className="collections-page">
      <section className="collections-hero">
        <div className="container collections-hero-grid">
          <div className="collections-hero-copy">
            <p className="eyebrow">WEARWORTH COLLECTIONS</p>

            <h1>
              Shop by
              <span>human chapter.</span>
            </h1>

            <p>
              Most fashion collections begin with trends. Ours begin with
              feelings people carry but do not always know how to express.
            </p>

            <div className="collections-hero-actions">
              <Link href="#collection-list" className="button primary">
                EXPLORE CHAPTERS
              </Link>

              <Link href="/about" className="button ghost">
                READ THE PHILOSOPHY
              </Link>
            </div>
          </div>

          <div className="collections-hero-art">
            <div className="collections-poster">
              <p>WEARWORTH ARCHIVE — VOLUME 01</p>

              <div className="collections-poster-title">
                HUMAN
                <span>CHAPTERS</span>
              </div>

              <blockquote>
                “We do not design around seasons. We design around what people
                are living through.”
              </blockquote>

              <small>FIRST EDITION — 2026</small>
            </div>

            <div className="collections-orbit collections-orbit-one" />
            <div className="collections-orbit collections-orbit-two" />

            <div className="collections-stamp">
              <span>06</span>
              <strong>STORIES</strong>
              <small>ONE BRAND</small>
            </div>
          </div>
        </div>
      </section>

      <section className="collections-intro container">
        <div className="about-section-label">
          <span>01</span>
          <p>WHY CHAPTERS</p>
        </div>

        <div className="collections-intro-copy">
          <h2>
            A product tells you what it is.
            <em>A chapter tells you why it matters.</em>
          </h2>

          <p>
            WearWorth collections are built as emotional worlds. Every chapter
            has its own voice, visual language, message and community. The
            clothing is not the entire story. It is the symbol people carry
            with them.
          </p>
        </div>
      </section>

      <section id="collection-list" className="collection-list-section">
        <div className="container">
          <div className="section-head premium-section-head">
            <div>
              <p className="eyebrow">THE CURRENT ARCHIVE</p>
              <h2>Choose the chapter that feels like yours.</h2>
            </div>

            <Link href="/products">SHOP ALL PRODUCTS →</Link>
          </div>

          <div className="collection-list">
            {collections.map((collection, index) => (
              <article
                className={`collection-row collection-row-${index + 1}`}
                key={collection.title}
              >
                <div className="collection-row-number">
                  {collection.number}
                </div>

                <div className="collection-row-copy">
                  <p>{collection.tone}</p>
                  <h3>{collection.title}</h3>
                  <span>{collection.subtitle}</span>
                </div>

                <blockquote>{collection.quote}</blockquote>

                <Link href={collection.href}>EXPLORE CHAPTER →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="collections-featured">
        <div className="container collections-featured-grid">
          <div className="collections-featured-visual">
            <div className="featured-chapter-card">
              <span>FEATURED CHAPTER</span>

              <h2>
                Still
                <em>Becoming</em>
              </h2>

              <p>
                For people whose lives do not look finished yet—and who no
                longer see that as failure.
              </p>

              <Link href="/products">SHOP THE CHAPTER →</Link>
            </div>

            <div className="featured-chapter-note">
              <span>04</span>

              <p>
                Growth rarely looks graceful while it is happening. That does
                not make it less meaningful.
              </p>
            </div>
          </div>

          <div className="collections-featured-copy">
            <p className="eyebrow">A CLOSER LOOK</p>

            <h2>
              Clothing for the unfinished version of you.
            </h2>

            <p>
              “Still Becoming” is built around the idea that progress does not
              need to look impressive from the outside. It is for uncertain
              beginnings, quiet discipline, second chances and the courage to
              keep moving without proof that everything will work.
            </p>

            <div className="collections-featured-details">
              <div>
                <span>MOOD</span>
                <strong>Hopeful / Raw / Reflective</strong>
              </div>

              <div>
                <span>COLOURS</span>
                <strong>Midnight, Stone, Bone, Acid</strong>
              </div>

              <div>
                <span>PRODUCTS</span>
                <strong>Tees, Hoodies, Shirts, Joggers</strong>
              </div>
            </div>

            <Link href="/products" className="button primary">
              DISCOVER STILL BECOMING
            </Link>
          </div>
        </div>
      </section>

      <section className="collections-principles container">
        <div className="collections-principles-heading">
          <p className="eyebrow">HOW A CHAPTER IS BUILT</p>

          <h2>Three layers behind every WearWorth collection.</h2>
        </div>

        <div className="collections-principles-list">
          {principles.map((principle) => (
            <article key={principle.number}>
              <span>{principle.number}</span>

              <h3>{principle.title}</h3>

              <p>{principle.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="collections-cta">
        <div className="container collections-cta-grid">
          <div>
            <p className="eyebrow">YOUR CHAPTER MAY BE NEXT</p>

            <h2>
              Some stories deserve
              <span>to become wearable.</span>
            </h2>
          </div>

          <div>
            <p>
              In the future, WearWorth will invite its community to help shape
              new chapters from real experiences, emotions and turning points.
            </p>

            <Link href="/about" className="button light-button">
              DISCOVER THE HUMAN WALL
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}