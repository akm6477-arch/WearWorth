"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { CatalogProduct } from "@/lib/catalog-types";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
}

interface ProductFormState {
  slug: string;
  name: string;
  category: string;
  collection: string;
  statement: string;
  description: string;
  price: string;
  originalPrice: string;
  image: string;
  images: string;
  imagePublicIds: string;
  sizes: string;
  stock: string;
  featured: boolean;
}

const initialProductForm: ProductFormState = {
  slug: "",
  name: "",
  category: "",
  collection: "",
  statement: "",
  description: "",
  price: "",
  originalPrice: "",
  image: "",
  images: "",
  imagePublicIds: "",
  sizes: "S, M, L, XL",
  stock: "0",
  featured: false,
};

export default function AdminPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [importingSamples, setImportingSamples] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [productForm, setProductForm] =
    useState<ProductFormState>(initialProductForm);

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter(Boolean),
        ),
      ).sort((firstCategory, secondCategory) =>
        firstCategory.localeCompare(secondCategory),
      ),
    [products],
  );

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const [ordersResponse, productsResponse] = await Promise.all([
        fetch("/api/admin/orders", {
          cache: "no-store",
        }),
        fetch("/api/admin/products", {
          cache: "no-store",
        }),
      ]);

      const ordersData = (await ordersResponse.json()) as {
        orders?: AdminOrder[];
        error?: string;
      };
      const productsData = (await productsResponse.json()) as {
        products?: CatalogProduct[];
        error?: string;
      };

      if (!ordersResponse.ok) {
        setError(ordersData.error || "Unable to load admin orders.");
      } else {
        setOrders(ordersData.orders || []);
      }

      if (!productsResponse.ok) {
        setError(
          productsData.error || "Unable to load admin products.",
        );
      } else {
        setProducts(productsData.products || []);
      }
    } catch {
      setError("Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setProductForm(initialProductForm);
    setSelectedFiles([]);
    setProductError("");
    setProductMessage("");
  };

  const handleImageUpload = async () => {
    if (selectedFiles.length === 0) {
      setProductError("Choose one or more images first.");
      return;
    }

    setUploadingImages(true);
    setProductError("");
    setProductMessage("");

    try {
      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        uploads?: Array<{
          url: string;
          publicId: string;
        }>;
      };

      if (!response.ok || !data.uploads) {
        setProductError(
          data.error || "Unable to upload images right now.",
        );
        return;
      }

      const uploadedUrls = data.uploads.map((upload) => upload.url);
      const uploadedPublicIds = data.uploads.map(
        (upload) => upload.publicId,
      );

      setProductForm((current) => {
        const nextImages = [
          ...current.images
            .split(/[\n,]+/)
            .map((item) => item.trim())
            .filter(Boolean),
          ...uploadedUrls,
        ];
        const nextPublicIds = [
          ...current.imagePublicIds
            .split(/[\n,]+/)
            .map((item) => item.trim())
            .filter(Boolean),
          ...uploadedPublicIds,
        ];
        const primaryImage =
          current.image.trim() || uploadedUrls[0] || "";

        return {
          ...current,
          image: primaryImage,
          images: nextImages.join(", "),
          imagePublicIds: nextPublicIds.join(", "),
        };
      });

      setSelectedFiles([]);
      setProductMessage(
        `${data.uploads.length} image${data.uploads.length > 1 ? "s" : ""} uploaded successfully.`,
      );
    } catch {
      setProductError("Unable to upload images right now.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleProductSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const isEditing = Boolean(editingId);
    setSaving(true);
    setProductError("");
    setProductMessage("");

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/products/${editingId}`
          : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...productForm,
            price: Number(productForm.price),
            originalPrice: productForm.originalPrice
              ? Number(productForm.originalPrice)
              : null,
            stock: Number(productForm.stock),
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setProductError(
          data.error || "Unable to save the product.",
        );
        return;
      }

      resetForm();
      setProductMessage(
        isEditing
          ? "Product updated successfully."
          : "Product created successfully.",
      );
      await loadAdminData();
    } catch {
      setProductError("Unable to save the product.");
    } finally {
      setSaving(false);
    }
  };

  const startEditingProduct = (product: CatalogProduct) => {
    setEditingId(product.id);
    setSelectedFiles([]);
    setProductMessage("");
    setProductError("");
    setProductForm({
      slug: product.slug,
      name: product.name,
      category: product.category,
      collection: product.collection || "",
      statement: product.statement,
      description: product.description,
      price: String(product.price),
      originalPrice: product.originalPrice
        ? String(product.originalPrice)
        : "",
      image: product.image,
      images: product.images.join(", "),
      imagePublicIds: product.imagePublicIds.join(", "),
      sizes: product.sizes.join(", "),
      stock: String(product.stock),
      featured: product.featured,
    });
  };

  const deleteProduct = async (productId: string) => {
    setProductError("");
    setProductMessage("");

    try {
      const response = await fetch(
        `/api/admin/products/${productId}`,
        {
          method: "DELETE",
        },
      );

      const data = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setProductError(
          data.error || "Unable to delete the product.",
        );
        return;
      }

      if (editingId === productId) {
        resetForm();
      }

      setProductMessage("Product deleted successfully.");
      await loadAdminData();
    } catch {
      setProductError("Unable to delete the product.");
    }
  };

  const importSampleProducts = async () => {
    setImportingSamples(true);
    setProductError("");
    setProductMessage("");

    try {
      const response = await fetch("/api/admin/products/seed", {
        method: "POST",
      });

      const data = (await response.json()) as {
        error?: string;
        created?: number;
        skipped?: number;
      };

      if (!response.ok) {
        setProductError(
          data.error || "Unable to import sample products.",
        );
        return;
      }

      setProductMessage(
        `Sample catalog ready. Added ${data.created || 0} products and skipped ${data.skipped || 0} existing ones.`,
      );
      await loadAdminData();
    } catch {
      setProductError("Unable to import sample products.");
    } finally {
      setImportingSamples(false);
    }
  };

  return (
    <main className="account-utility-page">
      <section className="container account-list-page">
        <p className="eyebrow">ADMIN</p>
        <h1>WearWorth operations dashboard.</h1>
        <p>
          Manage live orders and build the DB-backed product catalogue from one
          place.
        </p>

        <div className="admin-metric-row">
          <article className="account-list-card">
            <p>Total Orders</p>
            <strong>{orders.length}</strong>
          </article>
          <article className="account-list-card">
            <p>Total Products</p>
            <strong>{products.length}</strong>
          </article>
          <article className="account-list-card">
            <p>Categories</p>
            <strong>{categoryOptions.length}</strong>
          </article>
        </div>

        {loading ? <div className="account-list-loading" /> : null}
        {error ? <div className="account-form-error">{error}</div> : null}

        <div className="admin-grid">
          <section className="account-utility-card">
            <p className="eyebrow">
              {editingId ? "EDIT PRODUCT" : "ADD PRODUCT"}
            </p>
            <h2 className="admin-section-title">Product Manager</h2>
            <p>
              Add a product with category, collection, image URLs, sizes, stock,
              and featured state.
            </p>

            <div className="account-utility-actions">
              <button
                type="button"
                className="button ghost"
                disabled={importingSamples}
                onClick={importSampleProducts}
              >
                {importingSamples
                  ? "IMPORTING 50 PRODUCTS..."
                  : "ADD 50 SAMPLE PRODUCTS"}
              </button>
            </div>

            <div className="admin-upload-panel">
              <div className="admin-upload-actions">
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setSelectedFiles(
                      Array.from(event.target.files || []),
                    )
                  }
                />
                <button
                  type="button"
                  className="button ghost"
                  disabled={uploadingImages}
                  onClick={handleImageUpload}
                >
                  {uploadingImages ? "UPLOADING..." : "UPLOAD IMAGES"}
                </button>
              </div>
              <p className="admin-upload-help">
                Upload JPG, PNG, or WebP files up to 5 MB each. Uploaded images
                fill the gallery and store their Cloudinary IDs automatically.
              </p>
              {selectedFiles.length > 0 ? (
                <div className="admin-upload-preview-list">
                  {selectedFiles.map((file) => (
                    <div
                      key={`${file.name}-${file.lastModified}`}
                      className="admin-upload-preview-card"
                    >
                      <strong>{file.name}</strong>
                      <span>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <form
              className="admin-product-form"
              onSubmit={handleProductSubmit}
            >
              <label>
                <span>Name</span>
                <input
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Slug</span>
                <input
                  value={productForm.slug}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                  placeholder="leave blank to generate from name"
                />
              </label>

              <label>
                <span>Category</span>
                <input
                  list="wearworth-categories"
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </label>

              <datalist id="wearworth-categories">
                {categoryOptions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>

              <label>
                <span>Collection</span>
                <input
                  value={productForm.collection}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      collection: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="admin-field-wide">
                <span>Statement</span>
                <input
                  value={productForm.statement}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      statement: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="admin-field-wide">
                <span>Description</span>
                <textarea
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                />
              </label>

              <label>
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Original Price</span>
                <input
                  type="number"
                  min="0"
                  value={productForm.originalPrice}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      originalPrice: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      stock: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="admin-checkbox-field">
                <input
                  type="checkbox"
                  checked={productForm.featured}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      featured: event.target.checked,
                    }))
                  }
                />
                <span>Featured product</span>
              </label>

              <label className="admin-field-wide">
                <span>Primary Image URL or `/images/...` path</span>
                <input
                  value={productForm.image}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      image: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="admin-field-wide">
                <span>All Image URLs or paths</span>
                <textarea
                  value={productForm.images}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      images: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Separate with commas or new lines"
                />
              </label>

              <label className="admin-field-wide">
                <span>Cloudinary Public IDs</span>
                <textarea
                  value={productForm.imagePublicIds}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      imagePublicIds: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Auto-filled after upload. Separate with commas or new lines"
                />
              </label>

              <label className="admin-field-wide">
                <span>Sizes</span>
                <input
                  value={productForm.sizes}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      sizes: event.target.value,
                    }))
                  }
                  placeholder="S, M, L, XL"
                />
              </label>

              {productError ? (
                <div className="account-form-error">{productError}</div>
              ) : null}

              {productMessage ? (
                <div className="account-form-success">{productMessage}</div>
              ) : null}

              <div className="account-utility-actions">
                <button
                  type="submit"
                  className="button primary"
                  disabled={saving}
                >
                  {saving
                    ? "SAVING..."
                    : editingId
                      ? "UPDATE PRODUCT"
                      : "ADD PRODUCT"}
                </button>

                {editingId ? (
                  <button
                    type="button"
                    className="button ghost"
                    onClick={resetForm}
                  >
                    CANCEL EDIT
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="account-utility-card">
            <p className="eyebrow">LIVE CATALOGUE</p>
            <h2 className="admin-section-title">Products</h2>

            <div className="admin-product-list">
              {products.length > 0 ? (
                products.map((product) => (
                  <article key={product.id} className="admin-product-card">
                    <div>
                      <p>{product.category}</p>
                      <strong>{product.name}</strong>
                      <span>{product.slug}</span>
                      <small>
                        Rs.{product.price.toLocaleString("en-IN")} | Stock {product.stock}
                      </small>
                    </div>

                    <div className="account-card-actions">
                      <button
                        type="button"
                        onClick={() => startEditingProduct(product)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product.id)}
                      >
                        Delete
                      </button>
                      <Link href={`/products/${product.slug}`}>View</Link>
                    </div>
                  </article>
                ))
              ) : (
                <p>No products available yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className="account-utility-card">
          <p className="eyebrow">ORDERS</p>
          <h2 className="admin-section-title">Recent orders</h2>

          <div className="account-list-grid">
            {orders.map((order) => (
              <article key={order.id} className="account-list-card">
                <p>{order.orderNumber}</p>
                <strong>Rs.{order.total.toLocaleString("en-IN")}</strong>
                <span>{order.status}</span>
                <small>Payment: {order.paymentStatus}</small>
                <Link href={`/orders/${order.id}`}>VIEW ORDER</Link>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
