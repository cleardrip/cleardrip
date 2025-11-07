"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  CreditCard,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { APIURL } from "@/utils/env"

interface PaymentDetail {
  id: string
  razorpayOrderId: string
  amount: string
  currency: string
  status: string
  purpose: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    address: {
      street: string
      city: string
      state: string
      postalCode: string
      country: string
    } | null
  }
  transaction: {
    id: string
    razorpayPaymentId: string | null
    status: string
    method: string | null
    amountPaid: string | null
    capturedAt: string | null
    errorReason: string | null
  } | null
  booking: {
    id: string
    status: string
    service: {
      id: string
      name: string
      price: string
    }
  } | null
  subscription: {
    id: string
    plan: {
      id: string
      name: string
      price: string
    }
    startDate: string
    endDate: string
    status: string
  } | null
  items: Array<{
    id: string
    product: {
      id: string
      name: string
      price: string
    }
    quantity: number
    price: string
    subtotal: string
  }>
}

const SkeletonCard = () => (
  <div className="animate-pulse border border-gray-200 p-4 rounded-lg bg-white">
    <div className="space-y-3">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
      </div>
      <div className="h-px bg-gray-200" />
      <div className="flex gap-6 flex-wrap">
        <div className="space-y-1">
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-24" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-slate-200 rounded w-12" />
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
      </div>
    </div>
  </div>
)

