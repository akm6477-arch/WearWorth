"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { count } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, loading, logout } = useAuth();

  const firstName =
    user?.name.trim().split(/\s+/)[0] || "My Account";

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
  };

  return (
    <>
      <div className="announcement-bar">
        <p>
          FREE SHIPPING ON ORDERS ABOVE Rs.999
          <span>+</span>
          THE FIRST CHAPTER IS NOW LIVE
          <span>+</span>
          WEAR YOUR WORTH
        </p>
      </div>

      <header className="premium-navbar">
        <nav className="premium-nav container">
          <button
            type="button"
            className="nav-mobile-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={23} />
          </button>

          <Link
            href="/"
            className="premium-brand"
            onClick={closeMenu}
            aria-label="WearWorth homepage"
          >
            <Image
              src="/images/wearworth-logo.jpeg"
              width={48}
              height={48}
              alt="WearWorth logo"
              priority
            />

            <div>
              <strong>WEARWORTH</strong>
              <span>WEAR YOUR STORY</span>
            </div>
          </Link>

          <div className="premium-nav-links">
            <Link href="/products">NEW DROPS</Link>

            <div className="nav-dropdown">
              <Link href="/products">MEN</Link>

              <div className="nav-dropdown-menu">
                <div>
                  <p>SHOP MEN</p>

                  <Link href="/products">Oversized T-Shirts</Link>
                  <Link href="/products">Graphic T-Shirts</Link>
                  <Link href="/products">Shirts</Link>
                  <Link href="/products">Hoodies</Link>
                  <Link href="/products">Joggers</Link>
                </div>

                <div>
                  <p>SHOP BY STORY</p>

                  <Link href="/products">Built From Broken</Link>
                  <Link href="/products">Dreams Don&apos;t Sleep</Link>
                  <Link href="/products">Quiet Power</Link>
                  <Link href="/products">Still Becoming</Link>
                </div>

                <div className="nav-feature-card">
                  <span>FIRST DROP</span>
                  <h3>Clothing for people becoming more.</h3>
                  <Link href="/products">EXPLORE NOW -&gt;</Link>
                </div>
              </div>
            </div>

            <div className="nav-dropdown">
              <Link href="/products">WOMEN</Link>

              <div className="nav-dropdown-menu nav-dropdown-menu-women">
                <div>
                  <p>SHOP WOMEN</p>

                  <Link href="/products">Oversized T-Shirts</Link>
                  <Link href="/products">Graphic T-Shirts</Link>
                  <Link href="/products">Crop Tops</Link>
                  <Link href="/products">Hoodies</Link>
                  <Link href="/products">Joggers</Link>
                </div>

                <div>
                  <p>SHOP BY FEELING</p>

                  <Link href="/products">Self-Worth</Link>
                  <Link href="/products">Soft Strength</Link>
                  <Link href="/products">No Permission Needed</Link>
                  <Link href="/products">Own Your Story</Link>
                </div>

                <div className="nav-feature-card nav-feature-card-light">
                  <span>WEARWORTH WOMEN</span>
                  <h3>Designed for confidence without explanation.</h3>
                  <Link href="/products">DISCOVER -&gt;</Link>
                </div>
              </div>
            </div>

            <Link href="/collections">COLLECTIONS</Link>
            <Link href="/about">OUR PHILOSOPHY</Link>
            {user?.role === "ADMIN" && (
              <Link href="/admin">ADMIN</Link>
            )}
          </div>

          <div className="premium-nav-actions">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search products"
            >
              <Search size={20} />
            </button>

            <Link
              href="/wishlist"
              className="premium-wishlist-link"
              aria-label="Wishlist"
            >
              <Heart size={20} />
              {wishlistCount > 0 && <span>{wishlistCount}</span>}
            </Link>

            {loading ? (
              <span
                className="premium-account-skeleton"
                aria-hidden="true"
              />
            ) : user ? (
              <Link
                href="/profile"
                className="premium-account-link"
                aria-label="My account"
              >
                <UserRound size={20} />
                <span>{firstName}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="premium-account-link"
                aria-label="Sign in"
              >
                <UserRound size={20} />
                <span>Sign In</span>
              </Link>
            )}

            <Link
              href="/cart"
              className="premium-cart"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={21} />
              {count > 0 && <span>{count}</span>}
            </Link>
          </div>
        </nav>
      </header>

      <div
        className={`mobile-drawer ${menuOpen ? "mobile-drawer-open" : ""}`}
      >
        <button
          type="button"
          className="mobile-drawer-overlay"
          onClick={closeMenu}
          aria-label="Close menu"
        />

        <aside className="mobile-drawer-panel">
          <div className="mobile-drawer-header">
            <Link
              href="/"
              className="mobile-drawer-brand"
              onClick={closeMenu}
            >
              <Image
                src="/images/wearworth-logo.jpeg"
                width={46}
                height={46}
                alt="WearWorth logo"
              />

              <div>
                <strong>WEARWORTH</strong>
                <span>WEAR YOUR STORY</span>
              </div>
            </Link>

            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close navigation menu"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mobile-drawer-links">
            <Link href="/products" onClick={closeMenu}>
              <span>01</span>
              New Drops
            </Link>

            <Link href="/products" onClick={closeMenu}>
              <span>02</span>
              Men
            </Link>

            <Link href="/products" onClick={closeMenu}>
              <span>03</span>
              Women
            </Link>

            <Link href="/collections" onClick={closeMenu}>
              <span>04</span>
              Collections
            </Link>

            <Link href="/about" onClick={closeMenu}>
              <span>05</span>
              Our Philosophy
            </Link>
          </div>

          <div className="mobile-drawer-story">
            <p>THE WEARWORTH BELIEF</p>

            <h3>
              The world may decide your price. Only you decide your worth.
            </h3>

            <Link href="/about" onClick={closeMenu}>
              READ OUR STORY -&gt;
            </Link>
          </div>

          <div className="mobile-drawer-account">
            {loading ? (
              <span className="mobile-drawer-account-placeholder">
                Loading account...
              </span>
            ) : user ? (
              <>
                <Link href="/profile" onClick={closeMenu}>
                  <UserRound size={18} />
                  {firstName}
                </Link>

                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={closeMenu}>
                    <ShieldCheck size={18} />
                    Admin
                  </Link>
                )}

                <button
                  type="button"
                  className="mobile-drawer-logout"
                  onClick={handleLogout}
                >
                  <UserRound size={18} />
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={closeMenu}>
                <UserRound size={18} />
                Sign In
              </Link>
            )}

            <Link href="/wishlist" onClick={closeMenu}>
              <Heart size={18} />
              Wishlist
              {wishlistCount > 0 && <span>{wishlistCount}</span>}
            </Link>
          </div>
        </aside>
      </div>

      <div
        className={`search-panel ${searchOpen ? "search-panel-open" : ""}`}
      >
        <div className="search-panel-top">
          <p>SEARCH WEARWORTH</p>

          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          >
            <X size={25} />
          </button>
        </div>

        <div className="search-panel-content container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <Search size={28} />

            <input
              type="search"
              placeholder="Search by product, story or feeling"
              autoFocus={searchOpen}
            />

            <button type="submit">SEARCH</button>
          </form>

          <div className="search-suggestions">
            <span>POPULAR:</span>
            <Link href="/products" onClick={() => setSearchOpen(false)}>
              Oversized T-Shirts
            </Link>
            <Link href="/products" onClick={() => setSearchOpen(false)}>
              Still Becoming
            </Link>
            <Link href="/products" onClick={() => setSearchOpen(false)}>
              Hoodies
            </Link>
            <Link href="/products" onClick={() => setSearchOpen(false)}>
              Quiet Power
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
