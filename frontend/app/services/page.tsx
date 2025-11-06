"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { APIURL } from "@/utils/env"
import { useRouter } from "next/navigation"
import React, { Suspense, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Clock,
  XCircle,
  ArrowRight,
  Search,
  Star,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  TrendingUp,
  Package,
  ChevronDown
} from "lucide-react"
import Footer from "@/components/layout/Footer"
import { usePathname, useSearchParams } from "next/navigation"

interface Service {
  id: string
  name: string
  description: string
  type: string
  image: string
  price: number
  bookingCount: number
  duration: number
  isActive: boolean
  adminId: string
  createdAt: string
  updatedAt: string
}

type ViewMode = 'grid' | 'list'
type SortBy = 'name' | 'price-low' | 'price-high' | 'duration' | 'newest'

// Skeleton Components
function SearchBarSkeleton() {
  return (
    <div className="mb-8 space-y-4 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-xl">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
            <div className="w-12 h-12"></div>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="w-12 h-12"></div>
          </div>
          <div className="h-12 w-28 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}

function ServiceCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <Card className={`overflow-hidden bg-white ${viewMode === 'list' ? 'flex flex-col md:flex-row' : ''}`}>
      <div className={`${viewMode === 'list' ? 'md:w-2/5 h-56 md:h-auto' : 'aspect-[16/10]'} bg-gray-200 animate-pulse`}></div>
      <div className={`p-6 ${viewMode === 'list' ? 'md:w-3/5 flex flex-col justify-between' : ''}`}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </div>
            <div className="h-7 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-28"></div>
          </div>
          <div className="h-11 bg-gray-200 rounded-lg animate-pulse w-full"></div>
        </div>
      </div>
    </Card>
  )
}

function ServicesGridSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <>
      <SearchBarSkeleton />
      <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}`}>
        {[...Array(6)].map((_, i) => (
          <ServiceCardSkeleton key={i} viewMode={viewMode} />
        ))}
      </div>
    </>
  )
}

const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortBy>("name")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [rating, setRating] = useState<number>(4.5)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Debounce function
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)

      return () => {
        clearTimeout(handler)
      }
    }, [value, delay])

    return debouncedValue
  }

  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const fetchServices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${APIURL}/public/services?page=1&limit=50`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()
      if (response.ok) {
        setServices(data.services || [])
        setFilteredServices(data.services || [])
      } else {
        const errorMessage = data.error || data.message || "Failed to fetch services"
        setError(errorMessage)
        toast.error("Something went wrong", {
          description: errorMessage,
          action: {
            label: "Retry",
            onClick: () => fetchServices(),
          },
        })
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch services"
      setError(errorMessage)
      toast.error("Network error occurred", {
        description: errorMessage,
        action: {
          label: "Retry",
          onClick: () => fetchServices(),
        },
      })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchServices()
  }, [])

  React.useEffect(() => {
    const typeFromUrl = (searchParams.get("type") || "").toLowerCase()
    if (typeFromUrl) {
      setSelectedType(typeFromUrl)
    } else {
      setSelectedType("all")
    }
  }, [searchParams])

  const updateQueryParam = React.useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  React.useEffect(() => {
    let filtered = [...services]

    if (debouncedSearchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        service.type.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(service => service.type.toLowerCase() === selectedType.toLowerCase())
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'duration':
          return a.duration - b.duration
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredServices(filtered)
  }, [services, debouncedSearchQuery, selectedType, sortBy])

  const handleBookService = (service: Service) => {
    if (!service.isActive) {
      toast.error("Service unavailable", {
        description: "This service is currently not available for booking."
      })
      return
    }
    router.push(`/services/${service.id}/book`)
  }

  const getUniqueTypes = () => {
    const types = services.map(service => service.type)
    return [...new Set(types)]
  }

  const ServiceCard = ({ service }: { service: Service }) => (
    <Card
      className={`overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white ${!service.isActive ? 'opacity-60' : ''
        } ${viewMode === 'list' ? 'flex flex-col md:flex-row' : ''}`}
      onClick={() => handleBookService(service)}
    >
      <div className={`${viewMode === 'list' ? 'md:w-2/5 h-56 md:h-auto' : 'aspect-[16/10]'
        } bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative`}>
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://sewamitra.up.gov.in/Upload/Service/ff974f11-4215-4b41-bb63-87f2cb358a46_.jpg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md ${service.isActive
              ? "bg-emerald-500/90 text-white"
              : "bg-red-500/90 text-white"
              }`}
          >
            {service.isActive ? "Available" : "Unavailable"}
          </span>
        </div>
        {service.isActive && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-lg shadow-lg">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-gray-900">{rating}</span>
            </div>
          </div>
        )}
      </div>

      <div className={`p-6 ${viewMode === 'list' ? 'md:w-3/5 flex flex-col justify-between' : ''}`}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
              {service.name}
            </h3>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg whitespace-nowrap border border-blue-100">
              {service.type}
            </span>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{service.description}</p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">₹{service.price}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">{service.duration} min</span>
            </div>
          </div>

          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleBookService(service)
            }}
            disabled={!service.isActive}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 font-semibold h-11"
          >
            Book Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Package className="h-5 w-5" />
              <span className="text-sm font-semibold">Professional Services</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Our Premium Services
            </h1>
            <p className="text-lg sm:text-xl text-blue-50 leading-relaxed">
              Professional water care services delivered by certified technicians to keep your RO system running at peak performance
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State with Skeleton */}
          {loading && <ServicesGridSkeleton viewMode={viewMode} />}

          {/* Error State */}
          {error && (
            <div className="flex justify-center py-20">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Services</h3>
                <p className="text-red-600 mb-6 text-sm">{error}</p>
                <Button
                  onClick={fetchServices}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Content when not loading */}
          {!loading && (
            <>
              {/* Search and Filters Bar */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search services by name, description, or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-shadow text-sm bg-white"
                    />
                  </div>

                  {/* View Mode & Filter Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-3 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        aria-label="Grid view"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <div className="w-px h-6 bg-gray-300"></div>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-3 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        aria-label="List view"
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 shadow-sm h-auto py-3 px-4"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Filters</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Active Filters */}
                {(selectedType !== "all" || searchQuery.trim()) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                    {selectedType !== "all" && (
                      <button
                        onClick={() => {
                          setSelectedType("all")
                          updateQueryParam("type", null)
                        }}
                        className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        {selectedType}
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {searchQuery.trim() && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        "{searchQuery}"
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedType("all")
                        setSearchQuery("")
                        updateQueryParam("type", null)
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* Filters Panel */}
                {showFilters && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Service Type
                        </label>
                        <select
                          value={selectedType}
                          onChange={(e) => {
                            const newType = e.target.value
                            setSelectedType(newType)
                            updateQueryParam("type", newType === "all" ? null : newType.toLowerCase())
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                        >
                          <option value="all">All Types</option>
                          {getUniqueTypes().map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sort By
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortBy)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                        >
                          <option value="name">Name (A-Z)</option>
                          <option value="price-low">Price (Low to High)</option>
                          <option value="price-high">Price (High to Low)</option>
                          <option value="duration">Duration</option>
                          <option value="newest">Newest First</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200 w-full">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span><span className="font-bold text-gray-900">{filteredServices.length}</span> service{filteredServices.length !== 1 ? 's' : ''} found</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Empty State - No Services */}
              {!loading && !error && filteredServices.length === 0 && services.length === 0 && (
                <div className="flex justify-center py-20">
                  <div className="bg-white border border-gray-200 rounded-lg p-10 max-w-md text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Services Available</h3>
                    <p className="text-gray-600 text-sm">Please check back later for available services.</p>
                  </div>
                </div>
              )}

              {/* Empty State - No Results */}
              {!loading && !error && filteredServices.length === 0 && services.length > 0 && (
                <div className="flex justify-center py-20">
                  <div className="bg-white border border-gray-200 rounded-lg p-10 max-w-md text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Results Found</h3>
                    <p className="text-gray-600 mb-6 text-sm">Try adjusting your search or filter criteria.</p>
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedType("all")
                        updateQueryParam("type", null)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Services Grid/List */}
              {!loading && !error && filteredServices.length > 0 && (
                <div className={`${viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-6'
                  }`}>
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ServicesLoading() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Package className="h-5 w-5" />
              <span className="text-sm font-semibold">Professional Services</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Our Premium Services
            </h1>
            <p className="text-lg sm:text-xl text-blue-50 leading-relaxed">
              Professional water care services delivered by certified technicians
            </p>
          </div>
        </div>
      </section>
      <section className="py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServicesGridSkeleton viewMode="grid" />
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default function Service() {
  return (
    <Suspense fallback={<ServicesLoading />}>
      <ServicesPage />
    </Suspense>
  )
}