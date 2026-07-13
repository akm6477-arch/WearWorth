import type { Metadata } from "next";

import SupportPage from "@/app/components/SupportPage";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Frequently asked questions about WearWorth orders, accounts, delivery, and checkout.",
};

const sections = [
  {
    title: "Can I pay online?",
    body:
      "Not yet. WearWorth currently supports Cash on Delivery only. Gateway payments are intentionally pending until a verified server-side payment flow is added.",
  },
  {
    title: "Where can I see my orders?",
    body:
      "After signing in, customers can open the Orders page to see their own order history and order details.",
  },
  {
    title: "Can I save addresses?",
    body:
      "Yes. Signed-in customers can add, edit, delete, and set a default saved address from the Addresses page.",
  },
  {
    title: "Why did checkout reject my cart?",
    body:
      "Checkout re-validates products, active status, size, color, price, and stock on the server before creating an order. If stock or product data changed, checkout asks you to review the bag again.",
  },
  {
    title: "Do draft products appear publicly?",
    body:
      "No. Public catalogue APIs only show active products. Draft products stay hidden from storefront customers.",
  },
];

export default function FAQsPage() {
  return (
    <SupportPage
      eyebrow="CUSTOMER CARE"
      title="FAQs"
      lead="Quick answers based on the store features currently implemented in WearWorth."
      sections={sections}
      ctaHref="/profile"
      ctaLabel="OPEN ACCOUNT"
    />
  );
}
