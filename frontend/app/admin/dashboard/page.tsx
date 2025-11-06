"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  FileText,
  LogOut,
  Loader2,
  Package,
  ShieldCheck,
  CalendarCheck,
  Home,
  MessageSquare,
  User,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { APIURL } from "@/utils/env"

interface DashboardStats {
  totalAdmins: number
  totalUsers: number
  totalServices: number
  totalServicesBooked: number
  totalSubscriptions: number
  totalSubscriptionsBooked: number
  availableSlots: number
}

// Skeleton Components
const StatCardSkeleton = () => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="h-8 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
)

const QuickLinkSkeleton = () => (
  <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl animate-pulse">
    <div className="w-5 h-5 bg-gray-200 rounded"></div>
    <div className="h-4 bg-gray-200 rounded flex-1"></div>
  </div>
)

const AdminDashboard = () => {
  const { authenticated, authLoading, logout, isSuperAdmin, isAdmin, user: loggedInUser, role } = useAuth()

  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)

  // Check if user has admin access
  const hasAdminAccess = () => {
    return (
      authenticated &&
      (role === "SUPER_ADMIN" || role === "ADMIN" || isSuperAdmin || isAdmin) &&
      role !== "USER"
    )
  }

  // Show different quick links based on role
  const getQuickLinks = () => {
    if (role === "SUPER_ADMIN" || isSuperAdmin) {
      return [
        {
          title: "Manage Services and Slots",
          url: "/admin/dashboard/services",
          icon: MessageSquare,
        },
        {
          title: "Manage Products",
          url: "/admin/dashboard/products",
          icon: User,
        },
        {
          title: "Manage Staff",
          url: "/admin/dashboard/staff",
          icon: User,
        },
        {
          title: "Manage Subscriptions",
          url: "/admin/dashboard/subscriptions",
          icon: CalendarCheck,
        }
      ]
    } else if (role === "ADMIN" || isAdmin) {
      return [
        {
          title: "Manage Services and Slots",
          url: "/admin/dashboard/services",
          icon: MessageSquare,
        }
      ]
    }
    return []
  }

  const QuickLinks = getQuickLinks()

  useEffect(() => {
    // Only fetch stats if user has admin access
    if (hasAdminAccess()) {
      const fetchDashboardStats = async () => {
        try {
          const response = await fetch(`${APIURL}/admin/dashboard/stats`)
          const data = await response.json()
          if (response.ok) {
            setDashboardStats(data.stats)
          } else {
            setError(data.message)
          }
        } catch (error: any) {
          toast.error("Failed to fetch dashboard stats", {
            description: error.message,
            action: {
              label: "Retry",
              onClick: () => fetchDashboardStats()
            }
          })
          setError(error.message)
        }
      }
      fetchDashboardStats()
    }
  }, [authLoading, authenticated, role])

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await logout()
      router.push("/admin/signin")
    } catch {
      setError("Logout failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while auth is loading
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

  // Show access denied if not authenticated or not admin
  if (!authenticated || !hasAdminAccess()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg border shadow-sm max-w-md w-full mx-4">
          <div className="text-center">
            <ShieldCheck className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              {!authenticated
                ? "You need to be logged in as an admin to access this dashboard."
                : role === "USER"
                  ? "You don't have admin privileges to access this dashboard."
                  : "You don't have sufficient permissions to access this dashboard."
              }
            </p>
            <div className="space-y-3">
              {!authenticated && (
                <button
                  onClick={() => router.push("/admin/signin")}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Admin Login
                </button>
              )}
              <button
                onClick={() => router.push("/")}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Function to render stats based on role
  const renderStatsGrid = () => {
    if (!dashboardStats) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[...Array(role === "SUPER_ADMIN" ? 7 : 3)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      )
    }

    const isSuperAdmin = role === "SUPER_ADMIN"

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {/* Always show services stats */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Services</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboardStats.totalServices}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Services Booked</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboardStats.totalServicesBooked}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <CalendarCheck className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Available Slots</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboardStats.availableSlots}</p>
            </div>
            <div className="bg-teal-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-teal-600" />
            </div>
          </div>
        </div>

        {/* Only show additional stats for superadmin */}
        {isSuperAdmin && (
          <>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Users</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboardStats.totalUsers}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Admins</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboardStats.totalAdmins}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Total Subscriptions</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboardStats.totalSubscriptions}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Subscriptions Booked</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{dashboardStats.totalSubscriptionsBooked}</p>
                </div>
                <div className="bg-pink-100 p-3 rounded-lg">
                  <CalendarCheck className="h-6 w-6 sm:h-7 sm:w-7 text-pink-600" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Logout button */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-all duration-200">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
            <span>Logout</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Header */}
          <header className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {loggedInUser?.name}!
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm sm:text-base text-gray-600 font-medium">
                    {loggedInUser?.adminRole || role}
                  </p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                    Admin Access
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Stats Grid */}
          {renderStatsGrid()}

          {/* Quick Links - Only show if there are links available */}
          {QuickLinks.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Quick Actions</h2>
              </div>

              {!dashboardStats ? (
                <div className={`grid grid-cols-1 ${QuickLinks.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''} gap-4`}>
                  {QuickLinks.map((_, index) => (
                    <QuickLinkSkeleton key={index} />
                  ))}
                </div>
              ) : (
                <div className={`grid grid-cols-1 ${QuickLinks.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''} gap-4`}>
                  {QuickLinks.map((link, index) => (
                    <button
                      key={index}
                      onClick={() => router.push(link.url)}
                      className="group flex items-center gap-3 p-4 sm:p-5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98] transition-all duration-200 text-left shadow-sm hover:shadow-md"
                    >
                      <div className="p-2.5 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors duration-200">
                        <link.icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
                      </div>
                      <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                        {link.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <p className="text-red-800 text-sm font-medium flex-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-xs font-bold">✓</span>
                </div>
                <p className="text-green-800 text-sm font-medium flex-1">{success}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
