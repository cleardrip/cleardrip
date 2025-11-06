"use client";
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { Plus, Minus, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Footer from '@/components/layout/Footer';
import { useRazorpayPayment } from '@/hooks/usePayment';
import { PaymentProcessingModal } from '@/components/payment/Processing';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

// Skeleton Components
const CartItemSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 animate-pulse">
        <div className="w-full sm:w-24 h-24 bg-gray-200 rounded-md"></div>
        <div className="flex-1 flex flex-col space-y-3">
            <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <div className="h-9 bg-gray-200 rounded-lg w-28"></div>
                <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
            </div>
        </div>
    </div>
);

const PriceSummarySkeleton = () => (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-5 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="space-y-3">
            <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <div className="h-5 bg-gray-200 rounded w-28"></div>
                <div className="h-7 bg-gray-200 rounded w-24"></div>
            </div>
        </div>
        <div className="h-11 bg-gray-200 rounded-md mt-6"></div>
    </div>
);

const DeliveryInfoSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 animate-pulse">
        <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
    </div>
);

const CartPage: React.FC = () => {
    const {
        loading,
        cartItems,
        updateQuantity,
        removeFromCart,
        addToCart,
        cartCount,
        clearCart,
        getTotalAmount,
        getTotalMRP,
        getTotalDiscount,
    } = useCart();
    const { isProcessing, startPayment } = useRazorpayPayment();

    const { user } = useAuth();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        itemId: string;
        itemName: string;
    }>({
        open: false,
        itemId: '',
        itemName: '',
    });

    const totalQuantity = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }, [cartItems]);

    const handleQuantityChange = useCallback((id: string, newQuantity: number) => {
        const qty = Math.max(1, Math.floor(newQuantity));
        updateQuantity(id, qty);
    }, [updateQuantity]);

    const handlePlaceOrder = useCallback(() => {
        if (cartItems.length === 0) return;
        if (isProcessing) return;
        startPayment({
            paymentFor: "PRODUCT",
            products: cartItems.map(item => ({
                productId: item.id,
                quantity: item.quantity,
            })),
            onSuccess: (data) => {
                toast.success("Payment successful! Order placed.");
                clearCart();
                router.push('/dashboard/orders');
            },
            onError: (error) => {
                toast.error(`Payment failed: ${error.message}`);
            },
        });
    }, [cartItems, isProcessing, startPayment, router]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getExpectedDeliveryDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const getUserDisplayName = () => {
        return user?.name || user?.email?.split("@")[0] || "User";
    };

    const getFormattedDeliveryAddress = () => {
        if (!user?.address) {
            return (
                <button
                    onClick={() => router.push('/user/dashboard?tab=profile&returnTo=/cart')}
                    className="text-sm text-blue-600 hover:text-blue-700 underline cursor-pointer font-medium"
                >
                    + Add delivery address
                </button>
            );
        }

        const { street, city, state, postalCode, country } = user.address;

        return (
            <div className="text-sm text-gray-600 leading-relaxed">
                <div className="font-medium">{street}</div>
                <div>{city}, {state} {postalCode}</div>
                <div>{country}</div>
            </div>
        );
    };

    const hasValidAddress = useMemo(() => {
        return !!(user?.address?.street && user?.address?.city && user?.address?.state && user?.address?.postalCode);
    }, [user?.address]);

    const getPlaceOrderDisabledReason = useCallback(() => {
        if (cartItems.length === 0) return "Your cart is empty";
        if (isProcessing) return "Payment is being processed";
        if (!hasValidAddress) return "Please add a delivery address to continue";
        return "";
    }, [cartItems.length, isProcessing, hasValidAddress]);

    const handleShare = useCallback(async (name: string, id: string): Promise<void> => {
        const url = `${window.location.origin}/products/${id}`;
        const text = `Check out "${name}" on ClearDrip:`;
        try {
            if (navigator.share) {
                await navigator.share({ title: name, text, url });
                toast.success('Shared successfully');
                return;
            }
            const shareString = `${text} ${url}`;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(shareString);
                toast.success('Link copied to clipboard');
                return;
            }
            const input = document.createElement('input');
            input.value = shareString;
            document.body.appendChild(input);
            input.select();
            if (document.execCommand && document.execCommand('copy')) {
                toast.success('Link copied to clipboard');
            } else {
                toast.error('Unable to copy link');
            }
            input.remove();
        } catch (err: any) {
            if (err && (err.name === 'AbortError' || err.message === 'Share canceled')) {
                return;
            }
            toast.error(`Could not share: ${err?.message ?? 'unknown error'}`);
        }
    }, []);

    const handleDelete = useCallback(async (id: string, name: string): Promise<void> => {
        const itemToRemove = cartItems.find(i => i.id === id);
        if (!itemToRemove) {
            toast.error('Item not found in cart');
            return;
        }

        setConfirmModal({
            open: true,
            itemId: id,
            itemName: name,
        });
    }, [cartItems]);

    const handleConfirmDelete = useCallback(() => {
        const { itemId, itemName } = confirmModal;
        const itemToRemove = cartItems.find(i => i.id === itemId);

        if (!itemToRemove) {
            toast.error('Item not found in cart');
            return;
        }

        try {
            removeFromCart(itemId);
            toast.success(`Removed "${itemName}" from cart`, {
                action: {
                    label: 'Undo',
                    onClick: () => {
                        const restoreItem = { ...itemToRemove, quantity: itemToRemove.quantity ?? 1 };
                        try {
                            addToCart(restoreItem);
                            toast.success(`Restored "${itemName}"`);
                        } catch (err) {
                            toast.error(`Could not restore "${itemName}"`);
                        }
                    }
                }
            });
        } catch (err: any) {
            toast.error(`Could not remove item: ${err?.message ?? 'unknown error'}`);
        }
    }, [confirmModal, cartItems, removeFromCart, addToCart]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let addedState = false;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        const handlePopState = () => {
            if (isProcessing) {
                window.history.pushState(null, document.title, window.location.href);
                toast.error('Payment is processing — please do not navigate away.');
            }
        };

        if (isProcessing) {
            window.addEventListener('beforeunload', handleBeforeUnload);
            try {
                window.history.pushState(null, document.title, window.location.href);
                addedState = true;
            } catch { }
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            if (addedState) {
                try { window.history.back(); } catch { }
            }
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isProcessing]);

    useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <PaymentProcessingModal open={isProcessing} total={getTotalAmount()} />

            <ConfirmationModal
                open={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, itemId: '', itemName: '' })}
                onConfirm={handleConfirmDelete}
                title="Remove Item"
                message={`Are you sure you want to remove "${confirmModal.itemName}" from your cart?`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
            />

            <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-8 py-4 lg:py-10 flex-1">
                {isLoading || loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                            <DeliveryInfoSkeleton />
                            <div className="space-y-3 sm:space-y-4">
                                <CartItemSkeleton />
                                <CartItemSkeleton />
                                <CartItemSkeleton />
                            </div>
                        </div>
                        <div className="lg:col-span-1 mt-4 lg:mt-0">
                            <PriceSummarySkeleton />
                        </div>
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="w-28 h-28 sm:w-36 sm:h-36 mb-6 sm:mb-8 mx-auto rounded-xl bg-white shadow-md flex items-center justify-center">
                            <svg viewBox="0 0 200 150" className="w-20 h-20 text-blue-600">
                                <path
                                    d="M20 40 L40 40 L50 100 L160 100 L170 40 L60 40"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <circle cx="70" cy="120" r="8" fill="currentColor" />
                                <circle cx="140" cy="120" r="8" fill="currentColor" />
                                <path
                                    d="M60 70 L140 70"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-2 sm:mb-3">
                            Your cart is currently empty
                        </h2>
                        <p className="text-gray-600 mb-4 sm:mb-6 max-w-md">
                            Browse products and services to begin — your selected items will appear here.
                        </p>
                        <Button
                            onClick={() => router.push('/')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 sm:px-6 sm:py-3 text-base rounded-md transition-all duration-150"
                            aria-label="Continue shopping"
                        >
                            Continue Shopping
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                            {user && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-600 mb-1" title="Delivery recipient name">
                                                <span className="font-semibold text-gray-800">Deliver to:</span> {getUserDisplayName()}
                                            </p>
                                            <div className="mb-2 text-sm text-gray-700">{getFormattedDeliveryAddress()}</div>
                                            <p className="text-sm text-gray-900" title="Estimated delivery timeline">
                                                Expected delivery by <span className="font-medium">{getExpectedDeliveryDate()}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 transition-shadow hover:shadow-md">
                                        <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mb-2 sm:mb-0" title={item.name}>
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="text-sm text-gray-400">No image</div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                                                </div>
                                                <div className="text-right mt-1 sm:mt-0">
                                                    <div className="text-sm font-medium text-gray-900">{formatPrice(item.price)}</div>
                                                    {item.originalPrice > item.price && (
                                                        <div className="text-xs text-gray-500 line-through">{formatPrice(item.originalPrice)}</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
                                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                                                        className={`p-2 hover:bg-gray-100 transition-all duration-150 ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        aria-label={`Decrease quantity for ${item.name}`}
                                                        title={item.quantity <= 1 ? "Minimum quantity is 1" : `Decrease quantity for ${item.name}`}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                    <span className="px-3 sm:px-4 py-2 text-sm font-medium border-l border-r border-gray-300 min-w-[40px] sm:min-w-[56px] text-center" title={`Current quantity: ${item.quantity}`}>
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                                                        className="p-2 hover:bg-gray-100 transition-all duration-150"
                                                        aria-label={`Increase quantity for ${item.name}`}
                                                        title={`Increase quantity for ${item.name}`}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="flex gap-2 mt-2 sm:mt-0">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleShare(item.name, item.id)}
                                                        className="text-sm py-1 px-2 hover:bg-blue-50 transition-all duration-150"
                                                        aria-label={`Share ${item.name}`}
                                                        title={`Share ${item.name} with others`}
                                                    >
                                                        <Share2 className="w-4 h-4 mr-2" /> Share
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleDelete(item.id, item.name)}
                                                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-sm py-1 px-2 transition-all duration-150"
                                                        aria-label={`Remove ${item.name} from cart`}
                                                        title={`Remove ${item.name} from your cart`}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-1 mt-4 lg:mt-0">
                            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-5 md:sticky md:top-6">
                                <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-3 sm:mb-4" title="Summary of your cart items">
                                    Price Details ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} Item{cartItems.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''})
                                </h3>

                                <div className="space-y-2 sm:space-y-3 text-sm text-gray-700">
                                    <div className="flex justify-between" title="Total price before discount">
                                        <span className="text-gray-600">Total MRP</span>
                                        <span className="font-medium">{formatPrice(getTotalMRP())}</span>
                                    </div>

                                    {getTotalDiscount() > 0 && (
                                        <div className="flex justify-between text-sm" title="Total savings on this order">
                                            <span className="text-gray-600">Discount on MRP</span>
                                            <span className="font-medium text-green-600">-{formatPrice(getTotalDiscount())}</span>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-200 pt-3 sm:pt-4">
                                        <div className="flex justify-between items-center" title="Final amount to be paid">
                                            <span className="font-semibold text-gray-900">Total Amount</span>
                                            <span className="font-bold text-xl sm:text-2xl text-gray-900">{formatPrice(getTotalAmount())}</span>
                                        </div>
                                    </div>
                                </div>

                                {!hasValidAddress && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                        <p className="text-xs text-amber-800 font-medium">
                                            ⚠️ Please add a delivery address to place your order
                                        </p>
                                    </div>
                                )}

                                <Button
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing || cartItems.length === 0 || !hasValidAddress}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 text-base font-semibold rounded-md mt-4 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Place order"
                                    title={getPlaceOrderDisabledReason() || "Proceed to payment and place your order"}
                                >
                                    {isProcessing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                            </svg>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <span>Place Order</span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default CartPage;
