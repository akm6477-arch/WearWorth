import type { Metadata } from "next";

import SupportPage from "@/app/components/SupportPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "WearWorth privacy policy route pending final legal review.",
};

const sections = [
  {
    title: "Legal review required",
    body:
      "This route exists so the site does not send customers to a missing page. Final privacy policy wording must be supplied or approved by the owner/legal reviewer before launch.",
  },
  {
    title: "Data areas used by the app",
    items: [
      "Account profile information.",
      "Saved delivery addresses.",
      "Order records and order items.",
      "Authentication cookies that are HTTP-only and secure in production.",
      "Local browser cart and wishlist data.",
    ],
  },
  {
    title: "Policy details still to approve",
    items: [
      "Data retention periods.",
      "Support contact for privacy requests.",
      "Third-party service disclosures, including hosting, database, Cloudinary, and future email/payment providers.",
      "User rights, deletion requests, and grievance contact details.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <SupportPage
      eyebrow="LEGAL"
      title="Privacy Policy"
      lead="The privacy route is now available, with final policy copy intentionally left for owner/legal approval."
      status="Final legal wording required before public launch."
      sections={sections}
      ctaHref="/profile"
      ctaLabel="OPEN PROFILE"
    />
  );
}
