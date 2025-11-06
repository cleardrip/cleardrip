import { Button } from "@/components/ui/button";
import { ProductsClass } from "@/lib/httpClient/product";
import { Product } from "@/lib/types/products";
import React, { useEffect, useState, useCallback, memo } from "react";
import { ShoppingCart, Eye, AlertCircle, RefreshCw, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

const SAMPLE_IMAGES = [
    "/featured1.png",
    "/featured2.png",
    "/featured3.png",
] as const;

interface ProductCardProps {
    product: Product;
    onAddToCart?: (productId: string) => void;
    onBuyNow?: (productId: string) => void;
}

interface LoadingSkeletonProps {
    count?: number;
}

const ProductCardSkeleton: React.FC = memo(() => (
    <article
        className="bg-gray-50 rounded-3xl p-4 sm:p-6 border-2 border-gray-200 animate-pulse"
        aria-busy="true"
        aria-label="Loading product information"
    >
        <div className="mb-6 bg-gray-200 rounded-2xl h-40 sm:h-48 md:h-52 lg:h-56" />
        <div className="mb-6 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 h-10 sm:h-11 bg-gray-200 rounded-full" />
            <div className="flex-1 h-10 sm:h-11 bg-gray-200 rounded-full" />
        </div>
    </article>
));
ProductCardSkeleton.displayName = 'ProductCardSkeleton';

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = memo(({ count = 3 }) => (
    <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        role="status"
        aria-live="polite"
        aria-label="Loading featured products"
    >
        {Array.from({ length: count }, (_, index) => (
            <ProductCardSkeleton key={`skeleton-${index}`} />
        ))}
    </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

const ErrorBoundary: React.FC<{ error: string; onRetry: () => void }> = memo(({ error, onRetry }) => (
    <div
        className="text-center py-12 px-4"
        role="alert"
        aria-live="assertive"
    >
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" aria-hidden="true" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Unable to load products
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
            {error}
        </p>
        <Button
            onClick={onRetry}
            className="inline-flex items-center gap-2"
            aria-label="Retry loading products"
        >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try Again
        </Button>
    </div>
));
ErrorBoundary.displayName = 'ErrorBoundary';

const ProductCard: React.FC<ProductCardProps> = memo(({ product, onAddToCart, onBuyNow }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const getProductImage = useCallback(() => {
        if (imageError || !product?.image) {
            return SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
        }
        return product.image;
    }, [imageError, product?.image]);

    const formatPrice = useCallback((price: string | number) => {
        if (typeof price === 'number') {
            return `₹${price.toLocaleString('en-IN')}`;
        }
        const numericPrice = price.toString().replace(/[^\d.]/g, '');
        const parsedPrice = parseFloat(numericPrice);
        return isNaN(parsedPrice) ? price : `₹${parsedPrice.toLocaleString('en-IN')}`;
    }, []);

    const truncateText = useCallback((text: string | null, maxLength: number = 100) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }, []);

    return (
        <article
            className="group bg-gradient-to-br from-gray-50 to-white rounded-3xl p-4 sm:p-6 border-2 border-blue-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2"
            aria-labelledby={`product-name-${product.id}`}
        >
            {/* Product Image */}
            <div className="relative mb-4 sm:mb-6 bg-white rounded-2xl p-3 sm:p-4 h-40 sm:h-48 md:h-52 lg:h-56 overflow-hidden">
                {!imageLoaded && (
                    <div
                        className="absolute inset-0 bg-gray-200 animate-pulse rounded-2xl flex items-center justify-center"
                        role="status"
                        aria-label="Loading product image"
                    >
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" aria-hidden="true" />
                    </div>
                )}
                <img
                    src={getProductImage()}
                    alt={`${product.name} - Water purification product`}
                    className={`w-full h-full object-contain transition-all duration-500 ${imageLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
                        }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    loading="lazy"
                />

                {/* Quick View Button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
                    <Link
                        href={`/products/${product.id}`}
                        title={`Quick view ${product.name}`}
                        aria-label={`Quick view ${product.name}`}
                    >
                        <Button
                            size="sm"
                            variant="secondary"
                            className="w-8 h-8 sm:w-9 sm:h-9 p-0 rounded-full bg-white/90 hover:bg-white shadow-lg focus:ring-2 focus:ring-blue-500"
                            tabIndex={0}
                        >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Product Info */}
            <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
                <h3
                    id={`product-name-${product.id}`}
                    className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 min-h-[3rem] sm:min-h-[3.5rem]"
                >
                    {product.name}
                </h3>

                <p
                    className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-3 min-h-[3rem] sm:min-h-[3.5rem]"
                    title={product?.description || 'No description available'}
                >
                    {truncateText(product?.description || '', 100) || 'No description available.'}
                </p>

                <div className="flex items-center justify-between pt-2">
                    <p
                        className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600"
                        aria-label={`Price: ${formatPrice(product.price)}`}
                    >
                        {formatPrice(product.price)}
                    </p>
                    <span
                        className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full"
                        role="status"
                        aria-label="Featured product"
                    >
                        Featured
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                    variant="outline"
                    className="flex-1 rounded-full bg-transparent hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-all duration-200 text-xs sm:text-sm md:text-base h-10 sm:h-11 focus:ring-2 focus:ring-blue-500"
                    onClick={() => onAddToCart?.(product.id)}
                    aria-label={`Add ${product.name} to cart`}
                    title={`Add ${product.name} to cart`}
                >
                    <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
                    Add to cart
                </Button>

                <Button
                    className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base h-10 sm:h-11 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white"
                    onClick={() => onBuyNow?.(product.id)}
                    aria-label={`Buy ${product.name} now`}
                    title={`Buy ${product.name} now`}
                >
                    Buy now
                </Button>
            </div>
        </article>
    );
});
ProductCard.displayName = 'ProductCard';

export default function FeaturedProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { addToCart } = useCart();
    const router = useRouter();


    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ProductsClass.getAllProducts(1, 3, "");
            setProducts(data.products || []);
        } catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : 'Failed to load products. Please try again.';
            setError(errorMessage);
            console.error('Error loading products:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleAddToCart = useCallback((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) {
            toast.error('Product not found');
            return;
        }

        try {
            addToCart({
                id: product.id,
                name: product.name,
                price: typeof product.price === "number" ? product.price : parseFloat(product.price),
                originalPrice: typeof product.price === "number" ? product.price : parseFloat(product.price),
                image: product.image,
            });
            toast.success('Product added to cart');
            router.push('/cart');
        } catch (err) {
            toast.error('Failed to add product to cart');
            console.error('Error adding to cart:', err);
        }
    }, [addToCart, products, router]);



    const handleBuyNow = useCallback((productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) {
            toast.error('Product not found');
            return;
        }
        router.push(`/products/${product.id}`);
    }, [products]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Loading State
    if (loading) {
        return (
            <section
                className="py-12 sm:py-16 lg:py-20 px-4 bg-white"
                aria-label="Featured products section"
                aria-busy="true"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 mb-4">
                            Featured Products
                        </h2>
                        <div className="w-24 h-1 bg-blue-200 mx-auto rounded animate-pulse" />
                    </div>
                    <LoadingSkeleton count={3} />
                </div>
            </section>
        );
    }

    // Error State
    if (error) {
        return (
            <section
                className="py-12 sm:py-16 lg:py-20 px-4 bg-white"
                aria-label="Featured products section"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 mb-4">
                            Featured Products
                        </h2>
                    </div>
                    <ErrorBoundary error={error} onRetry={loadProducts} />
                </div>
            </section>
        );
    }

    // Main Content
    return (
        <section
            className="py-12 sm:py-16 lg:py-20 px-4 bg-white"
            aria-label="Featured products section"
        >
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <header className="text-center mb-8 sm:mb-12 lg:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 mb-4">
                        Featured Products
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-4">
                        Discover our top-rated water purification solutions designed to keep your family healthy and hydrated.
                    </p>
                    <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mt-6 rounded" aria-hidden="true" />
                </header>

                {/* Products Grid */}
                {products.length > 0 ? (
                    <>
                        <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
                            role="list"
                            aria-label="Featured products"
                        >
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    onBuyNow={handleBuyNow}
                                />
                            ))}
                        </div>

                        {/* View More Link */}
                        <nav className="text-center sm:text-right mt-8 lg:mt-12" aria-label="View all products">
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base md:text-lg group transition-all duration-200 hover:gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                                aria-label="View all products in the catalog"
                                title="View all products"
                            >
                                <span>View all products</span>
                                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        </nav>
                    </>
                ) : (
                    <div
                        className="text-center py-12 px-4"
                        role="status"
                        aria-live="polite"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full mb-4">
                            <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" aria-hidden="true" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                            No Products Available
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
                            No featured products are available at the moment. Please check back later.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}