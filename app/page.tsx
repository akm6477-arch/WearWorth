import Link from "next/link";

import ProductCard from "@/app/components/ProductCard";
import { getCatalogProducts } from "@/lib/catalog";

const values = [
  {
    number: "01",
    title: "Identity",
    text: "What you wear should reveal something real, not repeat what everyone else is wearing.",
  },
  {
    number: "02",
    title: "Belonging",
    text: "Great clothing helps people recognize their tribe, their mood and their shared story.",
  },
  {
    number: "03",
    title: "Becoming",
    text: "Every piece can represent the person you are growing into, not only the person you were.",
  },
];

const chapters = [
  {
    title: "Built From Broken",
    text: "For the people who rebuilt themselves quietly.",
  },
  {
    title: "Dreams Don't Sleep",
    text: "For late nights, first attempts and impossible plans.",
  },
  {
    title: "Quiet Power",
    text: "For confidence that does not need permission.",
  },
];

export default async function Home() {
  const catalogResult = await getCatalogProducts({
    featuredOnly: true,
    sort: "featured",
  });
  const featuredProducts = catalogResult.products.slice(0, 4);

  return (
    <main>
      <section className="home-hero">
        <div className="home-hero-noise" />
        <div className="home-hero-circle home-hero-circle-one" />
        <div className="home-hero-circle home-hero-circle-two" />

        <div className="container home-hero-grid">
          <div className="home-hero-content">
            <p className="eyebrow">WEARWORTH - HUMAN STORIES IN MOTION</p>

            <h1>
              Wear more than
              <span>clothes.</span>
              Wear your worth.
            </h1>

            <p className="home-hero-description">
              Fashion is often treated like decoration. We see it differently.
              WearWorth creates pieces inspired by courage, identity, struggle,
              humour, ambition and the person you are still becoming.
            </p>

            <div className="home-hero-actions">
              <Link href="/products" className="button primary">
                SHOP THE FIRST DROP
              </Link>

              <Link href="/about" className="button ghost">
                READ OUR STORY
              </Link>
            </div>

            <div className="home-hero-proof">
              <div>
                <strong>Original</strong>
                <span>Human-led concepts</span>
              </div>
              <div>
                <strong>Purposeful</strong>
                <span>Meaning in every design</span>
              </div>
              <div>
                <strong>Made to connect</strong>
                <span>Not made to blend in</span>
              </div>
            </div>
          </div>

          <div className="home-hero-visual">
            <div className="hero-poster">
              <p>THE FIRST CHAPTER</p>

              <div className="hero-poster-word">
                STILL
                <span>BECOMING</span>
              </div>

              <blockquote>
                "The world may decide your price. Only you decide your worth."
              </blockquote>
            </div>

            <div className="hero-stamp">
              <span>WEAR</span>
              <strong>WORTH</strong>
              <small>EST. 2026</small>
            </div>

            <div className="hero-side-note">
              <span>01</span>
              <p>
                Clothing for people who are building a life they once only imagined.
              </p>
            </div>
          </div>
        </div>

        <div className="hero-scroll-note">
          <span>SCROLL TO DISCOVER</span>
          <div />
        </div>
      </section>

      <section className="brand-ticker">
        <div className="brand-ticker-track">
          <span>IDENTITY</span>
          <b>+</b>
          <span>COURAGE</span>
          <b>+</b>
          <span>BELONGING</span>
          <b>+</b>
          <span>DREAMS</span>
          <b>+</b>
          <span>SELF-WORTH</span>
          <b>+</b>
          <span>STILL BECOMING</span>
          <b>+</b>
        </div>
      </section>

      <section className="home-intro container">
        <div className="home-intro-label">
          <span>01</span>
          <p>WHY WE EXIST</p>
        </div>

        <div className="home-intro-copy">
          <h2>
            People do not remember what a brand sells.
            <em>They remember how it makes them feel.</em>
          </h2>

          <p>
            WearWorth is built around a simple truth: people want to be seen,
            understood and remembered. Our clothing turns inner stories into
            visible symbols, something you can wear, share and belong to.
          </p>

          <Link href="/about">DISCOVER THE PHILOSOPHY -&gt;</Link>
        </div>
      </section>

      <section className="chapter-section">
        <div className="container">
          <div className="section-head premium-section-head">
            <div>
              <p className="eyebrow">SHOP BY HUMAN CHAPTER</p>
              <h2>Find the story that feels like yours.</h2>
            </div>

            <Link href="/products">EXPLORE EVERYTHING -&gt;</Link>
          </div>

          <div className="chapter-grid">
            {chapters.map((chapter, index) => (
              <Link
                href="/products"
                className={`chapter-card chapter-card-${index + 1}`}
                key={chapter.title}
              >
                <span>0{index + 1}</span>

                <div>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.text}</p>
                  <strong>EXPLORE CHAPTER -&gt;</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section container featured-section">
        <div className="section-head premium-section-head">
          <div>
            <p className="eyebrow">THE FIRST DROP</p>
            <h2>Statements you can live in.</h2>
          </div>

          <Link href="/products">VIEW ALL PRODUCTS -&gt;</Link>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="manifesto-section">
        <div className="container manifesto-grid">
          <div className="manifesto-number">02</div>

          <div className="manifesto-copy">
            <p className="eyebrow">THE WEARWORTH MANIFESTO</p>

            <h2>
              I am not what the world priced me at.
              <span>I am what I chose to become.</span>
            </h2>
          </div>

          <div className="manifesto-text">
            <p>I have been doubted, compared, rejected and misunderstood.</p>
            <p>Still, I kept becoming.</p>
            <p>
              I wear my scars without apology. I wear my dreams before they become
              real. I wear the courage to be seen as I truly am.
            </p>

            <Link href="/about">READ THE FULL MANIFESTO -&gt;</Link>
          </div>
        </div>
      </section>

      <section className="values-section container">
        <div className="values-heading">
          <p className="eyebrow">DESIGNED AROUND HUMAN NEEDS</p>
          <h2>Three reasons people connect with what they wear.</h2>
        </div>

        <div className="values-list">
          {values.map((value) => (
            <article key={value.number}>
              <span>{value.number}</span>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="community-banner">
        <div className="container community-banner-grid">
          <div>
            <p className="eyebrow">THE HUMAN WALL</p>
            <h2>Your story deserves more than a caption.</h2>
          </div>

          <div>
            <p>
              Soon, WearWorth customers will be able to share the belief, battle,
              dream or memory behind what they wear. Every product will become part
              of a living community instead of a silent catalogue.
            </p>

            <Link href="/about" className="button light-button">
              JOIN THE MOVEMENT
            </Link>
          </div>
        </div>
      </section>

      <section className="newsletter-section container">
        <div>
          <p className="eyebrow">ENTER THE INNER CIRCLE</p>
          <h2>Wear the next chapter before everyone else.</h2>
        </div>

        <form className="newsletter-form">
          <input
            type="email"
            placeholder="Enter your email address"
            aria-label="Email address"
          />

          <button type="submit">JOIN WEARWORTH</button>
        </form>
      </section>
    </main>
  );
}
