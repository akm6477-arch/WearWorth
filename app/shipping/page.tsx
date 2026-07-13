import type { Metadata } from "next";

import SupportPage from "@/app/components/SupportPage";

export const metadata: Metadata = {
  title: "Shipping",
  description:
    "WearWorth shipping methods, delivery estimates, and checkout delivery notes.",
};

const sections = [
  {
    title: "Delivery methods",
    items: [
      "Standard delivery is estimated at 4-7 business days.",
      "Express delivery is estimated at 2-3 business days.",
      "The final shipping charge is shown during checkout before the order is placed.",
    ],
  },
  {
    title: "Current launch payment flow",
    items: [
      "WearWorth currently supports Cash on Delivery orders.",
      "Every order is created server-side after product, size, color, price, and stock validation.",
      "Online gateway payments are intentionally not enabled yet.",
    ],
  },
  {
    title: "Owner review still needed",
    items: [
      "Courier partners, serviceable pincodes, delay handling, and free-shipping rules should be confirmed before launch.",
      "Any final promise shown to customers should match the actual operations process.",
    ],
  },
];

export default function ShippingPage() {
  return (
    <SupportPage
      eyebrow="CUSTOMER CARE"
      title="Shipping"
      lead="Delivery information for WearWorth orders, aligned with the checkout flow already active in the store."
      sections={sections}
      ctaHref="/checkout"
      ctaLabel="GO TO CHECKOUT"
    />
  );
}
