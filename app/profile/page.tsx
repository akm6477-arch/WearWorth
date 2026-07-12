"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Heart,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";

export default function ProfilePage() {
  const router = useRouter();

  const {
    user,
    loading,
    authenticated,
    logout,
  } = useAuth();

  const { count: cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/login?redirect=/profile");
    }
  }, [authenticated, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
    router.refresh();
  };

  if (loading || !user) {
    return (
      <main className="profile-page">
        <section className="container profile-loading">
          <div className="profile-loading-card" />
        </section>
      </main>
    );
  }

  const firstName =
    user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="container profile-hero-grid">
          <div>
            <p className="eyebrow">
              YOUR WEARWORTH ACCOUNT
            </p>

            <h1>
              Welcome back,
              <span>{firstName}.</span>
            </h1>

            <p>
              Manage your account, saved stories,
              shopping bag and future WearWorth orders.
            </p>
          </div>

          <div className="profile-identity-card">
            <div className="profile-avatar">
              <UserRound size={32} />
            </div>

            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <small>{user.role}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="container profile-content">
        <div className="profile-main-grid">
          <div className="profile-overview">
            <div className="profile-section-heading">
              <div>
                <p className="eyebrow">ACCOUNT OVERVIEW</p>
                <h2>Your WearWorth space.</h2>
              </div>

              <ShieldCheck size={24} />
            </div>

            <div className="profile-stat-grid">
              <article>
                <ShoppingBag size={22} />

                <div>
                  <strong>{cartCount}</strong>
                  <span>
                    {cartCount === 1
                      ? "item in bag"
                      : "items in bag"}
                  </span>
                </div>

                <Link href="/cart">
                  VIEW BAG
                  <ArrowRight size={15} />
                </Link>
              </article>

              <article>
                <Heart size={22} />

                <div>
                  <strong>{wishlistCount}</strong>
                  <span>
                    {wishlistCount === 1
                      ? "saved product"
                      : "saved products"}
                  </span>
                </div>

                <Link href="/wishlist">
                  VIEW WISHLIST
                  <ArrowRight size={15} />
                </Link>
              </article>

              <article>
                <Package size={22} />

                <div>
                  <strong>0</strong>
                  <span>orders placed</span>
                </div>

                <Link href="/orders">
                  VIEW ORDERS
                  <ArrowRight size={15} />
                </Link>
              </article>
            </div>

            <div className="profile-account-card">
              <div className="profile-account-card-heading">
                <div>
                  <p className="eyebrow">
                    PERSONAL INFORMATION
                  </p>

                  <h3>Your account details</h3>
                </div>

                <UserRound size={22} />
              </div>

              <div className="profile-detail-list">
                <div>
                  <span>FULL NAME</span>
                  <strong>{user.name}</strong>
                </div>

                <div>
                  <span>EMAIL ADDRESS</span>
                  <strong>{user.email}</strong>
                </div>

                <div>
                  <span>ACCOUNT ROLE</span>
                  <strong>{user.role}</strong>
                </div>

                <div>
                  <span>MEMBER SINCE</span>
                  <strong>
                    {new Date(
                      user.createdAt,
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <aside className="profile-sidebar">
            <p className="profile-sidebar-label">
              QUICK ACCESS
            </p>

            <nav className="profile-navigation">
              <Link href="/orders">
                <Package size={19} />

                <div>
                  <strong>My Orders</strong>
                  <span>
                    Track and review your purchases
                  </span>
                </div>

                <ArrowRight size={16} />
              </Link>

              <Link href="/wishlist">
                <Heart size={19} />

                <div>
                  <strong>Wishlist</strong>
                  <span>
                    Return to saved WearWorth pieces
                  </span>
                </div>

                <ArrowRight size={16} />
              </Link>

              <Link href="/cart">
                <ShoppingBag size={19} />

                <div>
                  <strong>Shopping Bag</strong>
                  <span>
                    Continue with your current items
                  </span>
                </div>

                <ArrowRight size={16} />
              </Link>

              <Link href="/addresses">
                <MapPin size={19} />

                <div>
                  <strong>Saved Addresses</strong>
                  <span>
                    Manage delivery information
                  </span>
                </div>

                <ArrowRight size={16} />
              </Link>

              <Link href="/profile/security">
                <ShieldCheck size={19} />

                <div>
                  <strong>Password & Security</strong>
                  <span>
                    Update your password securely
                  </span>
                </div>

                <ArrowRight size={16} />
              </Link>

              {user.role === "ADMIN" && (
                <Link href="/admin">
                  <ShieldCheck size={19} />

                  <div>
                    <strong>Admin Dashboard</strong>
                    <span>
                      Review orders and operations
                    </span>
                  </div>

                  <ArrowRight size={16} />
                </Link>
              )}
            </nav>

            <div className="profile-belief-card">
              <span>THE WEARWORTH BELIEF</span>

              <blockquote>
                “Your account should remember your
                choices—not decide your worth.”
              </blockquote>
            </div>

            <button
              type="button"
              className="profile-logout-button"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              SIGN OUT
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}
