"use client"
import React, { useState, useEffect, use, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ChevronLeft,
    AlertCircle,
    Truck,
    Shield,
    RotateCcw,
    ShoppingCart,
    Minus,
    Plus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product } from '@/lib/types/products';
import { useRouter } from 'next/navigation';
import { ProductsClass } from '@/lib/httpClient/product';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import Footer from '@/components/layout/Footer';

interface ProductDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
    const resolvedParams = use(params);
    const productId = resolvedParams.id;
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isInCart, setIsInCart] = useState(false);
    const [cartQuantity, setCartQuantity] = useState(0);
    const { addToCart, removeFromCart } = useCart();
    const addToCartLoading = useRef(false);

    useEffect(() => {
        if (productId) {
            loadProductDetails();
        }
    }, [productId]);

    const loadProductDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const productData = await ProductsClass.getProductById(productId);
            setProduct(productData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load product details');
        }
        finally {
            setLoading(false);
        }
    };

    const handleBackToProducts = () => {
        router.push("/products");
    };

    const handleAddToCart = () => {
        if (!product || addToCartLoading.current) return;
        addToCartLoading.current = true;

        const cartItem = {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            originalPrice: Number(product.price),
            image: product.image,
        };

        for (let i = 0; i < quantity; i++) {
            addToCart(cartItem);
        }

        setIsInCart(true);
        setCartQuantity(quantity);

        toast.success(`Added ${quantity} ${product.name}(s) to cart!`, {
            description: 'You can view your cart to proceed to checkout.',
            action: { label: 'View Cart', onClick: () => router.push('/cart') }
        });

        addToCartLoading.current = false;
    };

    const handleIncreaseCartQuantity = () => {
        if (!product) return;

        const cartItem = {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            originalPrice: Number(product.price),
            image: product.image,
        };

        addToCart(cartItem);
        setCartQuantity(prev => prev + 1);
    };

    const handleDecreaseCartQuantity = () => {
        if (!product || cartQuantity <= 1) return;

        removeFromCart(product.id);
        setCartQuantity(prev => prev - 1);
    };

    const handleBuyNow = () => {
        if (addToCartLoading.current) return;
        handleAddToCart();
        router.push('/cart');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto">
                        <Skeleton className="h-10 w-32 mb-8" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Skeleton className="aspect-square w-full rounded-lg" />
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <Skeleton className="h-6 w-20 mb-2" />
                                    <Skeleton className="h-8 w-3/4 mb-2" />
                                    <Skeleton className="h-6 w-1/2 mb-4" />
                                    <Skeleton className="h-6 w-32 mb-4" />
                                    <Skeleton className="h-10 w-24 mb-6" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto text-center">
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                        <div className="space-y-4">
                            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto" />
                            <h3 className="text-lg font-medium">Product not found</h3>
                            <p className="text-gray-600">
                                The product you're looking for doesn't exist or has been removed.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button onClick={loadProductDetails} variant="outline">
                                    Try Again
                                </Button>
                                <Button onClick={handleBackToProducts}>
                                    Back to Products
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 sm:mb-6 lg:mb-8 overflow-x-auto">
                        <Button
                            variant="ghost"
                            onClick={handleBackToProducts}
                            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base whitespace-nowrap"
                            aria-label="Back to Products"
                        >
                            <ChevronLeft className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">Back to Products</span>
                            <span className="sm:hidden">Back</span>
                        </Button>
                        <span className="text-gray-400">/</span>
                        <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                        {product.image && (
                            <div className="space-y-4">
                                <div className="aspect-square bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                        title={product.name}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 sm:space-y-6">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                                    {product.name}
                                </h1>

                                <p className="text-gray-600 text-base sm:text-lg mb-4 sm:mb-6">
                                    {product.description}
                                </p>

                                <div className="flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <div className="text-3xl sm:text-4xl font-bold text-blue-600">
                                        ₹{Number(product.price).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                {!isInCart ? (
                                    <>
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <span className="font-medium text-gray-900 text-sm sm:text-base">Quantity:</span>
                                            <div className="flex items-center border border-gray-200 rounded-lg" role="group" aria-label="Quantity selector">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                                                    aria-label="Decrease quantity"
                                                    title="Decrease quantity"
                                                >
                                                    <Minus className="h-4 w-4" aria-hidden="true" />
                                                </Button>
                                                <span className="w-10 sm:w-12 text-center font-medium text-sm sm:text-base" aria-live="polite" aria-atomic="true">{quantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setQuantity(quantity + 1)}
                                                    className="h-9 w-9 sm:h-10 sm:w-10 p-0"
                                                    aria-label="Increase quantity"
                                                    title="Increase quantity"
                                                >
                                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                            <Button
                                                onClick={handleAddToCart}
                                                variant="outline"
                                                size="lg"
                                                className={`flex-1 h-12 sm:h-12 border-gray-300 hover:border-gray-400 text-sm sm:text-base ${addToCartLoading.current ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={addToCartLoading.current}
                                                aria-label={`Add ${quantity} ${product.name}${quantity > 1 ? 's' : ''} to cart`}
                                                title="Add to cart"
                                            >
                                                {addToCartLoading.current ? <Skeleton className="h-4 w-4" /> : <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" aria-hidden="true" />}
                                                <span className="text-black">Add to cart</span>
                                            </Button>
                                            <Button
                                                onClick={handleBuyNow}
                                                size="lg"
                                                className={`flex-1 h-12 sm:h-12 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base ${addToCartLoading.current ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={addToCartLoading.current}
                                                aria-label={`Buy ${quantity} ${product.name}${quantity > 1 ? 's' : ''} now`}
                                                title="Buy now"
                                            >
                                                {addToCartLoading.current ? <Skeleton className="h-4 w-4" /> : <span className="text-white">Buy now</span>}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <div className="flex items-center justify-between border border-gray-300 rounded-lg px-4 py-3 flex-1">
                                            <span className="font-medium text-gray-900 text-sm sm:text-base">In Cart:</span>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleDecreaseCartQuantity}
                                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                                    aria-label="Decrease cart quantity"
                                                    title="Decrease quantity"
                                                    disabled={cartQuantity <= 1}
                                                >
                                                    <Minus className="h-4 w-4" aria-hidden="true" />
                                                </Button>
                                                <span className="w-8 text-center font-semibold text-base" aria-live="polite">{cartQuantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleIncreaseCartQuantity}
                                                    className="h-8 w-8 p-0 hover:bg-gray-100"
                                                    aria-label="Increase cart quantity"
                                                    title="Increase quantity"
                                                >
                                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => router.push('/cart')}
                                            size="lg"
                                            className="flex-1 h-12 sm:h-12 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                                            aria-label="View cart"
                                            title="View cart"
                                        >
                                            <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" aria-hidden="true" />
                                            <span className="text-white">View Cart</span>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-50 rounded-lg sm:rounded-xl" role="list" aria-label="Product benefits">
                                <div className="flex items-center gap-3" role="listitem">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
                                        <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 text-sm sm:text-base">Free Shipping</div>
                                        <div className="text-xs sm:text-sm text-gray-500">On orders above ₹500</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3" role="listitem">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
                                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 text-sm sm:text-base">2 Year Warranty</div>
                                        <div className="text-xs sm:text-sm text-gray-500">Manufacturer warranty</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3" role="listitem">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0" aria-hidden="true">
                                        <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900 text-sm sm:text-base">30 Day Returns</div>
                                        <div className="text-xs sm:text-sm text-gray-500">Easy returns policy</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 sm:mt-12 lg:mt-16">
                        <Tabs defaultValue="description" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                                <TabsTrigger value="description" className="text-xs sm:text-sm">Description</TabsTrigger>
                                <TabsTrigger value="specifications" className="text-xs sm:text-sm">Specifications</TabsTrigger>
                            </TabsList>

                            <TabsContent value="description" className="mt-4 sm:mt-6 lg:mt-8">
                                <Card className="border-0 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg sm:text-xl">Product Description</CardTitle>
                                    </CardHeader>
                                    <CardContent className="prose max-w-none">
                                        <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                                            {product.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="specifications" className="mt-4 sm:mt-6 lg:mt-8">
                                <Card className="border-0 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg sm:text-xl">Specifications</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 sm:space-y-4">
                                            <div className="grid grid-cols-2 gap-4 py-2 sm:py-3 border-b border-gray-100">
                                                <span className="font-medium text-gray-900 text-sm sm:text-base">Price</span>
                                                <span className="text-gray-700 text-sm sm:text-base">₹{Number(product.price).toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 py-2 sm:py-3 border-b border-gray-100">
                                                <span className="font-medium text-gray-900 text-sm sm:text-base">Category</span>
                                                <span className="text-gray-700 text-sm sm:text-base">Water Purification</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 py-2 sm:py-3">
                                                <span className="font-medium text-gray-900 text-sm sm:text-base">Warranty</span>
                                                <span className="text-gray-700 text-sm sm:text-base">2 Years</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}