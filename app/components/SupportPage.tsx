import Link from "next/link";

interface SupportPageSection {
  title: string;
  body?: string;
  items?: string[];
}

interface SupportPageProps {
  eyebrow: string;
  title: string;
  lead: string;
  status?: string;
  sections: SupportPageSection[];
  ctaHref?: string;
  ctaLabel?: string;
}

export default function SupportPage({
  eyebrow,
  title,
  lead,
  status,
  sections,
  ctaHref = "/products",
  ctaLabel = "SHOP WEARWORTH",
}: SupportPageProps) {
  return (
    <main className="support-page">
      <section className="support-hero">
        <div className="container support-hero-grid">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{lead}</p>

            <div className="support-hero-actions">
              <Link href={ctaHref} className="button primary">
                {ctaLabel}
              </Link>
              <Link href="/contact" className="button ghost">
                CONTACT SUPPORT
              </Link>
            </div>
          </div>

          <aside className="support-status-card">
            <span>WEARWORTH CARE</span>
            <strong>
              {status ||
                "Launch-ready route. Final owner review recommended."}
            </strong>
          </aside>
        </div>
      </section>

      <section className="container support-content">
        <div className="support-section-list">
          {sections.map((section, index) => (
            <article key={section.title} className="support-section-card">
              <span>{String(index + 1).padStart(2, "0")}</span>

              <div>
                <h2>{section.title}</h2>
                {section.body ? <p>{section.body}</p> : null}
                {section.items ? (
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
