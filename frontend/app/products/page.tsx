"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Package, AlertCircle, Search, ShoppingCart, Star, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types/products';
import { useRouter } from 'next/navigation';
import { ProductsClass } from '@/lib/httpClient/product';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useAuthMiddleware } from '@/lib/middleware/authMiddleware';
import { AuthRequiredDialog } from '@/components/auth/AuthRequiredDialog';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const { addToCart, removeFromCart } = useCart();
    const limit = 12;
    const { user } = useAuth();

    const { showAuthDialog, setShowAuthDialog } = useAuthMiddleware({
        redirectDelay: 5000,
        showDialog: true,
    });

    const totalPages = Math.ceil(totalProducts / limit);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        loadProducts();
    }, [currentPage, debouncedSearchTerm]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ProductsClass.getAllProducts(currentPage, limit, debouncedSearchTerm);
            setProducts(data.products);
            setTotalProducts(data.total);
        }
        catch (err) {
            setError('Failed to load products. Please try again.');
            console.error('Error loading products:', err);
        }
        finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleProductClick = (productId: string) => {
        router.push(`/products/${productId}`);
    };

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user || !user.id) {
            setShowAuthDialog(true);
            return;
        }

        const cartItem = {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            originalPrice: Number(product.price),
            image: product.image,
        };
        addToCart(cartItem);
        toast.success(`Added ${product.name} to cart!`, {
            description: "You can view your cart for checkout.",
            action: {
                label: 'View Cart',
                onClick: () => router.push('/cart'),
            },
        });
    };

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const filteredProducts = products;

    const ProductCard = ({ product }: { product: Product }) => (
        <Card className="group h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-0 shadow-md overflow-hidden"
            onClick={() => handleProductClick(product.id)}
        >
            {product.image && (
                <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="relative w-full h-full">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                </div>
            )}

            <CardHeader className="pb-2 sm:pb-3 flex-none px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-[10px] sm:text-xs text-gray-500 ml-0.5 sm:ml-1">(4.0)</span>
                    </div>
                </div>
                <CardTitle className="text-sm sm:text-base md:text-lg line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                    {product.name}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 pb-2 sm:pb-3 px-3 sm:px-6">
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-4">
                    {product.description}
                </p>
                <div className="flex items-baseline gap-2">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0 flex gap-1.5 sm:gap-2 px-3 sm:px-6 pb-3 sm:pb-6">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200 hover:border-gray-300 text-xs sm:text-sm h-8 sm:h-9 cursor-pointer"
                    onClick={(e) => handleAddToCart(product, e)}
                >
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Add to cart</span>
                    <span className="xs:hidden">Add</span>
                </Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-8 sm:h-9 cursor-pointer">
                    <span className="text-white">View</span>
                </Button>
            </CardFooter>
        </Card>
    );

    const ProductSkeleton = () => (
        <Card className="h-full border-0 shadow-md overflow-hidden animate-pulse">
            <div className="relative aspect-square sm:aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <Skeleton className="w-3/4 h-3/4 rounded-lg" />
            </div>
            <CardHeader className="pb-2 sm:pb-3 flex-none px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-2/3 mb-2" />
            </CardHeader>
            <CardContent className="flex-1 pb-2 sm:pb-3 px-3 sm:px-6">
                <Skeleton className="h-4 w-full mb-2 sm:mb-4" />
                <Skeleton className="h-6 w-24" />
            </CardContent>
            <CardFooter className="pt-0 flex gap-1.5 sm:gap-2 px-3 sm:px-6 pb-3 sm:pb-6">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
            </CardFooter>
        </Card>
    );

    const PaginationControls = () => (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
            <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalProducts)} of {totalProducts} products
            </div>

            <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 sm:h-9 px-2 sm:px-3"
                >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
                </Button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2);
                        if (page > totalPages) return null;

                        return (
                            <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="w-7 h-7 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm"
                            >
                                {page}
                            </Button>
                        );
                    })}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 sm:h-9 px-2 sm:px-3"
                >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">

            <AuthRequiredDialog
                isOpen={showAuthDialog}
                onClose={() => setShowAuthDialog(false)}
                redirectDelay={5000}
                actionType="payment"
            />

            <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3 text-gray-900">
                        <Package className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
                        Products
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                        Discover our wide range of products
                    </p>
                </div>

                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="relative flex-1 flex flex-col sm:flex-row items-stretch">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 sm:pl-10 pr-9 sm:pr-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-9 sm:h-10 text-sm sm:text-base"
                            />
                            {searchTerm && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                    aria-label="Clear search"
                                >
                                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>
                            )}
                        </div>

                    </div>
                </div>
                {debouncedSearchTerm && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:ml-4">
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded shadow self-center sm:self-auto">
                            Searching for: <span className="font-semibold break-all">{debouncedSearchTerm}</span>
                        </span>
                        <button
                            onClick={handleClearSearch}
                            className="inline-flex items-center justify-center rounded hover:bg-blue-100 focus:bg-blue-200 transition-colors p-1 cursor-pointer"
                            aria-label="Clear search"
                            tabIndex={0}
                        >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 hover:text-blue-600" />
                        </button>
                    </div>
                )}
                {error && (
                    <Alert className="mb-4 sm:mb-6 border-red-200 bg-red-50" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                    {loading ? (
                        Array.from({ length: limit }, (_, i) => (
                            <ProductSkeleton key={i} />
                        ))
                    ) : (
                        filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    )}
                </div>

                {!loading && filteredProducts.length === 0 && (
                    <div className="text-center py-12 sm:py-16">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                            <Package className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900">No products found</h3>
                        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto px-4">
                            {debouncedSearchTerm ? 'Try adjusting your search terms or browse our categories' : 'No products available at the moment'}
                        </p>
                        {debouncedSearchTerm && (
                            <Button
                                variant="outline"
                                onClick={handleClearSearch}
                                className="mt-4 text-sm sm:text-base"
                            >
                                Clear search
                            </Button>
                        )}
                    </div>
                )}

                {!loading && filteredProducts.length > 0 && (
                    <PaginationControls />
                )}
            </div>

            <Footer />
        </div>
    );
}
