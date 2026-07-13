import type { Metadata } from "next";

import SupportPage from "@/app/components/SupportPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact and support route for WearWorth customer-care information.",
};

const sections = [
  {
    title: "Support route ready",
    body:
      "This contact page is now available from the footer. Add the official support email, phone, WhatsApp, address, and response hours after the owner confirms them.",
  },
  {
    title: "For order help",
    items: [
      "Sign in with the same account used to place the order.",
      "Open Orders and keep your order number ready.",
      "Do not share passwords, payment secrets, or one-time codes in support messages.",
    ],
  },
  {
    title: "Still to connect",
    items: [
      "A real contact form or support inbox integration.",
      "Official customer-care email and phone number.",
      "Store address and business registration details if required.",
    ],
  },
];

export default function ContactPage() {
  return (
    <SupportPage
      eyebrow="WEARWORTH CARE"
      title="Contact"
      lead="A proper support route is now in place, ready for the brand's official contact details."
      status="Official support contact details still need owner confirmation."
      sections={sections}
      ctaHref="/orders"
      ctaLabel="VIEW ORDERS"
    />
  );
}