export default function AdminPaymentsPage() {
  const { authenticated, authLoading, role } = useAuth()
  const router = useRouter()

  const [payments, setPayments] = useState<PaymentDetail[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [purposeFilter, setPurposeFilter] = useState("")
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const hasAdminAccess = () => {
    return authenticated && (role === "SUPER_ADMIN" || role === "ADMIN")
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 450)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch payments
  useEffect(() => {
    if (hasAdminAccess()) {
      const fetchPayments = async () => {
        setIsLoading(true)
        try {
          const queryParams = new URLSearchParams({
            take: limit.toString(),
            skip: ((page - 1) * limit).toString(),
            ...(debouncedSearch && { search: debouncedSearch }),
            ...(statusFilter && { status: statusFilter }),
            ...(purposeFilter && { purpose: purposeFilter }),
          })

          const response = await fetch(
            `${APIURL}/payment/admin/payments?${queryParams}`,
            {
              method: "GET",
              credentials: "include",
            }
          )

          const data = await response.json()

          if (response.ok) {
            setPayments(data.payments)
            setTotal(data.total)
            setError("")
          } else {
            setError(data.message || "Failed to fetch payments")
            toast.error("Failed to fetch payments")
          }
        } catch (error: any) {
          setError(error.message)
          toast.error("Error fetching payments", {
            description: error.message,
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchPayments()
    }
  }, [authenticated, role, page, limit, debouncedSearch, statusFilter, purposeFilter])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const statusBgClass = (s?: string | null) => {
    if (!s) return "bg-gray-300"
    if (s === "SUCCESS") return "bg-green-600"
    if (s === "PENDING") return "bg-yellow-600"
    if (s === "FAILED" || s === "CANCELLED") return "bg-red-600"
    return "bg-gray-500"
  }

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleString() : "-"

  const formatCurrency = (amt?: string | null, currency?: string | null) => {
    if (!amt) return "-"
    const n = Number(amt)
    if (Number.isNaN(n)) return amt
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
    }).format(n)
  }

  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast.error("No payments to export")
      return
    }

    const headers = [
      "Order ID",
      "User Name",
      "Email",
      "Phone",
      "Address",
      "Amount",
      "Status",
      "Purpose",
      "Payment Method",
      "Date",
    ]

    const rows = payments.map((payment) => [
      payment.razorpayOrderId,
      payment.user.name,
      payment.user.email,
      payment.user.phone || "N/A",
      payment.user.address
        ? `${payment.user.address.street}, ${payment.user.address.city}`
        : "N/A",
      payment.amount,
      payment.status,
      payment.purpose,
      payment.transaction?.method || "N/A",
      new Date(payment.createdAt).toLocaleString(),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payments-${new Date().toISOString()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success("Payments exported successfully")
  }

  const clearSearch = () => {
    setSearchTerm("")
    setDebouncedSearch("")
    setPage(1)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!authenticated || !hasAdminAccess()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg border shadow-sm max-w-md w-full">
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You need admin access to view payments.
            </p>
            <button
              onClick={() => router.push("/admin/signin")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Admin Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-6">
          {/* Header */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  All Payments
                </h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  {total} total payments • Page {page} of{" "}
                  {Math.max(1, Math.ceil(total / limit))}
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                disabled={payments.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium whitespace-nowrap"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full">
              {/* Search */}
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>

              {/* Purpose Filter */}
              <select
                value={purposeFilter}
                onChange={(e) => {
                  setPurposeFilter(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Purposes</option>
                <option value="SERVICE_BOOKING">Service Booking</option>
                <option value="SUBSCRIPTION">Subscription</option>
                <option value="PRODUCT_PURCHASE">Product Purchase</option>
              </select>

              {/* Limit */}
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </div>

            {(searchTerm || debouncedSearch) && (
              <div className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-800">
                  Search: "{debouncedSearch || searchTerm}"
                </div>
                <button
                  onClick={clearSearch}
                  className="text-xs px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Payments Grid */}
          <div className="grid gap-4">
            {isLoading ? (
              <>
                {[...Array(Math.min(3, limit))].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </>
            ) : !payments || payments.length === 0 ? (
              <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">No payments found</p>
              </div>
            ) : (
              payments.map((payment, idx) => (
                <div
                  key={payment.id}
                  className="border border-gray-200 p-4 sm:p-6 rounded-lg bg-white hover:shadow-md transition-shadow duration-200"
                >
                  {/* Main Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Left: Order ID and User */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-semibold truncate">
                        {payment.razorpayOrderId}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <p className="font-medium">{payment.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {payment.user.email}
                        </p>
                        {payment.user.phone && (
                          <p className="text-xs text-gray-500">
                            {payment.user.phone}
                          </p>
                        )}
                        {payment.user.address && (
                          <p className="text-xs text-gray-500">
                            {payment.user.address.street},{" "}
                            {payment.user.address.city},{" "}
                            {payment.user.address.state}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount and Status */}
                    <div className="text-right">
                      <div className="text-lg sm:text-2xl font-extrabold text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                      <div className="flex justify-end gap-2 items-center mt-2 flex-wrap gap-y-1">
                        <div
                          className={`${statusBgClass(
                            payment.status
                          )} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                        >
                          {payment.status}
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {payment.purpose.replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Details Row */}
                  <div className="flex gap-4 sm:gap-6 flex-wrap items-center text-sm mb-4">
                    <div>
                      <div className="text-xs text-gray-600 font-medium">
                        Created
                      </div>
                      <div className="text-sm">{formatDate(payment.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">
                        Items
                      </div>
                      <div className="text-sm">{payment.items?.length ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 font-medium">
                        Payment Method
                      </div>
                      <div className="text-sm">
                        {payment.transaction?.method || "N/A"}
                      </div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Footer */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-xs text-gray-500 break-all">
                      ID: {payment.id}
                    </div>
                    <button
                      onClick={() => toggleExpand(payment.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
                    >
                      {expanded[payment.id] ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show Details
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {expanded[payment.id] && (
                    <div className="mt-6 space-y-6 pt-6 border-t border-gray-200">
                      {/* Transaction Details */}
                      {payment.transaction && (
                        <div>
                          <h3 className="font-semibold text-sm mb-3">
                            Transaction Details
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment ID:</span>
                              <span className="font-mono text-sm">
                                {payment.transaction.razorpayPaymentId || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Method:</span>
                              <span className="font-medium">
                                {payment.transaction.method || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Amount Paid:</span>
                              <span className="font-semibold">
                                {formatCurrency(
                                  payment.transaction.amountPaid,
                                  payment.currency
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Captured:</span>
                              <span>
                                {formatDate(payment.transaction.capturedAt)}
                              </span>
                            </div>
                            {payment.transaction.errorReason && (
                              <div className="bg-red-50 p-2 rounded text-red-700 text-sm mt-2">
                                Error: {payment.transaction.errorReason}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Booking Details */}
                      {payment.booking && (
                        <div>
                          <h3 className="font-semibold text-sm mb-3">
                            Booking Details
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Service:</span>
                              <span className="font-medium">
                                {payment.booking.service.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Price:</span>
                              <span className="font-semibold">
                                {formatCurrency(
                                  payment.booking.service.price,
                                  payment.currency
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span
                                className={`${statusBgClass(
                                  payment.booking.status
                                )} text-white px-2 py-1 rounded text-xs font-medium`}
                              >
                                {payment.booking.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subscription Details */}
                      {payment.subscription && (
                        <div>
                          <h3 className="font-semibold text-sm mb-3">
                            Subscription Details
                          </h3>
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Plan:</span>
                              <span className="font-medium">
                                {payment.subscription.plan.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Price:</span>
                              <span className="font-semibold">
                                {formatCurrency(
                                  payment.subscription.plan.price,
                                  payment.currency
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span
                                className={`${statusBgClass(
                                  payment.subscription.status
                                )} text-white px-2 py-1 rounded text-xs font-medium`}
                              >
                                {payment.subscription.status}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Period:</span>
                              <span className="text-sm">
                                {formatDate(payment.subscription.startDate)} to{" "}
                                {formatDate(payment.subscription.endDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      {payment.items && payment.items.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-3">Items</h3>
                          <div className="space-y-2">
                            {payment.items.map((item) => (
                              <div
                                key={item.id}
                                className="bg-gray-50 p-4 rounded-lg"
                              >
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium">
                                    {item.product.name}
                                  </span>
                                  <span className="font-semibold">
                                    {formatCurrency(
                                      item.subtotal,
                                      payment.currency
                                    )}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  {item.quantity} ×{" "}
                                  {formatCurrency(item.price, payment.currency)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-center gap-2 flex-wrap bg-white p-6 rounded-lg border border-gray-200">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded border bg-white disabled:opacity-50 hover:bg-gray-50 text-sm"
              >
                Previous
              </button>

              {(() => {
                const totalPages = Math.max(1, Math.ceil(total / limit))
                const pages: number[] = []
                const start = Math.max(1, page - 2)
                const end = Math.min(totalPages, page + 2)
                for (let i = start; i <= end; i++) pages.push(i)
                return pages.map((n) => (
                  <button
                    key={`page-${n}`}
                    onClick={() => setPage(n)}
                    className={`px-3 py-2 rounded border text-sm ${
                      n === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))
              })()}

              <button
                onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
                disabled={page >= Math.ceil(total / limit)}
                className="px-4 py-2 rounded border bg-white disabled:opacity-50 hover:bg-gray-50 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
