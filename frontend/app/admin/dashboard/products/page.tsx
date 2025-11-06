"use client";

import React, { useEffect, useState } from "react";
import { Product, ProductInput } from "@/lib/types/products";
import { ProductsClass } from "@/lib/httpClient/product";
import { Loader2, Package, Edit, Trash2 } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPage, setTotalPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<ProductInput>({
    name: "",
    price: 0,
    image: "",
    description: "",
    inventory: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm]); 

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await ProductsClass.getAllProducts(page, limit, searchTerm);
      setProducts(res.products);
      setTotalPage(res.totalPage);
    } catch (e) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    if (name === "price") {
      const parsed = parseFloat(value);
      setFormData((prev) => ({ ...prev, price: isNaN(parsed) ? 0 : parsed }));
    } else if (name === "inventory") {
      const parsed = parseInt(value, 10);
      setFormData((prev) => ({
        ...prev,
        inventory: isNaN(parsed) ? 0 : parsed,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingId) {
        await ProductsClass.updateProduct(editingId, formData);
      } else {
        await ProductsClass.createProduct(formData);
      }
      setFormData({
        name: "",
        price: 0,
        image: "",
        description: "",
        inventory: 0,
      });
      setEditingId(null);
      fetchProducts();
    } catch (e) {
      setError("Failed to save product");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: Number(product.price),
      image: product?.image || "",
      description: product.description || "",
      inventory: Number(product.inventory),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setLoading(true);
    setError(null);
    try {
      await ProductsClass.deleteProduct(id);
      fetchProducts();
    } catch (e) {
      setError("Failed to delete product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <Package className="w-7 h-7 text-blue-600" />
        Admin Products
      </h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 p-3 rounded-md max-w-xl mx-auto mb-6 text-center shadow-sm">
          {error}
        </p>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-10 max-w-5xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 md:grid-cols-2"
        >
          {/* Product Name */}
          <div className="flex flex-col">
            <label
              htmlFor="name"
              className="mb-2 text-sm font-medium text-gray-700"
            >
              Product Name
            </label>
            <input
              id="name"
              name="name"
              placeholder="Enter product name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Price */}
          <div className="flex flex-col">
            <label
              htmlFor="price"
              className="mb-2 text-sm font-medium text-gray-700"
            >
              Price (₹)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              placeholder="Enter price"
              value={formData.price}
              onChange={handleInputChange}
              min={0}
              step="0.01"
              required
              className="p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col md:col-span-2">
            <label
              htmlFor="description"
              className="mb-2 text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter product description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Inventory */}
          <div className="flex flex-col">
            <label
              htmlFor="inventory"
              className="mb-2 text-sm font-medium text-gray-700"
            >
              Inventory
            </label>
            <input
              id="inventory"
              name="inventory"
              type="number"
              placeholder="Enter inventory count"
              value={formData.inventory}
              onChange={handleInputChange}
              min={0}
              required
              className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Image URL */}
          <div className="flex flex-col md:col-span-2">
            <label
              htmlFor="image"
              className="mb-2 text-sm font-medium text-gray-700"
            >
              Image URL
            </label>
            <input
              id="image"
              name="image"
              type="url"
              value={formData.image}
              onChange={handleInputChange}
              required
              placeholder="Enter image URL"
              className="p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-6 md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              title={
                editingId
                  ? "Update product — Save changes to this product"
                  : "Create new product — Add this product to the catalog"
              }
              aria-label={
                editingId ? "Update product — Save changes" : "Create product — Add new product"
              }
              className="flex-grow flex items-center justify-center bg-blue-600 hover:bg-blue-800 text-white py-3 rounded-lg font-semibold transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-sm"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
              {editingId ? "Update Product" : "Create Product"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: "",
                    price: 0,
                    image: "",
                    description: "",
                    inventory: 0,
                  });
                }}
                title="Cancel editing — Discard unsaved changes"
                aria-label="Cancel editing — Discard changes"
                className="flex-grow flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 border py-3 rounded-lg font-semibold transition transform hover:scale-[1.01] cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-3 focus:ring-gray-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500 col-span-full">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No products found</p>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              title={`${product.name} — ${product.inventory} in stock • $${Number(product.price).toFixed(2)}`}
              role="group"
              tabIndex={0}
              className="p-6 bg-white border rounded-lg shadow-sm group hover:shadow-lg hover:scale-[1.02] transition-transform flex flex-col focus:outline-none focus:ring-4 focus:ring-blue-50 cursor-pointer"
            >
              <img
                src={product.image || ""}
                alt={product.name}
                title={product.name}
                loading="lazy"
                className="h-40 w-full object-contain mb-4 rounded transition-transform group-hover:scale-105 group-hover:brightness-95"
              />
              <div className="flex-1 text-center space-y-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {product.name}
                </h2>
                <p className="text-blue-600 font-semibold">
                  Rs. {Number(product.price).toFixed(2)}
                </p>
                <p className="text-gray-600">
                  Inventory: {product.inventory}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {product.description}
                </p>
              </div>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => handleEdit(product)}
                  title={`Edit ${product.name} — Open editor to modify details`}
                  aria-label={`Edit ${product.name} — Open editor`}
                  className="px-4 py-2 flex items-center gap-1 bg-yellow-100 text-yellow-900 rounded-md hover:bg-yellow-300 hover:text-yellow-950 transition transform hover:scale-[1.03] cursor-pointer focus:outline-none focus:ring-4 focus:ring-yellow-200"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  title={`Delete ${product.name} — Permanently remove this product`}
                  aria-label={`Delete ${product.name} — Permanently remove`}
                  className="px-4 py-2 flex items-center gap-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition transform hover:scale-[1.03] cursor-pointer focus:outline-none focus:ring-4 focus:ring-red-200"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-6 mt-10 items-center">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          title={`Previous page — ${Math.max(1, page - 1)} of ${totalPage}`}
          aria-label={`Previous page — go to ${Math.max(1, page - 1)} of ${totalPage}`}
          className="px-6 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm cursor-pointer focus:outline-none focus:ring-3 focus:ring-gray-200 transform hover:scale-[1.01]"
        >
          Prev
        </button>
        <span className="text-gray-700 font-semibold select-none">
          {page} / {totalPage}
        </span>
        <button
          disabled={page === totalPage}
          onClick={() => setPage(page + 1)}
          title={`Next page — ${Math.min(totalPage, page + 1)} of ${totalPage}`}
          aria-label={`Next page — go to ${Math.min(totalPage, page + 1)} of ${totalPage}`}
          className="px-6 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm cursor-pointer focus:outline-none focus:ring-3 focus:ring-gray-200 transform hover:scale-[1.01]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
