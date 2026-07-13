import type { Metadata } from "next";

import SupportPage from "@/app/components/SupportPage";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "WearWorth terms and conditions route pending final legal review.",
};

const sections = [
  {
    title: "Legal review required",
    body:
      "This route exists for site structure and navigation. Final terms and conditions must be supplied or approved by the owner/legal reviewer before launch.",
  },
  {
    title: "Terms still to define",
    items: [
      "Order acceptance and cancellation conditions.",
      "Pricing, stock, and product-display error handling.",
      "Shipping, returns, exchanges, refunds, and COD rules.",
      "Account responsibilities and prohibited usage.",
      "Liability, dispute, and governing-law clauses.",
    ],
  },
  {
    title: "Current technical behavior",
    items: [
      "Orders are created server-side only after validation.",
      "Browser-submitted prices and totals are not trusted by the order API.",
      "Only active products are public and purchasable.",
    ],
  },
];

export default function TermsPage() {
  return (
    <SupportPage
      eyebrow="LEGAL"
      title="Terms"
      lead="The terms route is now available, while final business and legal clauses remain explicitly pending."
      status="Final terms copy required before public launch."
      sections={sections}
      ctaHref="/products"
      ctaLabel="BROWSE PRODUCTS"
    />
  );
}
