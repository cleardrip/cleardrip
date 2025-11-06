import { Product, ProductInput, ProductsResponse } from "../types/products";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ProductsClass {

    static async getAllProducts(page: number, limit: number, searchTerm: string): Promise<ProductsResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/products?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Cannot fetch products');
            }

            return {
                products: result.products || result,
                total: result.total || result.length,
                page,
                limit,
                totalPage: Math.ceil((result.total || result.length) / limit)
            };
        }
        catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    static async getProductById(id: string): Promise<Product> {
        try {
            const response = await fetch(`${API_BASE_URL}/product/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Cannot fetch product with id: ${id}`);
            }

            return result;
        }
        catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }

    }

    static async createProduct(data: ProductInput): Promise<Product> {
        try {
            const response = await fetch(`${API_BASE_URL}/product`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create product');
            }

            return result;
        }
        catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    }

    static async updateProduct(id: string, data: Partial<ProductInput>): Promise<Product> {
        try {
            const response = await fetch(`${API_BASE_URL}/product/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Failed to update product with id: ${id}`);
            }

            return result.product || result;
        }
        catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    static async deleteProduct(id: string): Promise<{ message: string; product: Product }> {
        try {
            const response = await fetch(`${API_BASE_URL}/product/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Failed to delete product with id ${id}`);
            }

            return result;
        }
        catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }
}