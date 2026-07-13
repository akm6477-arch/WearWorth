"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Eye,
  FilePenLine,
  Filter,
  ImagePlus,
  Layers3,
  PackagePlus,
  Pencil,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  Warehouse,
} from "lucide-react";

import type {
  CatalogProduct,
  ProductAudience,
  ProductStatus,
} from "@/lib/catalog-types";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/order-status";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  userId: string;
  shippingAddress?: {
    fullName?: string;
    email?: string;
  } | null;
}

interface AdminOrderPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ProductFormState {
  slug: string;
  sku: string;
  name: string;
  category: string;
  audience: ProductAudience;
  collection: string;
  statement: string;
  description: string;
  price: string;
  originalPrice: string;
  image: string;
  images: string;
  imagePublicIds: string;
  colors: string;
  material: string;
  fit: string;
  washCare: string;
  sizes: string;
  stock: string;
  lowStockThreshold: string;
  featured: boolean;
  productStatus: ProductStatus;
}

type AdminProductFilter =
  | "all"
  | "featured"
  | "low-stock"
  | "out-of-stock";

const LOW_STOCK_THRESHOLD = 5;
const ADMIN_PAGE_SIZE = 8;
const audienceOptions: ProductAudience[] = [
  "UNISEX",
  "MEN",
  "WOMEN",
];

const initialProductForm: ProductFormState = {
  slug: "",
  sku: "",
  name: "",
  category: "",
  audience: "UNISEX",
  collection: "",
  statement: "",
  description: "",
  price: "",
  originalPrice: "",
  image: "",
  images: "",
  imagePublicIds: "",
  colors: "Black, White",
  material: "Cotton blend",
  fit: "Regular fit",
  washCare: "Machine wash cold inside out. Do not bleach.",
  sizes: "S, M, L, XL",
  stock: "0",
  lowStockThreshold: "5",
  featured: false,
  productStatus: "ACTIVE",
};

