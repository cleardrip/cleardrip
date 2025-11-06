"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/AuthContext"
import { APIURL } from "@/utils/env"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Plus,
    Trash2,
    Clock,
    LucideIndianRupee,
    ImageIcon,
    Calendar,
    Search,
    Eye,
    EyeOff,
    Upload,
    X,
    CheckCircle,
    Loader2,
    CalendarDays,
    Users,
    TrendingUp,
    Settings,
    BarChart3,
    Menu,
} from "lucide-react"

interface ServiceDefinition {
    id: string
    name: string
    description: string
    type: string
    image: string
    imageUrl: string | null
    price: number
    duration: number
    isActive: boolean
    adminId: string
    createdAt: string
    updatedAt: string
}

interface Slot {
    id: string
    startTime: string
    endTime: string
    createdAt: string
    updatedAt: string
    bookings: Array<{
        id: string
        userId: string
        serviceId: string
        slotId: string
        status: string
        beforeImageUrl: string
        afterImageUrl: string
        createdAt: string
        updatedAt: string
        user?: {
            name: string
            email: string
        }
        service?: {
            name: string
        }
    }>
    bookingCount: number
}

interface BookingStats {
    totalBookings: number
    upcomingBookings: number
    completedBookings: number
    pendingBookings: number
}

const ImprovedAdminServices = () => {
    const { authenticated, authLoading, logout, isSuperAdmin, isAdmin, user: loggedInUser, role } = useAuth()

    const router = useRouter()

    // Main states
    const [activeTab, setActiveTab] = useState<"overview" | "services" | "slots" | "bookings">("overview")
    const [loading, setLoading] = useState(false)
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Data states
    const [services, setServices] = useState<ServiceDefinition[]>([])
    const [slots, setSlots] = useState<Slot[]>([])
    const [bookingStats, setBookingStats] = useState<BookingStats>({
        totalBookings: 0,
        upcomingBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
    })

    // Filter states
    const [searchTerm, setSearchTerm] = useState("")
    const [filterType, setFilterType] = useState<"ALL" | "AMC" | "URGENT">("ALL")
    const [showInactive, setShowInactive] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

    // Modal states
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false)
    const [isSlotManagerOpen, setIsSlotManagerOpen] = useState(false)

    // Service form states
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [image, setImage] = useState<File | string>("")
    const [imagePreview, setImagePreview] = useState<string>("")
    const [type, setType] = useState<"AMC" | "URGENT">("AMC")
    const [price, setPrice] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isActive, setIsActive] = useState(true)

    // Slot management states
    const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([])
    const [bulkSlotSettings, setBulkSlotSettings] = useState({
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        startTime: "09:00",
        endTime: "17:00",
        slotDuration: 60,
        breakBetween: 0,
        workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    })

    // Authentication check
    useEffect(() => {
        if (!authLoading && !authenticated) {
            toast.error("You must be logged in to access this page")
            router.push("/admin/signin")
        }
    }, [authLoading, authenticated, router])

    // Fetch all data
    const fetchServices = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch(`${APIURL}/public/services?page=1&limit=50`)
            const data = await response.json()
            if (response.ok) {
                setServices(data.services || [])
            } else {
                toast.error("Failed to fetch services")
            }
        } catch (error) {
            toast.error("Network error occurred")
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchSlots = useCallback(async () => {
        setSlotsLoading(true)
        try {
            const response = await fetch(`${APIURL}/services/slots/all`, {
                credentials: "include",
            })
            const data = await response.json()
            if (response.ok) {
                setSlots(data.slots || [])
                const totalBookings = data.slots?.reduce((acc: number, slot: Slot) => acc + slot.bookingCount, 0) || 0
                const upcomingBookings =
                    data.slots?.filter((slot: Slot) => new Date(slot.startTime) > new Date() && slot.bookingCount > 0).length || 0

                setBookingStats({
                    totalBookings,
                    upcomingBookings,
                    completedBookings: totalBookings - upcomingBookings,
                    pendingBookings: upcomingBookings,
                })
            }
        } catch (error) {
            toast.error("Failed to fetch slots")
        } finally {
            setSlotsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (authenticated) {
            fetchServices()
            fetchSlots()
        }
    }, [authenticated, fetchServices, fetchSlots])

    // Generate time slots for bulk creation
    const generateTimeSlots = (startTime: string, endTime: string, duration: number, breakTime: number) => {
        const slots = []
        const start = new Date(`2000-01-01T${startTime}:00`)
        const end = new Date(`2000-01-01T${endTime}:00`)

        let current = new Date(start)
        while (current < end) {
            const slotEnd = new Date(current.getTime() + duration * 60000)
            if (slotEnd <= end) {
                slots.push({
                    start: current.toTimeString().slice(0, 5),
                    end: slotEnd.toTimeString().slice(0, 5),
                })
            }
            current = new Date(slotEnd.getTime() + breakTime * 60000)
        }
        return slots
    }

    // Create bulk slots
    const createBulkSlots = async () => {
        const { startDate, endDate, startTime, endTime, slotDuration, breakBetween, workingDays } = bulkSlotSettings

        if (!startDate || !endDate) {
            toast.error("Please select start and end dates")
            return
        }
        if (startDate < new Date().toISOString().split("T")[0]) {
            toast.error("Start date cannot be in the past")
            return
        }
        if (endDate < startDate) {
            toast.error("End date cannot be before start date")
            return
        }

        setSlotsLoading(true)
        try {
            const timeSlots = generateTimeSlots(startTime, endTime, slotDuration, breakBetween)
            const start = new Date(startDate)
            const end = new Date(endDate)
            const slotsToCreate: Array<{ startTime: Date; endTime: Date }> = []

            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const dayOfWeek = date.getDay()
                if (workingDays.includes(dayOfWeek === 0 ? 7 : dayOfWeek)) {
                    timeSlots.forEach((timeSlot) => {
                        const slotStart = new Date(date)
                        const [startHour, startMin] = timeSlot.start.split(":")
                        slotStart.setHours(Number.parseInt(startHour), Number.parseInt(startMin), 0, 0)

                        const slotEnd = new Date(date)
                        const [endHour, endMin] = timeSlot.end.split(":")
                        slotEnd.setHours(Number.parseInt(endHour), Number.parseInt(endMin), 0, 0)

                        slotsToCreate.push({
                            startTime: slotStart,
                            endTime: slotEnd,
                        })
                    })
                }
            }

            try {
                const response = await fetch(`${APIURL}/services/add/slots`, {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify(slotsToCreate),
                    headers: { "Content-Type": "application/json" },
                })
                if (response.ok) {
                    const data = await response.json()
                    toast.success(`Successfully created ${data.slot} slots!`)
                }
            } catch (error) {
                console.error("Failed to create slot:", error)
            }

            fetchSlots()
            setIsSlotManagerOpen(false)
        } catch (error) {
            toast.error("Failed to create bulk slots")
        } finally {
            setSlotsLoading(false)
        }
    }

    // Add service
    const addService = async () => {
        if (!name || !description || !image) {
            toast.error("Please fill in all required fields")
            return
        }
        if (price <= 0 || duration <= 0) {
            toast.error("Please enter valid price and duration")
            return
        }

        setLoading(true)

        try {
            const imageFormData = new FormData()
            imageFormData.append("image", image)
            const imageresponse = await fetch(`${APIURL}/upload/image`, {
                method: "POST",
                credentials: "include",
                body: imageFormData,
            })
            if (!imageresponse.ok) {
                const errorData = await imageresponse.json()
                toast.error("Image upload failed", {
                    description: JSON.stringify(errorData),
                    action: {
                        label: "Retry",
                        onClick: () => addService(),
                    },
                })
                throw new Error("Image upload failed")
            }
            const { data } = await imageresponse.json()

            const response = await fetch(`${APIURL}/services/add`, {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({
                    name,
                    description,
                    type,
                    price,
                    duration,
                    isActive,
                    image: data.url,
                }),
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                toast.success("Service added successfully!")
                resetServiceForm()
                setIsAddServiceModalOpen(false)
                fetchServices()
            } else {
                const error = await response.json()
                toast.error(error.message || "Failed to add service")
            }
        } catch (error: any) {
            toast.error("Some error occurred", {
                description: error.message,
                action: {
                    label: "Try Again",
                    onClick: addService,
                },
            })
        } finally {
            setLoading(false)
        }
    }

    // Delete selected slots
    const deleteSelectedSlots = async () => {
        if (selectedSlotIds.length === 0) {
            toast.error("Please select slots to delete")
            return
        }

        setSlotsLoading(true)
        try {
            const response = await fetch(`${APIURL}/services/delete/slots`, {
                method: "DELETE",
                credentials: "include",
                body: JSON.stringify({ slotIds: selectedSlotIds }),
                headers: { "Content-Type": "application/json" },
            })

            if (response.ok) {
                const { message, deletedSlot, notDeletedSlot } = await response.json()
                toast.success(message, {
                    description: notDeletedSlot.length > 0 ? `${notDeletedSlot.length} slots could not be deleted as they are booked.` : "",
                })
                setSelectedSlotIds(notDeletedSlot.map((s: any) => s.id))
                fetchSlots()
            } else {
                toast.error("Failed to delete slots")
            }
        } catch (error) {
            toast.error("Network error occurred")
        } finally {
            setSlotsLoading(false)
        }
    }

    const resetServiceForm = () => {
        setName("")
        setDescription("")
        setImage("")
        setImagePreview("")
        setType("AMC")
        setPrice(0)
        setDuration(0)
        setIsActive(true)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImage(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result as string)
            reader.readAsDataURL(file)
        }
    }

    const toggleSlotSelection = (slotId: string) => {
        setSelectedSlotIds((prev) => (prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]))
    }

    const filteredServices = services.filter((service) => {
        const matchesSearch =
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = filterType === "ALL" || service.type === filterType
        const matchesStatus = showInactive || service.isActive
        return matchesSearch && matchesType && matchesStatus
    })

    const upcomingSlots = slots.filter((slot) => new Date(slot.startTime) > new Date())
    const bookedSlots = slots.filter((slot) => slot.bookingCount > 0)
    const availableSlots = slots.filter((slot) => slot.bookingCount === 0 && new Date(slot.startTime) > new Date())

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    if (!authenticated) return null

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="hidden lg:block flex-1">
                            <p className="text-xs sm:text-sm text-gray-600 truncate">Manage your services, slots, and bookings</p>
                        </div>

                        <div className="flex gap-2 sm:gap-3">
                            <button
                                onClick={() => setIsSlotManagerOpen(true)}
                                className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                            >
                                <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Slot Manager</span>
                            </button>
                            <button
                                onClick={() => setIsAddServiceModalOpen(true)}
                                className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
                            >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Add Service</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="overflow-x-auto hide-scrollbar">
                    <nav className="flex space-x-4 sm:space-x-8 px-3 sm:px-4 md:px-6 min-w-max">
                        {[
                            { id: "overview", label: "Overview", icon: BarChart3 },
                            { id: "services", label: "Services", icon: Settings },
                            { id: "slots", label: "Time Slots", icon: Calendar },
                            { id: "bookings", label: "Bookings", icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any)
                                    setMobileMenuOpen(false)
                                }}
                                className={`flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="p-3 sm:p-4 md:p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Services</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{services.length}</p>
                                        <p className="text-xs sm:text-sm text-green-600 mt-1">{services.filter((s) => s.isActive).length} active</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                                        <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Available Slots</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{availableSlots.length}</p>
                                        <p className="text-xs sm:text-sm text-blue-600 mt-1">{upcomingSlots.length} upcoming</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Bookings</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{bookingStats.totalBookings}</p>
                                        <p className="text-xs sm:text-sm text-orange-600 mt-1">{bookingStats.upcomingBookings} upcoming</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Revenue</p>
                                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 truncate">
                                            ₹{services.reduce((acc, service) => acc + service.price, 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs sm:text-sm text-purple-600 mt-1">Total potential</p>
                                    </div>
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <button
                                    onClick={() => setIsSlotManagerOpen(true)}
                                    className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                                >
                                    <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
                                    <h4 className="font-medium text-sm sm:text-base text-gray-900">Bulk Add Slots</h4>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Add multiple slots for upcoming days</p>
                                </button>

                                <button
                                    onClick={() => setActiveTab("bookings")}
                                    className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left"
                                >
                                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" />
                                    <h4 className="font-medium text-sm sm:text-base text-gray-900">View Bookings</h4>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Check upcoming appointments</p>
                                </button>

                                <button
                                    onClick={() => setIsAddServiceModalOpen(true)}
                                    className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                                >
                                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
                                    <h4 className="font-medium text-sm sm:text-base text-gray-900">Add Service</h4>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Create a new service offering</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Services Tab */}
                {activeTab === "services" && (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col gap-3 sm:gap-4">
                                <div className="w-full">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search services..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value as any)}
                                        className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ALL">All Types</option>
                                        <option value="AMC">AMC</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                    <button
                                        onClick={() => setShowInactive(!showInactive)}
                                        className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${showInactive ? "bg-gray-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                    >
                                        {showInactive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                        {showInactive ? "Hide Inactive" : "Show Inactive"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Services Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                            {filteredServices.map((service) => (
                                <div
                                    key={service.id}
                                    className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${!service.isActive ? "opacity-60" : ""
                                        }`}
                                >
                                    <div className="aspect-video bg-gray-200 relative">
                                        {service.image ? (
                                            <img
                                                src={service.image || "/placeholder.svg"}
                                                alt={service.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${service.type === "URGENT" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                                                    }`}
                                            >
                                                {service.type}
                                            </span>
                                        </div>
                                        {!service.isActive && (
                                            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    Inactive
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 sm:p-4">
                                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 truncate">{service.name}</h3>
                                        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{service.description}</p>
                                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <LucideIndianRupee className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                {service.price}
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                {service.duration}min
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Slots Tab */}
                {activeTab === "slots" && (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Slot Actions */}
                        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Time Slot Management</h3>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {selectedSlotIds.length > 0 && (
                                        <button
                                            onClick={() => {
                                                if (selectedSlotIds.length === slots.length) {
                                                    setSelectedSlotIds([])
                                                } else {
                                                    setSelectedSlotIds(slots.map((s) => s.id))
                                                }
                                            }}
                                            disabled={slotsLoading}
                                            className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-xs sm:text-sm"
                                        >
                                            {selectedSlotIds.length === slots.length ? "Deselect All" : "Select All"}
                                        </button>
                                    )}
                                    {selectedSlotIds.length > 0 && (
                                        <button
                                            onClick={deleteSelectedSlots}
                                            disabled={slotsLoading}
                                            className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-xs sm:text-sm"
                                        >
                                            {slotsLoading ? (
                                                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-2" />
                                            ) : (
                                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                            )}
                                            Delete ({selectedSlotIds.length})
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsSlotManagerOpen(true)}
                                        className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                                    >
                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                        Add Slots
                                    </button>
                                </div>
                            </div>

                            {/* Slot Stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-green-800">Available Slots</p>
                                            <p className="text-xl sm:text-2xl font-bold text-green-900 mt-1">{availableSlots.length}</p>
                                        </div>
                                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                                    </div>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-orange-800">Booked Slots</p>
                                            <p className="text-xl sm:text-2xl font-bold text-orange-900 mt-1">{bookedSlots.length}</p>
                                        </div>
                                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
                                    </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium text-blue-800">Total Slots</p>
                                            <p className="text-xl sm:text-2xl font-bold text-blue-900 mt-1">{slots.length}</p>
                                        </div>
                                        <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slots Grid */}
                        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
                            <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">All Time Slots</h4>
                            {slotsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm sm:text-base">No slots available</p>
                                    <button
                                        onClick={() => setIsSlotManagerOpen(true)}
                                        className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Add Your First Slot
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {slots.map((slot) => (
                                        <div
                                            key={slot.id}
                                            className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${selectedSlotIds.includes(slot.id)
                                                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                                : slot.bookingCount > 0
                                                    ? "border-orange-300 bg-orange-50"
                                                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                                }`}
                                            onClick={() => slot.bookingCount === 0 && toggleSlotSelection(slot.id)}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSlotIds.includes(slot.id)}
                                                    onChange={() => slot.bookingCount === 0 && toggleSlotSelection(slot.id)}
                                                    disabled={slot.bookingCount > 0}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                                />
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${slot.bookingCount > 0 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                                                        }`}
                                                >
                                                    {slot.bookingCount > 0 ? `${slot.bookingCount} Booked` : "Available"}
                                                </span>
                                            </div>
                                            <div className="text-xs sm:text-sm">
                                                <p className="font-medium text-gray-900 mb-1">
                                                    {new Date(slot.startTime).toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                                <p className="text-gray-600">
                                                    {new Date(slot.startTime).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}{" "}
                                                    -{" "}
                                                    {new Date(slot.endTime).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Bookings Tab */}
                {activeTab === "bookings" && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Bookings</h3>
                            <div className="space-y-3 sm:space-y-4">
                                {bookedSlots.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm sm:text-base">No bookings yet</p>
                                    </div>
                                ) : (
                                    bookedSlots.map((slot) => (
                                        <div key={slot.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                                        {new Date(slot.startTime).toLocaleDateString()} at{" "}
                                                        {new Date(slot.startTime).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                    <p className="text-xs sm:text-sm text-gray-600">
                                                        {slot.bookingCount} booking{slot.bookingCount > 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium self-start sm:self-auto">
                                                    Booked
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Service Modal */}
            {isAddServiceModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                            <h2 className="text-lg sm:text-xl font-semibold">Add New Service</h2>
                            <button onClick={() => setIsAddServiceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Service name"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description *</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Service description"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Image *</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                    {imagePreview ? (
                                        <div className="relative">
                                            <img
                                                src={imagePreview || "/placeholder.svg"}
                                                alt="Preview"
                                                className="w-full h-32 object-cover rounded"
                                            />
                                            <button
                                                onClick={() => {
                                                    setImage("")
                                                    setImagePreview("")
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <div className="text-center">
                                                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-xs sm:text-sm text-gray-600">Click to upload image</p>
                                            </div>
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as "AMC" | "URGENT")}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="AMC">AMC</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        min="0"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(Number(e.target.value))}
                                    min="0"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="ml-2 text-xs sm:text-sm text-gray-700">
                                    Active
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 p-4 sm:p-6 border-t">
                            <button
                                onClick={() => setIsAddServiceModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addService}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Service"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Slot Manager Modal */}
            {isSlotManagerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                            <h2 className="text-lg sm:text-xl font-semibold">Advanced Slot Manager</h2>
                            <button onClick={() => setIsSlotManagerOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                                <h3 className="font-medium text-sm sm:text-base text-blue-900 mb-2">Bulk Slot Creation</h3>
                                <p className="text-xs sm:text-sm text-blue-700">
                                    Create multiple slots across multiple days with customizable time ranges and working days.
                                </p>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={bulkSlotSettings.startDate}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setBulkSlotSettings((prev) => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={bulkSlotSettings.endDate}
                                        min={bulkSlotSettings.startDate || new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setBulkSlotSettings((prev) => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Time Range */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={bulkSlotSettings.startTime}
                                        onChange={(e) => setBulkSlotSettings((prev) => ({ ...prev, startTime: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={bulkSlotSettings.endTime}
                                        onChange={(e) => setBulkSlotSettings((prev) => ({ ...prev, endTime: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Slot Settings */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Slot Duration (minutes)</label>
                                    <select
                                        value={bulkSlotSettings.slotDuration}
                                        onChange={(e) => setBulkSlotSettings((prev) => ({ ...prev, slotDuration: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>1 hour</option>
                                        <option value={90}>1.5 hours</option>
                                        <option value={120}>2 hours</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Break Between Slots</label>
                                    <select
                                        value={bulkSlotSettings.breakBetween}
                                        onChange={(e) => setBulkSlotSettings((prev) => ({ ...prev, breakBetween: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={0}>No break</option>
                                        <option value={15}>15 minutes</option>
                                        <option value={30}>30 minutes</option>
                                        <option value={60}>1 hour</option>
                                    </select>
                                </div>
                            </div>

                            {/* Working Days */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Working Days</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 1, label: "Mon" },
                                        { id: 2, label: "Tue" },
                                        { id: 3, label: "Wed" },
                                        { id: 4, label: "Thu" },
                                        { id: 5, label: "Fri" },
                                        { id: 6, label: "Sat" },
                                        { id: 7, label: "Sun" },
                                    ].map((day) => (
                                        <button
                                            key={day.id}
                                            onClick={() => {
                                                const newWorkingDays = bulkSlotSettings.workingDays.includes(day.id)
                                                    ? bulkSlotSettings.workingDays.filter((d) => d !== day.id)
                                                    : [...bulkSlotSettings.workingDays, day.id]
                                                setBulkSlotSettings((prev) => ({ ...prev, workingDays: newWorkingDays }))
                                            }}
                                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${bulkSlotSettings.workingDays.includes(day.id)
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                <h4 className="font-medium text-sm sm:text-base text-gray-900 mb-2">Preview</h4>
                                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                                    <p>
                                        • Duration: {bulkSlotSettings.startDate} to {bulkSlotSettings.endDate || "Not set"}
                                    </p>
                                    <p>
                                        • Time: {bulkSlotSettings.startTime} - {bulkSlotSettings.endTime}
                                    </p>
                                    <p>• Slot length: {bulkSlotSettings.slotDuration} minutes</p>
                                    <p>• Break time: {bulkSlotSettings.breakBetween} minutes</p>
                                    <p>• Working days: {bulkSlotSettings.workingDays.length} selected</p>
                                    {bulkSlotSettings.startDate && bulkSlotSettings.endDate && (
                                        <p className="font-medium text-blue-600">
                                            • Estimated slots: ~
                                            {Math.ceil(
                                                (new Date(bulkSlotSettings.endDate).getTime() -
                                                    new Date(bulkSlotSettings.startDate).getTime()) /
                                                (1000 * 60 * 60 * 24),
                                            ) *
                                                bulkSlotSettings.workingDays.length *
                                                generateTimeSlots(
                                                    bulkSlotSettings.startTime,
                                                    bulkSlotSettings.endTime,
                                                    bulkSlotSettings.slotDuration,
                                                    bulkSlotSettings.breakBetween,
                                                ).length}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 p-4 sm:p-6 border-t">
                            <button
                                onClick={() => setIsSlotManagerOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createBulkSlots}
                                disabled={slotsLoading || !bulkSlotSettings.startDate || !bulkSlotSettings.endDate}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                            >
                                {slotsLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Create Slots
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}

export default ImprovedAdminServices;
