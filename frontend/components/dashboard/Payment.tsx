"use client";
import { APIURL } from '@/utils/env';
import React from 'react'

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" | "CANCELLED";
type PaymentPurpose = "SERVICE_BOOKING" | "SUBSCRIPTION" | "PRODUCT_PURCHASE" | "OTHER";

interface Service {
    id: string;
    name: string;
    description: string;
    type: string;
    image?: string | null;
    price: string;
    duration: number;
    isActive: boolean;
    adminId: string;
    createdAt: string;
    updatedAt: string;
}
interface Slot {
    id: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    updatedAt: string;
}
interface Product {
    id: string;
    name?: string;
    price?: string;
    description?: string | null;
    image?: string | null;
    inventory?: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}

interface Plan {
    id: string;
    name?: string;
    description?: string;
    price?: string;
    duration?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface Booking {
    id: string;
    userId: string;
    serviceId: string;
    slotId: string;
    status: string;
    beforeImageUrl: string | null,
    afterImageUrl: string | null,
    createdAt: "2025-11-05T15:48:25.430Z",
    updatedAt: "2025-11-05T15:48:51.537Z",
    service: Service,
    slot: Slot
}

interface Transaction {
    id: string;
    orderId: string;
    razorpayPaymentId?: string | null;
    razorpaySignature?: string | null;
    status?: string | null;
    method?: string | null;
    amountPaid?: string | null;
    capturedAt?: string | null;
    errorReason?: string | null;
    createdAt?: string | null;
}

interface Item {
    id: string;
    orderId?: string;
    productId?: string;
    quantity?: number;
    price?: string;
    subtotal?: string;
    createdAt?: string;
    updatedAt?: string;
    product?: Product | null;
    order?: Record<string, any> | null;
}

interface Subscription {
    id: string;
    userId?: string;
    planId?: string;
    startDate?: string;
    endDate?: string;
    createdAt?: string;
    updatedAt?: string;
    status?: string;
    plan?: Plan | null;
    PaymentOrder?: Array<Pick<Payment, 'id' | 'razorpayOrderId' | 'amount' | 'currency' | 'status' | 'purpose' | 'createdAt'>> | null;
}

interface Payment {
    id: string;
    razorpayOrderId?: string | null;
    amount?: string | null;
    currency?: string | null;
    status?: PaymentStatus | string | null;
    purpose?: PaymentPurpose | string | null;
    userId?: string | null;
    bookingId?: string | null;
    subscriptionId?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    transaction?: Transaction | null;
    items?: Item[] | null;
    subscription?: Subscription | null;
    booking?: Booking | null;
}

const Payment = () => {
    const [paymentData, setPaymentData] = React.useState<Payment[] | null>(null);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<Error | null>(null);
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
    const [page, setPage] = React.useState<number>(1);
    const [limit, setLimit] = React.useState<number>(10);
    const [search, setSearch] = React.useState<string>('');
    const [debouncedSearch, setDebouncedSearch] = React.useState<string>('');
    const [total, setTotal] = React.useState<number | null>(null);

    React.useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 450);
        return () => clearTimeout(t);
    }, [search]);

    React.useEffect(() => {
        let mounted = true;
        const fetchPaymentData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('page', String(page));
                params.set('limit', String(limit));
                params.set('search', debouncedSearch || '');

                const url = `${APIURL}/payment/user/payments?${params.toString()}`;
                const response = await fetch(url, { method: 'GET', credentials: 'include' });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || errorData.message || 'Network response was not ok');
                }

                const data = await response.json().catch(() => null);
                let payments: Payment[] = [];
                let totalCount: number | null = null;

                if (Array.isArray(data)) {
                    payments = data;
                    totalCount = data.length;
                } else if (data && Array.isArray(data.payments)) {
                    payments = data.payments;
                    totalCount = typeof data.total === 'number' ? data.total : data.payments.length;
                } else if (data && Array.isArray(data.data)) {
                    payments = data.data;
                    totalCount = typeof data.total === 'number' ? data.total : data.data.length;
                } else if (data && data.payments === undefined && data.data === undefined && data) {
                    const arr = Object.values(data).find(v => Array.isArray(v)) as Payment[] | undefined;
                    if (arr) {
                        payments = arr;
                        totalCount = arr.length;
                    }
                }

                if (!mounted) return;
                setPaymentData(payments);
                setTotal(totalCount);
                setError(null);
            } catch (err: any) {
                const e = err instanceof Error ? err : new Error(String(err));
                if (!mounted) return;
                setError(e);
                setPaymentData([]);
                setTotal(0);
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        };

        fetchPaymentData();
        return () => {
            mounted = false;
        };
    }, [page, limit, debouncedSearch]);

    const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : '-');
    const formatCurrency = (amt?: string | null, currency?: string | null) => {
        if (!amt) return '-';
        const n = Number(amt);
        if (Number.isNaN(n)) return amt;
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR' }).format(n);
    };

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const statusBgClass = (s?: string | null) => {
        if (!s) return 'bg-gray-300';
        if (s === 'SUCCESS') return 'bg-green-600';
        if (s === 'PENDING') return 'bg-yellow-600';
        if (s === 'FAILED' || s === 'CANCELLED') return 'bg-red-600';
        return 'bg-gray-500';
    };

    const clearSearch = () => {
        setSearch('');
        setDebouncedSearch('');
        setPage(1);
    };

    const SkeletonCard = () => (
        <div className="animate-pulse border border-gray-200 p-3 rounded-lg bg-white flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
                <div className="text-right space-y-2">
                    <div className="h-6 bg-slate-200 rounded w-24" />
                    <div className="flex gap-2 justify-end">
                        <div className="h-6 bg-slate-200 rounded-full w-16" />
                        <div className="h-6 bg-slate-200 rounded w-20" />
                    </div>
                </div>
            </div>
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex gap-6 flex-wrap">
                <div className="space-y-1">
                    <div className="h-3 bg-slate-200 rounded w-16" />
                    <div className="h-4 bg-slate-200 rounded w-24" />
                </div>
                <div className="space-y-1">
                    <div className="h-3 bg-slate-200 rounded w-12" />
                    <div className="h-4 bg-slate-200 rounded w-8" />
                </div>
                <div className="space-y-1">
                    <div className="h-3 bg-slate-200 rounded w-20" />
                    <div className="h-4 bg-slate-200 rounded w-32" />
                </div>
            </div>
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-200 rounded w-48" />
                <div className="h-8 bg-slate-200 rounded w-28" />
            </div>
        </div>
    );

    return (
        <div className="grid gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                    <div className="flex gap-2 items-center w-full sm:w-auto">
                        <input
                            placeholder="Search payments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="px-3 py-2 border rounded-md text-sm w-full sm:w-64"
                        />
                        <select
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                            className="px-2 py-1 border rounded-md text-sm"
                        >
                            <option value={5}>5 / page</option>
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                        </select>
                    </div>
                    {(search || debouncedSearch) && (
                        <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            <div className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                                Active search: "{debouncedSearch || search}"
                            </div>
                            <button
                                onClick={clearSearch}
                                className="text-xs text-gray-600 px-2 py-1 rounded border bg-white"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
                <div className="text-sm text-gray-600">
                    {total !== null ? `Showing page ${page} of ${Math.max(1, Math.ceil(total / limit))} • ${total} total` : `Page ${page} • ${paymentData?.length ?? 0} shown`}
                </div>
            </div>

            {error && <div className="text-red-600">Error: {error.message}</div>}

            {loading ? (
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: Math.min(6, limit) }).map((_, i) => (
                        <div key={`sk-${i}`}><SkeletonCard /></div>
                    ))}
                </div>
            ) : (!paymentData || paymentData.length === 0) ? (
                <p>No payments found.</p>
            ) : (
                <ul className="space-y-3">
                    {paymentData.map((p, pIdx) => (
                        <li key={p.id ?? `payment-${pIdx}`} className="border border-gray-200 p-3 rounded-lg bg-white flex flex-col">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold truncate">
                                        {p.razorpayOrderId ?? p.id}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {p.userId ? `User: ${p.userId}` : ''}
                                    </div>
                                </div>
                                <div className="text-right mt-3 sm:mt-0">
                                    <div className="text-lg font-extrabold">
                                        {formatCurrency(p.amount ?? undefined, p.currency ?? 'INR')}
                                    </div>
                                    <div className="flex justify-end gap-2 items-center mt-1">
                                        <div className={`${statusBgClass(p.status)} text-white text-xs font-semibold px-2 py-1 rounded-full`}>
                                            {p.status ?? '—'}
                                        </div>
                                        <div className="text-xs text-gray-500">{p.purpose ?? '—'}</div>
                                    </div>
                                </div>
                            </div>
                            <hr className="my-2" />
                            <div className="flex gap-6 flex-wrap items-center text-sm">
                                <div className="min-w-[90px]">
                                    <div className="text-xs text-gray-600">Created</div>
                                    <div>{formatDate(p.createdAt)}</div>
                                </div>
                                <div className="min-w-[60px]">
                                    <div className="text-xs text-gray-600">Items</div>
                                    <div>{p.items?.length ?? 0}</div>
                                </div>
                                <div className="min-w-[140px]">
                                    <div className="text-xs text-gray-600">Subscription</div>
                                    <div>{p.subscription ? `${p.subscription.plan?.name ?? p.subscription.planId ?? 'plan'} (${p.subscription.status ?? '—'})` : '—'}</div>
                                </div>
                            </div>
                            <hr className="my-2" />
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div className="text-sm text-gray-600 break-words">ID: {p.id}</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleExpand(p.id)}
                                        className="px-3 py-1 rounded-md cursor-pointer bg-gray-100 hover:bg-gray-200 text-sm"
                                    >
                                        {expanded[p.id ?? `payment-${pIdx}`] ? 'Hide details' : 'Show details'}
                                    </button>
                                </div>
                            </div>
                            {expanded[p.id ?? `payment-${pIdx}`] && (
                                <div className="mt-3 space-y-3">
                                    <div>
                                        <div className="text-sm font-semibold mb-2">Items</div>
                                        {p.items && p.items.length > 0 ? (
                                            <div className="grid gap-2">
                                                {p.items.map((it, i) => (
                                                    <div key={it.id ?? `${p.id ?? `payment-${pIdx}`}-item-${i}`} className="flex flex-col sm:flex-row gap-3 border border-gray-100 p-3 rounded-md">
                                                        <div className="flex gap-3 flex-1 min-w-0">
                                                            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-slate-50 flex items-center justify-center rounded-md overflow-hidden">
                                                                {it.product?.image ? (
                                                                    <img src={it.product.image} alt={it.product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-xs text-gray-400">No image</div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-semibold text-sm sm:text-base truncate">{it.product?.name ?? it.productId ?? 'Product'}</div>
                                                                <div className="text-xs text-gray-500 line-clamp-2 sm:truncate">{it.product?.description ?? ''}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-left sm:text-right sm:min-w-[120px] pl-12 sm:pl-0">
                                                            <div className="font-semibold text-sm sm:text-base">{it.quantity ?? 1} × {formatCurrency(it.price ?? undefined, p.currency ?? 'INR')}</div>
                                                            <div className="text-xs text-gray-500">Total: {formatCurrency(it.subtotal ?? it.price ?? undefined, p.currency ?? 'INR')}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">No items</div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="text-sm font-semibold mb-2">Transaction</div>
                                        {p.transaction ? (
                                            <div className="border border-gray-100 p-2 rounded-md">
                                                <div><strong>ID:</strong> {p.transaction.id}</div>
                                                <div className="text-sm text-gray-500">
                                                    Payment: {p.transaction.razorpayPaymentId ?? '—'} • Method: {p.transaction.method ?? '—'}
                                                </div>
                                                <div className="text-sm text-gray-500">Captured: {formatDate(p.transaction.capturedAt)}</div>
                                                <div className="mt-1">Amount paid: {formatCurrency(p.transaction.amountPaid ?? p.amount ?? undefined, p.currency ?? 'INR')}</div>
                                                {p.transaction.errorReason && <div className="text-red-600">Error: {p.transaction.errorReason}</div>}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500">No transaction recorded</div>
                                        )}
                                    </div>

                                    {p.subscription && (
                                        <div>
                                            <div className="text-sm font-semibold mb-2">Subscription</div>
                                            <div className="border border-gray-100 p-2 rounded-md">
                                                <div className="font-bold">{p.subscription.plan?.name ?? p.subscription.planId ?? 'Subscription'}</div>
                                                <div className="text-sm text-gray-500">{p.subscription.plan?.description}</div>
                                                <div className="mt-1">
                                                    Status: <strong className={`${statusBgClass(p.subscription.status)} text-white px-2 py-0.5 rounded`}>{p.subscription.status ?? '—'}</strong>
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    Period: {formatDate(p.subscription.startDate)} — {formatDate(p.subscription.endDate)}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    Plan price: {formatCurrency(p.subscription.plan?.price ?? undefined, p.currency ?? 'INR')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {p.booking && (
                                        <div>
                                            <div className="text-sm font-semibold mb-2">Booking Details</div>
                                            <div className="border border-gray-100 p-3 rounded-md space-y-3">
                                                {p.booking.service && (
                                                    <div className="flex gap-3 pb-3 border-b border-gray-100">
                                                        {p.booking.service.image ? (
                                                            <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-slate-50">
                                                                <img
                                                                    src={p.booking.service.image}
                                                                    alt={p.booking.service.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-20 h-20 flex-shrink-0 rounded-md bg-slate-100 flex items-center justify-center">
                                                                <div className="text-xs text-gray-400">No image</div>
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-bold text-base">{p.booking.service.name}</div>
                                                            <div className="text-sm text-gray-600 mt-1">{p.booking.service.description}</div>
                                                            <div className="flex gap-3 mt-2 text-sm">
                                                                <div>
                                                                    <span className="text-gray-500">Type:</span> <strong>{p.booking.service.type}</strong>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Duration:</span> <strong>{p.booking.service.duration}min</strong>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500">Price:</span> <strong>{formatCurrency(p.booking.service.price, p.currency ?? 'INR')}</strong>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <div className="text-xs text-gray-600 mb-1">Booking ID</div>
                                                        <div className="text-sm font-mono bg-gray-50 px-2 py-1 rounded">{p.booking.id}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-600 mb-1">Status</div>
                                                        <div className={`${statusBgClass(p.booking.status)} text-white text-sm font-semibold px-2 py-1 rounded inline-block`}>
                                                            {p.booking.status}
                                                        </div>
                                                    </div>
                                                </div>

                                                {p.booking.slot && (
                                                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-md">
                                                        <div className="text-sm font-semibold text-blue-900 mb-2">Scheduled Time</div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <span className="text-blue-700 font-medium">Start:</span>
                                                                <span className="text-blue-900">{formatDate(p.booking.slot.startTime)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <span className="text-blue-700 font-medium">End:</span>
                                                                <span className="text-blue-900">{formatDate(p.booking.slot.endTime)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {(p.booking.beforeImageUrl || p.booking.afterImageUrl) && (
                                                    <div>
                                                        <div className="text-sm font-semibold mb-2">Service Images</div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {p.booking.beforeImageUrl && (
                                                                <div>
                                                                    <div className="text-xs text-gray-600 mb-1">Before</div>
                                                                    <img
                                                                        src={p.booking.beforeImageUrl}
                                                                        alt="Before service"
                                                                        className="w-full h-32 object-cover rounded-md border border-gray-200"
                                                                    />
                                                                </div>
                                                            )}
                                                            {p.booking.afterImageUrl && (
                                                                <div>
                                                                    <div className="text-xs text-gray-600 mb-1">After</div>
                                                                    <img
                                                                        src={p.booking.afterImageUrl}
                                                                        alt="After service"
                                                                        className="w-full h-32 object-cover rounded-md border border-gray-200"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                                                    <div>Booked: {formatDate(p.booking.createdAt)}</div>
                                                    <div>Last updated: {formatDate(p.booking.updatedAt)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                >
                    Prev
                </button>

                {total !== null ? (() => {
                    const totalPages = Math.max(1, Math.ceil(total / limit));
                    const pages: number[] = [];
                    const start = Math.max(1, page - 2);
                    const end = Math.min(totalPages, page + 2);
                    for (let i = start; i <= end; i++) pages.push(i);
                    return pages.map(n => (
                        <button
                            key={`page-${n}`}
                            onClick={() => setPage(n)}
                            className={`px-3 py-1 rounded border ${n === page ? 'bg-gray-200' : 'bg-white'}`}
                        >
                            {n}
                        </button>
                    ));
                })() : null}

                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={total !== null ? page >= Math.ceil((total || 0) / limit) : (paymentData ? paymentData.length < limit : true)}
                    className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div >
    )
}

export default Payment