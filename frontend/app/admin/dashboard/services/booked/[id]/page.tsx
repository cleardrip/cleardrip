"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { APIURL } from "@/utils/env";
import { Loader2, Upload, Check, X } from "lucide-react";

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
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  slot: {
    id: string;
    startTime: string;
    endTime: string;
  };
  service: {
    id: string;
    name: string;
    description: string;
    type: string;
    price: string;
    duration: number;
  };
}

export default function AdminBookingDetail() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookedService | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState("");
  const [afterImageFile, setAfterImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${APIURL}/admin/bookings/${bookingId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);
        setStatus(data.booking.status);
      } else {
        toast.error("Failed to fetch booking details");
      }
    } catch (error) {
      toast.error("Error fetching booking details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        toast.error("Only JPEG and PNG images are allowed");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setAfterImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateBooking = async () => {
    if (!booking) return;

    try {
      setUpdating(true);

      const formData = new FormData();
      formData.append("status", status);

      if (afterImageFile) {
        formData.append("afterImage", afterImageFile);
      }

      const response = await fetch(
        `${APIURL}/admin/bookings/${bookingId}/update`,
        {
          method: "PUT",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Booking updated successfully");
        // Refresh booking details
        await fetchBookingDetails();
        setAfterImageFile(null);
        setPreviewUrl("");
      } else {
        toast.error(data.message || "Failed to update booking");
      }
    } catch (error) {
      toast.error("Error updating booking");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <X className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Booking not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-gray-600 mt-2">ID: {booking.id}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="cursor-pointer"
        >
          Back
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="font-medium text-gray-900">{booking.user.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-900">{booking.user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="font-medium text-gray-900">{booking.user.phone}</p>
              </div>
            </div>
          </div>

          {/* Service Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Service Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Service Name</p>
                <p className="font-medium text-gray-900">
                  {booking.service.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="font-medium text-gray-900">
                  {booking.service.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Price</p>
                <p className="font-bold text-gray-900">
                  ₹{booking.service.price}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="font-medium text-gray-900">
                  {booking.service.duration} minutes
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="font-medium text-gray-900">
                  {booking.service.description}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Booking Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Slot Start</p>
                <p className="font-medium text-gray-900">
                  {formatDate(booking.slot.startTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Slot End</p>
                <p className="font-medium text-gray-900">
                  {formatDate(booking.slot.endTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Created At</p>
                <p className="font-medium text-gray-900">
                  {formatDate(booking.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Updated At</p>
                <p className="font-medium text-gray-900">
                  {formatDate(booking.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Service Images
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Before Image */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Before Image
                </p>
                {booking.beforeImageUrl ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={booking.beforeImageUrl}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <p className="text-gray-500">No before image</p>
                  </div>
                )}
              </div>

              {/* After Image */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  After Image
                </p>
                {previewUrl ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={previewUrl}
                      alt="After Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : booking.afterImageUrl ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={booking.afterImageUrl}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <p className="text-gray-500">No after image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload After Image */}
            <div className="mt-6 pt-6 border-t">
              <label className="block">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Upload After Image
                </p>
                <div className="flex items-center justify-center">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-blue-600 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG (Max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Status Update */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Update Booking
            </h2>

            {/* Current Status */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-600 mb-2">
                Current Status
              </p>
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(
                  booking.status
                )}`}
              >
                {booking.status}
              </span>
            </div>

            {/* Status Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Change Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Update Button */}
            <Button
              onClick={handleUpdateBooking}
              disabled={updating || status === booking.status}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {updating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Update Booking
                </span>
              )}
            </Button>

            {/* Image Upload Status */}
            {afterImageFile && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Image ready to upload: {afterImageFile.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