function splitList(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(values: string[]) {
  return values.filter(Boolean).join(", ");
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function slugifyClientValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSkuClientValue(value: string) {
  const skuBody = slugifyClientValue(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .slice(0, 54);

  return skuBody ? `WW-${skuBody}` : "";
}

function formatCurrency(value: number) {
  return `Rs.${value.toLocaleString("en-IN")}`;
}

function isLowStockProduct(product: CatalogProduct) {
  return (
    product.stock > 0 &&
    product.stock <=
      (product.lowStockThreshold || LOW_STOCK_THRESHOLD)
  );
}

function getOrderCustomer(order: AdminOrder) {
  return (
    order.shippingAddress?.fullName?.trim() ||
    order.shippingAddress?.email?.trim() ||
    `User ${order.userId.slice(-6)}`
  );
}

function buildGalleryFormState(
  current: ProductFormState,
  images: string[],
  publicIds: string[],
  nextPrimaryImage?: string,
) {
  const compactImages: string[] = [];
  const compactPublicIds: string[] = [];

  images.forEach((image, index) => {
    const normalizedImage = image.trim();

    if (!normalizedImage || compactImages.includes(normalizedImage)) {
      return;
    }

    compactImages.push(normalizedImage);
    compactPublicIds.push(publicIds[index]?.trim() || "");
  });

  const primaryImage =
    nextPrimaryImage && compactImages.includes(nextPrimaryImage)
      ? nextPrimaryImage
      : compactImages[0] || "";
  const orderedImages = primaryImage
    ? [
        primaryImage,
        ...compactImages.filter(
          (image) => image !== primaryImage,
        ),
      ]
    : compactImages;
  const orderedPublicIds = orderedImages.map((image) => {
    const previousIndex = compactImages.indexOf(image);

    return compactPublicIds[previousIndex] || "";
  });

  return {
    ...current,
    image: primaryImage,
    images: joinList(orderedImages),
    imagePublicIds: joinList(orderedPublicIds),
  };
}

export default function AdminPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderPagination, setOrderPagination] =
    useState<AdminOrderPagination>({
      page: 1,
      pageSize: ADMIN_PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [productError, setProductError] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFilePreviews, setSelectedFilePreviews] = useState<
    Array<{
      key: string;
      name: string;
      size: number;
      url: string;
    }>
  >([]);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] =
    useState("All");
  const [productAudienceFilter, setProductAudienceFilter] =
    useState<"All" | ProductAudience>("All");
  const [productStatusFilter, setProductStatusFilter] =
    useState<"All" | ProductStatus>("All");
  const [productStockFilter, setProductStockFilter] =
    useState<AdminProductFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] =
    useState<"All" | OrderStatus>("All");
  const [orderPaymentStatusFilter, setOrderPaymentStatusFilter] =
    useState<"All" | PaymentStatus>("All");
  const [orderPage, setOrderPage] = useState(1);
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

  const selectedCategoryOptions = useMemo(
    () => ["All", ...categoryOptions],
    [categoryOptions],
  );
  const selectedAudienceOptions = useMemo(
    () => [
      "All",
      ...audienceOptions.filter((audience) =>
        products.some((product) => product.audience === audience),
      ),
    ] as Array<"All" | ProductAudience>,
    [products],
  );

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) => product.productStatus === "ACTIVE",
      ),
    [products],
  );
  const draftProducts = useMemo(
    () =>
      products.filter(
        (product) => product.productStatus === "DRAFT",
      ),
    [products],
  );
  const lowStockProducts = useMemo(
    () => products.filter(isLowStockProduct),
    [products],
  );
  const filterIsActive =
    productSearch.trim() ||
    productCategoryFilter !== "All" ||
    productAudienceFilter !== "All" ||
    productStatusFilter !== "All" ||
    productStockFilter !== "all";
  const orderFilterIsActive =
    orderSearch.trim() ||
    orderStatusFilter !== "All" ||
    orderPaymentStatusFilter !== "All";

  const galleryImages = useMemo(() => {
    const images = splitList(productForm.images);
    const publicIds = splitList(productForm.imagePublicIds);
    const primaryImage = productForm.image.trim();
    const visibleImages =
      primaryImage && !images.includes(primaryImage)
        ? [primaryImage, ...images]
        : images;

    return visibleImages.map((url, index) => ({
      key: `${url}-${index}`,
      url,
      publicId: publicIds[index] || "",
      isPrimary: primaryImage
        ? url === primaryImage
        : index === 0,
    }));
  }, [
    productForm.image,
    productForm.images,
    productForm.imagePublicIds,
  ]);

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.sku.toLowerCase().includes(search) ||
        product.name.toLowerCase().includes(search) ||
        product.slug.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.audience.toLowerCase().includes(search) ||
        product.statement.toLowerCase().includes(search) ||
        product.colors.some((color) =>
          color.toLowerCase().includes(search),
        ) ||
        product.material.toLowerCase().includes(search) ||
        product.fit.toLowerCase().includes(search) ||
        (product.collection || "")
          .toLowerCase()
          .includes(search);
      const matchesCategory =
        productCategoryFilter === "All" ||
        product.category === productCategoryFilter;
      const matchesAudience =
        productAudienceFilter === "All" ||
        product.audience === productAudienceFilter;
      const matchesStatus =
        productStatusFilter === "All" ||
        product.productStatus === productStatusFilter;
      const matchesStock =
        productStockFilter === "all" ||
        (productStockFilter === "featured" &&
          product.featured) ||
        (productStockFilter === "low-stock" &&
          product.stock > 0 &&
          product.stock <=
            (product.lowStockThreshold || LOW_STOCK_THRESHOLD)) ||
        (productStockFilter === "out-of-stock" &&
          product.stock === 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAudience &&
        matchesStatus &&
        matchesStock
      );
    });
  }, [
    productAudienceFilter,
    productCategoryFilter,
    productSearch,
    productStatusFilter,
    productStockFilter,
    products,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ADMIN_PAGE_SIZE),
  );
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ADMIN_PAGE_SIZE;

    return filteredProducts.slice(
      startIndex,
      startIndex + ADMIN_PAGE_SIZE,
    );
  }, [currentPage, filteredProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    productAudienceFilter,
    productCategoryFilter,
    productSearch,
    productStatusFilter,
    productStockFilter,
  ]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const previews = selectedFiles.map((file) => ({
      key: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    }));

    setSelectedFilePreviews(previews);

    return () => {
      previews.forEach((preview) =>
        URL.revokeObjectURL(preview.url),
      );
    };
  }, [selectedFiles]);

  const loadOrders = async (showLoading = true) => {
    if (showLoading) {
      setOrderLoading(true);
    }

    setOrderError("");

    try {
      const params = new URLSearchParams({
        page: String(orderPage),
        pageSize: String(ADMIN_PAGE_SIZE),
      });

      if (orderSearch.trim()) {
        params.set("search", orderSearch.trim());
      }

      if (orderStatusFilter !== "All") {
        params.set("status", orderStatusFilter);
      }

      if (orderPaymentStatusFilter !== "All") {
        params.set("paymentStatus", orderPaymentStatusFilter);
      }

      const response = await fetch(
        `/api/admin/orders?${params.toString()}`,
        {
          cache: "no-store",
        },
      );
      const data = (await response.json()) as {
        orders?: AdminOrder[];
        pagination?: AdminOrderPagination;
        error?: string;
      };

      if (!response.ok) {
        setOrderError(data.error || "Unable to load admin orders.");
        setOrders([]);
        return;
      }

      setOrders(data.orders || []);
      setOrderPagination(
        data.pagination || {
          page: 1,
          pageSize: ADMIN_PAGE_SIZE,
          total: data.orders?.length || 0,
          totalPages: 1,
        },
      );
    } catch {
      setOrderError("Unable to load admin orders.");
      setOrders([]);
    } finally {
      if (showLoading) {
        setOrderLoading(false);
      }
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    setError("");

    try {
      const productsResponse = await fetch("/api/admin/products", {
        cache: "no-store",
      });
      const productsData = (await productsResponse.json()) as {
        products?: CatalogProduct[];
        error?: string;
      };

      if (!productsResponse.ok) {
        setError(
          productsData.error || "Unable to load admin products.",
        );
      } else {
        setProducts(productsData.products || []);
      }

      await loadOrders(false);
    } catch {
      setError("Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  useEffect(() => {
    setOrderPage(1);
  }, [
    orderPaymentStatusFilter,
    orderSearch,
    orderStatusFilter,
  ]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadOrders();
    }, orderSearch.trim() ? 300 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    loading,
    orderPage,
    orderPaymentStatusFilter,
    orderSearch,
    orderStatusFilter,
  ]);

  const resetForm = () => {
    setEditingId(null);
    setProductForm(initialProductForm);
    setSelectedFiles([]);
    setProductError("");
    setProductMessage("");
  };

  const scrollToProductManager = () => {
    document
      .getElementById("admin-product-manager")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const handleSelectedFiles = (files: FileList | File[]) => {
    setSelectedFiles(Array.from(files));
    setProductError("");
    setProductMessage("");
  };

  const setPrimaryGalleryImage = (imageUrl: string) => {
    setProductForm((current) =>
      buildGalleryFormState(
        current,
        splitList(current.images),
        splitList(current.imagePublicIds),
        imageUrl,
      ),
    );
  };

  const removeGalleryImage = (imageUrl: string) => {
    setProductForm((current) => {
      const images = splitList(current.images);
      const publicIds = splitList(current.imagePublicIds);
      const imageIndex = images.indexOf(imageUrl);

      if (imageIndex === -1) {
        return current.image === imageUrl
          ? {
              ...current,
              image: images[0] || "",
            }
          : current;
      }

      const nextImages = images.filter(
        (_image, index) => index !== imageIndex,
      );
      const nextPublicIds = publicIds.filter(
        (_publicId, index) => index !== imageIndex,
      );
      const nextPrimary =
        current.image === imageUrl
          ? nextImages[0] || ""
          : current.image;

      return buildGalleryFormState(
        current,
        nextImages,
        nextPublicIds,
        nextPrimary,
      );
    });
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
          ...splitList(current.images),
          ...uploadedUrls,
        ];
        const nextPublicIds = [
          ...splitList(current.imagePublicIds),
          ...uploadedPublicIds,
        ];
        const primaryImage =
          current.image.trim() || uploadedUrls[0] || "";

        return buildGalleryFormState(
          current,
          nextImages,
          nextPublicIds,
          primaryImage,
        );
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

  const saveProduct = async (
    statusOverride?: ProductStatus,
  ) => {
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
            productStatus:
              statusOverride ?? productForm.productStatus,
            price: Number(productForm.price),
            originalPrice: productForm.originalPrice
              ? Number(productForm.originalPrice)
              : null,
            stock: Number(productForm.stock),
            lowStockThreshold: Number(
              productForm.lowStockThreshold,
            ),
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

  const handleProductSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    await saveProduct();
  };

  const startEditingProduct = (product: CatalogProduct) => {
    setEditingId(product.id);
    setSelectedFiles([]);
    setProductMessage("");
    setProductError("");
    setProductForm({
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      category: product.category,
      audience: product.audience,
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
      colors: product.colors.join(", "),
      material: product.material,
      fit: product.fit,
      washCare: product.washCare,
      sizes: product.sizes.join(", "),
      stock: String(product.stock),
      lowStockThreshold: String(product.lowStockThreshold),
      featured: product.featured,
      productStatus: product.productStatus,
    });
  };

  const deleteProduct = async (productId: string) => {
    const confirmed = window.confirm(
      "Delete this product and remove its Cloudinary gallery images?",
    );

    if (!confirmed) {
      return;
    }

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

  const updateOrderStatus = async (
    orderId: string,
    updates: {
      status?: string;
      paymentStatus?: string;
    },
  ) => {
    setUpdatingOrderId(orderId);
    setOrderError("");
    setOrderMessage("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          ...updates,
        }),
      });

      const data = (await response.json()) as {
        order?: AdminOrder;
        error?: string;
      };

      if (!response.ok || !data.order) {
        setOrderError(
          data.error || "Unable to update the order.",
        );
        return;
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId ? data.order! : order,
        ),
      );
      setOrderMessage("Order status updated.");
    } catch {
      setOrderError("Unable to update the order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const summaryCards = [
    {
      label: "Total Products",
      value: products.length,
      helper: "All catalogue items",
      icon: Boxes,
    },
    {
      label: "Active Products",
      value: activeProducts.length,
      helper: "Visible to customers",
      icon: CheckCircle2,
    },
    {
      label: "Draft Products",
      value: draftProducts.length,
      helper: "Hidden from storefront",
      icon: FilePenLine,
    },
    {
      label: "Total Orders",
      value: orderPagination.total,
      helper: orderFilterIsActive
        ? "Matching current filters"
        : "Real customer orders",
      icon: ClipboardList,
    },
    {
      label: "Low Stock Products",
      value: lowStockProducts.length,
      helper:
        lowStockProducts.length > 0
          ? "Need inventory attention"
          : "No low-stock items",
      icon: AlertTriangle,
    },
    {
      label: "Categories",
      value: categoryOptions.length,
      helper: "Product groups",
      icon: Layers3,
    },
  ];

  return (
    <main className="admin-dashboard-page">
      <section className="container admin-dashboard-shell">
        <section className="admin-hero">
          <div className="admin-hero-copy">
            <p className="eyebrow">WEARWORTH ADMIN</p>
            <h1>Manage the store behind the story.</h1>
            <p>
              Create products, manage inventory, update images, review orders,
              and keep the WearWorth catalogue ready for customers.
            </p>
            <small>
              Everything you need to run WearWorth from one clear workspace.
            </small>
          </div>

          <aside className="admin-hero-panel" aria-label="Admin status">
            <div className="admin-identity-row">
              <span>
                <ShieldCheck size={18} />
              </span>
              <div>
                <strong>Admin access verified</strong>
                <small>Server-protected workspace</small>
              </div>
            </div>

            <div className="admin-quick-actions">
              <button
                type="button"
                className="button primary"
                onClick={scrollToProductManager}
              >
                <PackagePlus size={17} />
                ADD NEW PRODUCT
              </button>
              <a href="#admin-product-catalog" className="button ghost">
                <Boxes size={17} />
                VIEW PRODUCTS
              </a>
              <a href="#admin-orders" className="button ghost">
                <ClipboardList size={17} />
                VIEW ORDERS
              </a>
            </div>
          </aside>
        </section>

        {loading ? <div className="account-list-loading" /> : null}
        {error ? <div className="account-form-error">{error}</div> : null}

        <section className="admin-summary-grid" aria-label="Store summary">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.label} className="admin-summary-card">
                <span className="admin-summary-icon">
                  <Icon size={20} />
                </span>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <small>{card.helper}</small>
              </article>
            );
          })}
        </section>

        <div className="admin-workspace-grid">
          <section
            id="admin-product-manager"
            className="account-utility-card admin-product-manager"
          >
            <p className="eyebrow">
              {editingId ? "EDIT PRODUCT" : "PRODUCT MANAGER"}
            </p>
            <h2 className="admin-section-title">
              {editingId ? "Edit Product" : "Add a New Product"}
            </h2>
            <p className="admin-section-copy">
              Upload images, enter product details, and publish the item to the
              WearWorth catalogue.
            </p>

            <form
              className="admin-product-form"
              onSubmit={handleProductSubmit}
            >
              <section className="admin-form-step admin-field-wide">
                <div className="admin-step-heading">
                  <span>STEP 1</span>
                  <div>
                    <h3>Product Images</h3>
                    <p>Choose files, preview them, upload, and arrange the gallery.</p>
                  </div>
                  <ImagePlus size={22} />
                </div>

                <div
                  className="admin-upload-dropzone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleSelectedFiles(event.dataTransfer.files);
                  }}
                >
                  <UploadCloud size={28} />
                  <div>
                    <strong>Drag images here or choose files</strong>
                    <span>JPG, PNG, or WebP. Up to 8 files, 5 MB each.</span>
                  </div>
                  <label htmlFor="admin-product-files">
                    CHOOSE FILES
                  </label>
                  <input
                    id="admin-product-files"
                    className="admin-file-input"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) =>
                      handleSelectedFiles(event.target.files || [])
                    }
                  />
                </div>

                {selectedFilePreviews.length > 0 ? (
                  <div className="admin-upload-preview-list">
                    {selectedFilePreviews.map((file, index) => (
                      <div
                        key={file.key}
                        className="admin-upload-preview-card"
                      >
                        <img src={file.url} alt="" />
                        <strong>{file.name}</strong>
                        <span>{formatFileSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedFiles((currentFiles) =>
                              currentFiles.filter(
                                (_file, fileIndex) => fileIndex !== index,
                              ),
                            )
                          }
                        >
                          Remove selected image
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="admin-upload-actions">
                  <button
                    type="button"
                    className="button ghost"
                    disabled={uploadingImages}
                    onClick={handleImageUpload}
                  >
                    {uploadingImages ? "UPLOADING..." : "UPLOAD IMAGES"}
                  </button>
                </div>

                <div className="admin-manual-image-fields">
                  <label>
                    <span>Primary image path or URL</span>
                    <input
                      value={productForm.image}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          image: event.target.value,
                        }))
                      }
                      placeholder="/images/product.jpg or https://..."
                    />
                  </label>

                  <label>
                    <span>Gallery image paths or URLs</span>
                    <textarea
                      value={productForm.images}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          images: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Separate image paths with commas or new lines"
                    />
                  </label>

                  <label>
                    <span>Uploaded image public IDs</span>
                    <textarea
                      value={productForm.imagePublicIds}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          imagePublicIds: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Auto-filled after Cloudinary upload"
                    />
                  </label>
                </div>

                <div className="admin-gallery-manager">
                  <div className="admin-gallery-heading">
                    <div>
                      <span>Uploaded gallery</span>
                      <strong>
                        {galleryImages.length} image
                        {galleryImages.length === 1 ? "" : "s"}
                      </strong>
                    </div>
                    <small>
                      Pick a primary image or remove an image before saving.
                    </small>
                  </div>

                  {galleryImages.length > 0 ? (
                    <div className="admin-gallery-grid">
                      {galleryImages.map((image) => (
                        <article
                          key={image.key}
                          className={
                            image.isPrimary
                              ? "admin-gallery-card admin-gallery-card-primary"
                              : "admin-gallery-card"
                          }
                        >
                          <img src={image.url} alt="" />
                          <div>
                            <span>
                              {image.isPrimary
                                ? "PRIMARY IMAGE"
                                : "GALLERY IMAGE"}
                            </span>
                            {image.publicId ? (
                              <small>{image.publicId}</small>
                            ) : (
                              <small>Local or external image</small>
                            )}
                          </div>
                          <div className="admin-gallery-actions">
                            <button
                              type="button"
                              disabled={image.isPrimary}
                              onClick={() =>
                                setPrimaryGalleryImage(image.url)
                              }
                            >
                              Set primary
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeGalleryImage(image.url)
                              }
                            >
                              Remove uploaded image
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="admin-gallery-empty">
                      No gallery images yet. Add your product images above.
                    </div>
                  )}
                </div>
              </section>

              <section className="admin-form-step admin-field-wide">
                <div className="admin-step-heading">
                  <span>STEP 2</span>
                  <div>
                    <h3>Basic Details</h3>
                    <p>Name the product and describe its story.</p>
                  </div>
                  <Tag size={22} />
                </div>

                <div className="admin-form-grid">
                  <label>
                    <span>Product name</span>
                    <input
                      value={productForm.name}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Worth Over Noise Oversized Tee"
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
                      placeholder="worth-over-noise-tee"
                    />
                  </label>

                  <label>
                    <span>SKU</span>
                    <input
                      value={productForm.sku}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          sku: event.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="WW-WORTH-OVER-NOISE"
                    />
                  </label>

                  <div className="admin-field-tools">
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm((current) => ({
                          ...current,
                          slug: slugifyClientValue(current.name),
                        }))
                      }
                    >
                      Generate slug
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm((current) => ({
                          ...current,
                          sku: buildSkuClientValue(
                            current.slug || current.name,
                          ),
                        }))
                      }
                    >
                      Generate SKU
                    </button>
                  </div>

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
                      placeholder="T-shirts"
                    />
                  </label>

                  <label>
                    <span>Audience</span>
                    <select
                      value={productForm.audience}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          audience: event.target.value as ProductAudience,
                        }))
                      }
                    >
                      {audienceOptions.map((audience) => (
                        <option key={audience} value={audience}>
                          {audience}
                        </option>
                      ))}
                    </select>
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
                      placeholder="Summer Drop"
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
                      placeholder="A short line that captures the product."
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
                      placeholder="Fabric, feel, story, and styling notes."
                    />
                  </label>
                </div>
              </section>

              <section className="admin-form-step admin-field-wide">
                <div className="admin-step-heading">
                  <span>STEP 3</span>
                  <div>
                    <h3>Pricing & Inventory</h3>
                    <p>Set the selling price, stock, and publication state.</p>
                  </div>
                  <Warehouse size={22} />
                </div>

                <div className="admin-form-grid">
                  <label>
                    <span>Selling price</span>
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
                      placeholder="999"
                    />
                  </label>

                  <label>
                    <span>Original price</span>
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
                      placeholder="1299"
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
                      placeholder="25"
                    />
                  </label>

                  <label>
                    <span>Low-stock threshold</span>
                    <input
                      type="number"
                      min="0"
                      value={productForm.lowStockThreshold}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          lowStockThreshold: event.target.value,
                        }))
                      }
                      placeholder="5"
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

                  <label>
                    <span>Product status</span>
                    <select
                      value={productForm.productStatus}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          productStatus:
                            event.target.value as ProductStatus,
                        }))
                      }
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="DRAFT">DRAFT</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="admin-form-step admin-field-wide">
                <div className="admin-step-heading">
                  <span>STEP 4</span>
                  <div>
                    <h3>Product Options</h3>
                    <p>Add fit, fabric, sizes, colors, and care details.</p>
                  </div>
                  <Sparkles size={22} />
                </div>

                <div className="admin-form-grid">
                  <label>
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

                  <label>
                    <span>Colors</span>
                    <input
                      value={productForm.colors}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          colors: event.target.value,
                        }))
                      }
                      placeholder="Black, White, Olive"
                    />
                  </label>

                  <label>
                    <span>Material</span>
                    <input
                      value={productForm.material}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          material: event.target.value,
                        }))
                      }
                      placeholder="Cotton blend"
                    />
                  </label>

                  <label>
                    <span>Fit</span>
                    <input
                      value={productForm.fit}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          fit: event.target.value,
                        }))
                      }
                      placeholder="Oversized fit"
                    />
                  </label>

                  <label className="admin-field-wide">
                    <span>Wash care</span>
                    <textarea
                      value={productForm.washCare}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          washCare: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Machine wash cold inside out. Do not bleach."
                    />
                  </label>
                </div>
              </section>

              <section className="admin-form-step admin-field-wide admin-save-step">
                <div className="admin-step-heading">
                  <span>STEP 5</span>
                  <div>
                    <h3>Save</h3>
                    <p>Publish now, keep as draft, or clear the form.</p>
                  </div>
                  <Save size={22} />
                </div>

                {productError ? (
                  <div className="account-form-error">{productError}</div>
                ) : null}

                {productMessage ? (
                  <div className="account-form-success">
                    {productMessage}
                  </div>
                ) : null}

                <div className="account-utility-actions admin-save-actions">
                  <button
                    type="submit"
                    className="button primary"
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving
                      ? "SAVING..."
                      : editingId
                        ? "UPDATE PRODUCT"
                        : "ADD PRODUCT"}
                  </button>

                  <button
                    type="button"
                    className="button ghost"
                    disabled={saving}
                    onClick={() => saveProduct("DRAFT")}
                  >
                    <FilePenLine size={16} />
                    SAVE AS DRAFT
                  </button>

                  <button
                    type="button"
                    className="button ghost"
                    onClick={resetForm}
                  >
                    <RotateCcw size={16} />
                    RESET FORM
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
              </section>
            </form>
          </section>

          <section
            id="admin-product-catalog"
            className="account-utility-card admin-catalog-section"
          >
            <div className="admin-section-heading-row">
              <div>
                <p className="eyebrow">PRODUCT CATALOGUE</p>
                <h2 className="admin-section-title">Product Catalogue</h2>
                <p className="admin-section-copy">
                  Search, filter, edit, and manage every product in the
                  WearWorth store.
                </p>
              </div>
              <Filter size={22} />
            </div>

            <div className="admin-product-tools">
              <label>
                <span>Search</span>
                <div className="admin-search-field">
                  <Search size={16} />
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(event) =>
                      setProductSearch(event.target.value)
                    }
                    placeholder="Search name, SKU, category"
                  />
                </div>
              </label>

              <label>
                <span>Category</span>
                <select
                  value={productCategoryFilter}
                  onChange={(event) =>
                    setProductCategoryFilter(event.target.value)
                  }
                >
                  {selectedCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Audience</span>
                <select
                  value={productAudienceFilter}
                  onChange={(event) =>
                    setProductAudienceFilter(
                      event.target.value as "All" | ProductAudience,
                    )
                  }
                >
                  {selectedAudienceOptions.map((audience) => (
                    <option key={audience} value={audience}>
                      {audience}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Status</span>
                <select
                  value={productStatusFilter}
                  onChange={(event) =>
                    setProductStatusFilter(
                      event.target.value as "All" | ProductStatus,
                    )
                  }
                >
                  <option value="All">All statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </label>

              <label>
                <span>Inventory</span>
                <select
                  value={productStockFilter}
                  onChange={(event) =>
                    setProductStockFilter(
                      event.target.value as AdminProductFilter,
                    )
                  }
                >
                  <option value="all">All products</option>
                  <option value="featured">Featured</option>
                  <option value="low-stock">Low stock</option>
                  <option value="out-of-stock">Out of stock</option>
                </select>
              </label>
            </div>

            <p className="admin-product-count">
              Showing {filteredProducts.length} of {products.length} products
            </p>

            <div className="admin-product-list">
              {filteredProducts.length > 0 ? (
                paginatedProducts.map((product) => {
                  const lowStock = isLowStockProduct(product);
                  const outOfStock = product.stock === 0;

                  return (
                    <article
                      key={product.id}
                      className="admin-product-card"
                    >
                      <img
                        src={product.image || "/images/wearworth-logo.jpeg"}
                        alt={product.name}
                      />
                      <div className="admin-product-card-copy">
                        <p>{product.category}</p>
                        <strong>{product.name}</strong>
                        <span>{product.sku}</span>
                        <small>{product.slug}</small>

                        <div className="admin-badge-row">
                          <span className="admin-status-badge">
                            {product.productStatus}
                          </span>
                          {outOfStock ? (
                            <span className="admin-status-badge admin-status-warning">
                              OUT OF STOCK
                            </span>
                          ) : null}
                          {lowStock ? (
                            <span className="admin-status-badge admin-status-warning">
                              LOW STOCK
                            </span>
                          ) : null}
                          {product.featured ? (
                            <span className="admin-status-badge admin-status-accent">
                              FEATURED
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="admin-product-facts">
                        <span>{product.audience}</span>
                        <strong>{formatCurrency(product.price)}</strong>
                        <small>Stock {product.stock}</small>
                      </div>

                      <div className="account-card-actions admin-row-actions">
                        <button
                          type="button"
                          onClick={() => startEditingProduct(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProduct(product.id)}
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <Link
                          href={`/products/${product.slug}`}
                          aria-label={`View ${product.name}`}
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="admin-empty-state">
                  <PackagePlus size={24} />
                  <p>
                    {products.length === 0
                      ? "No products found. Add your first WearWorth product to begin."
                      : productStockFilter === "low-stock" &&
                          lowStockProducts.length === 0
                        ? "No low-stock items. Inventory looks healthy right now."
                        : filterIsActive
                          ? "No products match the current filters."
                          : "No products found. Add your first WearWorth product to begin."}
                  </p>
                </div>
              )}
            </div>

            {filteredProducts.length > ADMIN_PAGE_SIZE ? (
              <div className="admin-pagination">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1),
                    )
                  }
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1),
                    )
                  }
                >
                  Next
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <section
          id="admin-orders"
          className="account-utility-card admin-orders-section"
        >
          <div className="admin-section-heading-row">
            <div>
              <p className="eyebrow">ORDERS</p>
              <h2 className="admin-section-title">Order Management</h2>
            </div>
            <ClipboardList size={22} />
          </div>

          <div className="admin-product-tools admin-order-tools">
            <label>
              <span>Search</span>
              <div className="admin-search-field">
                <Search size={16} />
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(event) =>
                    setOrderSearch(event.target.value)
                  }
                  placeholder="Order number, customer, email"
                />
              </div>
            </label>

            <label>
              <span>Order status</span>
              <select
                value={orderStatusFilter}
                onChange={(event) =>
                  setOrderStatusFilter(
                    event.target.value as "All" | OrderStatus,
                  )
                }
              >
                <option value="All">All statuses</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Payment status</span>
              <select
                value={orderPaymentStatusFilter}
                onChange={(event) =>
                  setOrderPaymentStatusFilter(
                    event.target.value as "All" | PaymentStatus,
                  )
                }
              >
                <option value="All">All payment statuses</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="admin-product-count">
            Showing {orders.length} of {orderPagination.total} orders
          </p>

          {orderError ? (
            <div className="account-form-error">{orderError}</div>
          ) : null}

          {orderMessage ? (
            <div className="account-form-success">{orderMessage}</div>
          ) : null}

          {orderLoading ? (
            <div className="account-list-loading" />
          ) : null}

          {!loading && !orderLoading && orders.length === 0 ? (
            <div className="admin-empty-state">
              <ClipboardList size={24} />
              <p>
                {orderFilterIsActive
                  ? "No orders match the current filters."
                  : "No orders yet. New COD orders will appear here."}
              </p>
            </div>
          ) : null}

          <div className="admin-orders-list">
            {orders.map((order) => {
              const orderStatusOptions = ORDER_STATUSES.includes(
                order.status as OrderStatus,
              )
                ? ORDER_STATUSES
                : ([order.status, ...ORDER_STATUSES] as readonly string[]);
              const paymentStatusOptions = PAYMENT_STATUSES.includes(
                order.paymentStatus as PaymentStatus,
              )
                ? PAYMENT_STATUSES
                : ([
                    order.paymentStatus,
                    ...PAYMENT_STATUSES,
                  ] as readonly string[]);

              return (
                <article key={order.id} className="admin-order-card">
                  <div className="admin-order-main">
                    <p>{order.orderNumber}</p>
                    <strong>{getOrderCustomer(order)}</strong>
                    <small>
                      {new Date(order.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </small>
                  </div>

                  <div className="admin-order-total">
                    <span>Total</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>

                  <label>
                    <span>Order status</span>
                    <select
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onChange={(event) =>
                        updateOrderStatus(order.id, {
                          status: event.target.value,
                        })
                      }
                    >
                      {orderStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Payment status</span>
                    <select
                      value={order.paymentStatus}
                      disabled={updatingOrderId === order.id}
                      onChange={(event) =>
                        updateOrderStatus(order.id, {
                          paymentStatus: event.target.value,
                        })
                      }
                    >
                      {paymentStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <Link href={`/orders/${order.id}`}>VIEW ORDER</Link>
                </article>
              );
            })}
          </div>

          {orderPagination.totalPages > 1 ? (
            <div className="admin-pagination">
              <button
                type="button"
                disabled={orderPagination.page === 1 || orderLoading}
                onClick={() =>
                  setOrderPage((page) => Math.max(1, page - 1))
                }
              >
                Previous
              </button>
              <span>
                Page {orderPagination.page} of{" "}
                {orderPagination.totalPages}
              </span>
              <button
                type="button"
                disabled={
                  orderPagination.page === orderPagination.totalPages ||
                  orderLoading
                }
                onClick={() =>
                  setOrderPage((page) =>
                    Math.min(orderPagination.totalPages, page + 1),
                  )
                }
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
