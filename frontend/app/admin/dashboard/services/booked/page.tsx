"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { APIURL } from "@/utils/env";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    whatsappNumber: string | null;
    loyaltyStatus: string;
}

interface Slot {
    id: string;
    startTime: string;
    endTime: string;
}

interface Service {
    id: string;
    name: string;
    description: string;
    type: string;
    image: string;
    price: string;
    duration: number;
    isActive: boolean;
}

interface PaymentOrder {
    id: string;
    razorpayOrderId: string;
    amount: string;
    currency: string;
    status: string;
    purpose: string;
    createdAt: string;
}

interface BookedService {
    id: string;
    userId: string;
    serviceId: string;
    slotId: string;
    status: string;
    beforeImageUrl: string | null;
    afterImageUrl: string | null;
    createdAt: string;
    updatedAt: string;
    user: User;
    slot: Slot;
    service: Service;
    PaymentOrder: PaymentOrder[];
}

interface Pagination {
    take: number;
    skip: number;
    total: number;
    hasNext: boolean;
}

interface ApiResponse {
    message: string;
    services: BookedService[];
    pagination: Pagination;
}

const AllBookedServices = () => {
    const [bookedServices, setBookedServices] = useState<BookedService[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [selectedBooking, setSelectedBooking] = useState<BookedService | null>(null); // State for selected booking
    const [modalLoading, setModalLoading] = useState(false); // State for modal loading
    const router = useRouter();

    useEffect(() => {
        const fetchBookedServices = async () => {
            try {
                const response = await fetch(`${APIURL}/services?page=${currentPage}&limit=${itemsPerPage}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });
                const data: ApiResponse = await response.json();
                if (response.ok) {
                    toast.success("Booked services fetched successfully");
                    setBookedServices(data.services || []);
                } else {
                    toast.error(data.message || "Failed to fetch booked services");
                }
            } catch (error) {
                toast.error((error as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookedServices();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const indexOfLastService = currentPage * itemsPerPage;
    const indexOfFirstService = indexOfLastService - itemsPerPage;
    const currentServices = bookedServices.slice(indexOfFirstService, indexOfLastService);

    const openModal = (booking: BookedService) => {
        router.push(`/admin/dashboard/services/booked/${booking.id}`);
    };

    const closeModal = () => {
        setSelectedBooking(null); // Clear selected booking
    };

    if (loading) {
        return (
            <div className="p-4 sm:p-6 flex items-center justify-center min-h-screen">
                <div className="space-y-4 w-full max-w-6xl">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 min-h-screen sm:p-6 max-w-7xl ">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Booked Services</h1>
                <p className="text-gray-600 mt-2">Total: {bookedServices.length} bookings</p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Booking ID
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Service
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Slot Time
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Payment
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentServices.map((booking) => (
                            <tr key={booking.id} className="hover:bg-gray-50 cursor-pointer transition-colors duration-150" onClick={() => openModal(booking)}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {booking.id.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{booking.user.name}</div>
                                    <div className="text-sm text-gray-500">{booking.user.phone}</div>
                                    <div className="text-xs text-gray-400">{booking.user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{booking.service.name}</div>
                                    <div className="text-xs text-gray-500">{booking.service.type}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{formatDate(booking.slot.startTime)}</div>
                                    <div className="text-xs text-gray-500">to {formatDate(booking.slot.endTime)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    ₹{booking.service.price}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {booking.PaymentOrder.length > 0 ? (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.PaymentOrder[0].status === 'SUCCESS'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {booking.PaymentOrder[0].status}
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            NO PAYMENT
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
                {currentServices.map((booking) => (
                    <div
                        key={booking.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow duration-150"
                        onClick={() => openModal(booking)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                                <p className="text-sm font-semibold text-gray-900">{booking.id.substring(0, 8)}...</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                {booking.status}
                            </span>
                        </div>

                        <div className="space-y-3 border-t pt-3">
                            <div>
                                <p className="text-xs text-gray-500">Customer</p>
                                <p className="text-sm font-medium text-gray-900">{booking.user.name}</p>
                                <p className="text-xs text-gray-600">{booking.user.phone}</p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">Service</p>
                                <p className="text-sm font-medium text-gray-900">{booking.service.name}</p>
                                <p className="text-xs text-gray-600">{booking.service.type}</p>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t">
                                <div>
                                    <p className="text-xs text-gray-500">Amount</p>
                                    <p className="text-lg font-bold text-gray-900">₹{booking.service.price}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1">Payment</p>
                                    {booking.PaymentOrder.length > 0 ? (
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${booking.PaymentOrder[0].status === 'SUCCESS'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {booking.PaymentOrder[0].status}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                            NO PAYMENT
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {bookedServices.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-4 text-gray-500 font-medium">No booked services found</p>
                </div>
            )}

            {/* Improved Pagination */}
            {bookedServices.length > 0 && (
                <div className="flex justify-center items-center gap-2 mt-6 sm:mt-8">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: Math.ceil(bookedServices.length / itemsPerPage) }, (_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => paginate(index + 1)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === index + 1
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === Math.ceil(bookedServices.length / itemsPerPage)}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modal with backdrop */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 overflow-y-auto" onClick={closeModal}>
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                        {/* Backdrop */}
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        {/* Modal Content */}
                        <div
                            className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[90vh] overflow-y-auto">
                                {/* Modal Header */}
                                <div className="flex justify-between items-start mb-6 sticky top-0 bg-white pb-4 border-b">
                                    <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                                            <p className="font-medium text-gray-900 text-sm break-all">{selectedBooking.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Status</p>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                                                {selectedBooking.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-l-4 border-blue-500 pl-4">
                                        <h3 className="font-semibold text-gray-900 mb-3 text-lg">Customer Information</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Name</p>
                                                <p className="font-medium text-gray-900">{selectedBooking.user.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="font-medium text-gray-900">{selectedBooking.user.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Phone</p>
                                                <p className="font-medium text-gray-900">{selectedBooking.user.phone}</p>
                                            </div>
                                            {selectedBooking.user.whatsappNumber && (
                                                <div>
                                                    <p className="text-xs text-gray-500">WhatsApp</p>
                                                    <p className="font-medium text-gray-900">{selectedBooking.user.whatsappNumber}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-l-4 border-green-500 pl-4">
                                        <h3 className="font-semibold text-gray-900 mb-3 text-lg">Service Details</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Service Name</p>
                                                <p className="font-medium text-gray-900">{selectedBooking.service.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Type</p>
                                                <p className="font-medium text-gray-900">{selectedBooking.service.type}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Description</p>
                                                <p className="font-medium text-gray-900">{selectedBooking.service.description}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Duration</p>
                                                <p className="font-medium text-gray-900">{selectedBooking.service.duration} minutes</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-l-4 border-purple-500 pl-4">
                                        <h3 className="font-semibold text-gray-900 mb-3 text-lg">Booking Information</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Slot Time</p>
                                                <p className="font-medium text-gray-900">
                                                    {formatDate(selectedBooking.slot.startTime)} - {formatDate(selectedBooking.slot.endTime)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Created At</p>
                                                <p className="font-medium text-gray-900">{formatDate(selectedBooking.createdAt)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Updated At</p>
                                                <p className="font-medium text-gray-900">{formatDate(selectedBooking.updatedAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-l-4 border-yellow-500 pl-4">
                                        <h3 className="font-semibold text-gray-900 mb-3 text-lg">Payment Information</h3>
                                        <div className="space-y-3">
                                            <div className="bg-yellow-50 p-4 rounded-lg">
                                                <p className="text-xs text-gray-600 mb-1">Amount</p>
                                                <p className="font-bold text-gray-900 text-2xl">₹{selectedBooking.service.price}</p>
                                            </div>
                                            {selectedBooking.PaymentOrder.length > 0 ? (
                                                <>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${selectedBooking.PaymentOrder[0].status === 'SUCCESS'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {selectedBooking.PaymentOrder[0].status}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Razorpay Order ID</p>
                                                        <p className="font-medium text-gray-900 break-all">{selectedBooking.PaymentOrder[0].razorpayOrderId}</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                                                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        NO PAYMENT
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AllBookedServices;