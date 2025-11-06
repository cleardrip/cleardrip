"use client"

import React, { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Clock, ArrowRight, Users, Star } from "lucide-react"
import { APIURL } from "@/utils/env"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { useAuthMiddleware } from "@/lib/middleware/authMiddleware"
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog"


interface Service {
  id: string
  name: string
  description: string
  type: string
  image: string
  price: number
  duration: number
  isActive: boolean
  createdAt: string
}


export default function OurServices() {
  const [services, setServices] = React.useState<Service[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  const { showAuthDialog, setShowAuthDialog } = useAuthMiddleware({
    redirectDelay: 5000,
    showDialog: true,
  })


  const handleViewFAQ = () => {
    const faqSection = document.getElementById('faq-section')
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' })
    }
  }


  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${APIURL}/public/services?page=1&limit=50`)
        if (!res.ok) {
          throw new Error(`Failed to fetch services: ${res.statusText}`)
        }
        const data = await res.json()
        setServices(data.services || [])
      } catch (e: any) {
        setError(e.message || "Failed to load services")
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])


  if (loading) {
    return (
      <section className="py-24 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </section>
    )
  }


  if (error) {
    return (
      <section className="py-24 text-center text-red-600">
        <p>Error loading services: {error}</p>
      </section>
    )
  }


  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <AuthRequiredDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        redirectDelay={5000}
        actionType="booking"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Professional Services
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-600 mb-4 leading-tight">
            Our Services
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Comprehensive care for your RO system with transparent pricing and expert
            service
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              onBookService={(service) => {
                if (!user || !user.id) {
                  setShowAuthDialog(true)
                  return
                }
                router.push(`/services/${service.id}/book`)
              }}
            />
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Ready to get started?
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Schedule your service today and experience the Cleardrip difference
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-full px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
                onClick={() => {
                  if (!user || !user.id) {
                    setShowAuthDialog(true)
                    return
                  }
                  router.push('/services')
                }}
              >
                Schedule Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto rounded-full px-8 py-6 text-lg bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all duration-300 cursor-pointer"
                onClick={handleViewFAQ}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


function ServiceCard({
  service,
  index,
  onBookService,
}: {
  service: Service
  index: number
  onBookService?: (service: Service) => void
}) {
  const [rating] = React.useState(4.5)


  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group border-2 border-gray-200 hover:scale-105 cursor-pointer ${!service.isActive ? 'opacity-75' : ''}`}
      style={{
        animationDelay: `${index * 150}ms`,
        animation: "fadeInUp 0.6s ease-out forwards",
      }}
      onClick={() => onBookService?.(service)}
    >
      {/* Service Image */}
      <div className="relative aspect-video bg-gray-200 overflow-hidden">
        <img
          src={service.image}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "https://sewamitra.up.gov.in/Upload/Service/ff974f11-4215-4b41-bb63-87f2cb358a46_.jpg"
          }}
        />

        {/* Service Status */}
        <div className="absolute top-4 left-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${service.isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"
              }`}
          >
            {service.isActive ? "Available" : "Unavailable"}
          </span>
        </div>

        {/* Rating */}
        {service.isActive && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-1">
            <div className="flex items-center space-x-1 px-2 py-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs font-medium">{rating}</span>
            </div>
          </div>
        )}
      </div>

      {/* Service Content */}
      <div className="p-6">
        <div>
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {service.name}
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {service.type}
            </span>
          </div>

          <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-green-600">
                <span className="font-bold text-lg">₹{service.price}</span>
              </div>
              <div className="flex items-center text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">{service.duration} mins</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>150+ bookings</span>
            </div>

            <Button
              onClick={(e) => {
                e.stopPropagation()
                onBookService?.(service)
              }}
              disabled={!service.isActive}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              size="sm"
            >
              Book Now
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add CSS for fade-in animation
const styles = `
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
