"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Package, AlertCircle, Search, Filter, ShoppingCart, Star, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from '@/lib/types/products';
import { useRouter } from 'next/navigation';
import { ProductsClass } from '@/lib/httpClient/product';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import Footer from '@/components/layout/Footer';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToCart } = useCart();
    const limit = 12;

    const totalPages = Math.ceil(totalProducts / limit);

    useEffect(() => {
        loadProducts();
    }, [currentPage]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ProductsClass.getAllProducts(currentPage, limit);
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
        e.stopPropagation(); // Prevent card click
        const cartItem = {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            originalPrice: Number(product.price), // Assuming no discount for now
            image: product.image, // Only use backend image
        };
        addToCart(cartItem);
        toast.success(`Added ${product.name} to cart!`);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const ProductCard = ({ product }: { product: Product }) => (
        <Card className="group h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border-0 shadow-md overflow-hidden"
            onClick={() => handleProductClick(product.id)}
        >
            {/* Product Image - Only show if backend provides one */}
            {product.image && (
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    {/* <div className="absolute top-3 left-3 z-10">
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs">
                            Featured
                        </Badge>
                    </div> */}
                    <div className="relative w-full h-full">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                </div>
            )}

            <CardHeader className="pb-3 flex-none">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">(4.0)</span>
                    </div>
                </div>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.name}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 pb-3">
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {product.description}
                </p>
                <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-blue-600">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="pt-0 flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200 hover:border-gray-300"
                    onClick={(e) => handleAddToCart(product, e)}
                >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to cart
                </Button>
                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Buy now
                </Button>
            </CardFooter>
        </Card>
    );

    const ProductSkeleton = () => (
        <Card className="h-full border-0 shadow-md overflow-hidden">
            <div className="aspect-[4/3] bg-gray-100">
                <Skeleton className="w-full h-full" />
            </div>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-3/4 mb-2" />
            </CardHeader>
            <CardContent className="flex-1 pb-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-6 w-20" />
            </CardContent>
            <CardFooter className="pt-0">
                <div className="flex gap-2 w-full">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                </div>
            </CardFooter>
        </Card>
    );

    const PaginationControls = () => (
        <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalProducts)} of {totalProducts} products
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
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
                                className="w-8 h-8 p-0"
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
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-gray-900">
                        <Package className="h-8 w-8 text-blue-600" />
                        Products
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Discover our wide range of products
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

                {/* Empty State */}
                {!loading && filteredProducts.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-900">No products found</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            {searchTerm ? 'Try adjusting your search terms or browse our categories' : 'No products available at the moment'}
                        </p>
                        {searchTerm && (
                            <Button
                                variant="outline"
                                onClick={() => setSearchTerm('')}
                                className="mt-4"
                            >
                                Clear search
                            </Button>
                        )}
                    </div>
                )}

                {/* Pagination */}
                {!loading && filteredProducts.length > 0 && !searchTerm && (
                    <PaginationControls />
                )}
            </div>
            
            <Footer />
        </div>
    );
}
