import type { Metadata } from "next";

import SupportPage from "@/app/components/SupportPage";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "WearWorth size guide route with measurement guidance pending final chart approval.",
};

const sections = [
  {
    title: "How to choose a size",
    items: [
      "Check the sizes shown on the product page before adding an item to your bag.",
      "Measure a similar garment you already like and compare chest, length, and shoulder fit.",
      "For oversized styles, choose based on the fit you want instead of only your usual size label.",
    ],
  },
  {
    title: "Measurements to confirm",
    items: [
      "Chest or body width.",
      "Body length.",
      "Shoulder width.",
      "Sleeve length where relevant.",
    ],
  },
  {
    title: "Owner review still needed",
    items: [
      "Final product measurement charts must be added for each garment category.",
      "Size advice should be checked against real samples before launch.",
    ],
  },
];

export default function SizeGuidePage() {
  return (
    <SupportPage
      eyebrow="CUSTOMER CARE"
      title="Size Guide"
      lead="Basic fit guidance is now available, while exact measurement tables remain ready for owner-approved product data."
      status="Measurement tables pending owner-approved sample data."
      sections={sections}
    />
  );
}
