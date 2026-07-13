import type { Metadata } from "next";

import SupportPage from "@/app/components/SupportPage";

export const metadata: Metadata = {
  title: "Returns",
  description:
    "WearWorth return and exchange information pending final owner approval.",
};

const sections = [
  {
    title: "Policy status",
    body:
      "This page is ready for the store route, but the final return, exchange, and cancellation rules must be approved by the owner before launch.",
  },
  {
    title: "Rules still to confirm",
    items: [
      "Return and exchange window.",
      "Whether opened, washed, damaged, discounted, or custom products are eligible.",
      "Pickup, reverse-shipping charge, refund, replacement, and store-credit process.",
      "Cancellation rules after an order is packed or shipped.",
    ],
  },
  {
    title: "Implemented account flow",
    items: [
      "Customers can view their own orders from the Orders page.",
      "Admin users can update order status from protected admin APIs.",
      "A dedicated return/exchange request model is not implemented yet.",
    ],
  },
];

export default function ReturnsPage() {
  return (
    <SupportPage
      eyebrow="CUSTOMER CARE"
      title="Returns"
      lead="A dedicated return route now exists, with final policy details separated from code until the business rules are approved."
      status="Final return policy copy requires owner/legal review."
      sections={sections}
      ctaHref="/orders"
      ctaLabel="VIEW ORDERS"
    />
  );
}
