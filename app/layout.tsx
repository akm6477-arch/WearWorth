import type { Metadata } from "next";

import "./globals.css";
import "./styles/product-detail.css";
import "./styles/wishlist.css";
import "./styles/auth.css";
import "./styles/cart.css";
import "./styles/checkout.css";
import "./styles/profile.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { CartProvider } from "@/app/context/CartContext";
import { WishlistProvider } from "@/app/context/WishlistContext";
import Navbar from "@/app/components/Navbar";

export const metadata: Metadata = {
  title: {
    default: "WearWorth — Wear What You Are Worth",
    template: "%s | WearWorth",
  },
  description:
    "Identity-led fashion for people who wear their truth, dreams, courage and self-worth.",
  keywords: [
    "WearWorth",
    "fashion",
    "streetwear",
    "oversized t-shirts",
    "graphic t-shirts",
    "hoodies",
    "identity fashion",
    "Indian clothing brand",
  ],
  authors: [
    {
      name: "WearWorth",
    },
  ],
  creator: "WearWorth",
  publisher: "WearWorth",
  openGraph: {
    title: "WearWorth — Wear What You Are Worth",
    description:
      "Clothing inspired by identity, courage, dreams and the person you are becoming.",
    type: "website",
    locale: "en_IN",
    siteName: "WearWorth",
  },
  twitter: {
    card: "summary_large_image",
    title: "WearWorth — Wear What You Are Worth",
    description:
      "Clothing inspired by identity, courage, dreams and the person you are becoming.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Navbar />

              {children}

              <footer className="wearworth-footer">
                <div className="container wearworth-footer-grid">
                  <div className="footer-brand-column">
                    <p className="footer-eyebrow">WEARWORTH</p>

                    <h2>
                      Wear what you survived.
                      <span>Wear what you dream.</span>
                    </h2>

                    <p className="footer-brand-description">
                      Clothing for people who refuse to let the world decide
                      their worth.
                    </p>
                  </div>

                  <div className="footer-links-column">
                    <p className="footer-column-title">SHOP</p>

                    <a href="/products">New Drops</a>
                    <a href="/products">Men</a>
                    <a href="/products">Women</a>
                    <a href="/collections">Collections</a>
                  </div>

                  <div className="footer-links-column">
                    <p className="footer-column-title">WEARWORTH</p>

                    <a href="/about">Our Philosophy</a>
                    <a href="/about">Our Story</a>
                    <a href="/about">Human Wall</a>
                    <a href="/about">Contact</a>
                  </div>

                  <div className="footer-links-column">
                    <p className="footer-column-title">CUSTOMER CARE</p>

                    <a href="/about">Shipping</a>
                    <a href="/about">Returns</a>
                    <a href="/about">Size Guide</a>
                    <a href="/about">FAQs</a>
                  </div>
                </div>

                <div className="container wearworth-footer-bottom">
                  <p>
                    Made for identity, belonging and self-expression.
                  </p>

                  <small>
                    © 2026 WearWorth. All rights reserved.
                  </small>
                </div>
              </footer>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}