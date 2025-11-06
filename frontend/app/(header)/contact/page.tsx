"use client"
import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, MapPin } from "lucide-react"
import { toast } from "sonner"
import { APIURL } from "@/utils/env"
import Footer from "@/components/layout/Footer"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      setError("All fields are required.")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email address.")
      return
    }
    try {
      setError(null)
      setIsSubmitting(true)
      setSuccess(false)
      const response = await fetch(`${APIURL}/contactus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess(true)
        toast.success("Form submitted successfully", { description: "We will get back to you shortly." })
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || errorData.message || "An error occurred while submitting the form."
        toast.error('Some error occurred',
          {
            description: errorMessage,
            action: {
              label: 'Retry',
              onClick: handleSubmit
            }
          })
      }
    } catch (error) {
      setError("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">Get in Touch</h1>
            <p className="text-base md:text-lg text-blue-100 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid lg:grid-cols-5 gap-0">
            {/* Left Side - Contact Form */}
            <div className="lg:col-span-3 p-6 sm:p-8 lg:p-12">
              <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Send us a Message</h2>
                <p className="text-gray-600 text-sm md:text-base">Fill out the form below and we'll get back to you within 24 hours</p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm font-medium">Form submitted successfully! We'll be in touch soon.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-11 md:h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-11 md:h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 md:h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!formData.name || !formData.email || !formData.message || isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : "Send Message"}
                </Button>

                <div className="flex items-center justify-center pt-2">
                  <div className="flex items-center text-gray-500 text-xs md:text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    We typically respond within 24 hours
                  </div>
                </div>
              </form>
            </div>

            {/* Right Side - Contact Info */}
            <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-blue-700 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
              <div className="text-center lg:text-left mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Contact Information</h3>
                <p className="text-blue-100 text-sm md:text-base">Reach out to us through any of these channels</p>
              </div>

              <div className="hidden lg:flex justify-center mb-8">
                <img
                  src="/customerservicerepresentative.jpg"
                  alt="Customer Service Representative"
                  className="w-48 h-48 object-cover rounded-2xl shadow-2xl"
                />
              </div>

              <div className="space-y-4 md:space-y-6">
                <div
                  className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200 cursor-pointer group"
                  onClick={() => window.location.href = "tel:+919810916388"}
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-base md:text-lg mb-1">Call Us</h4>
                    <p className="text-blue-100 text-sm md:text-base">+91 9810916388</p>
                    <p className="text-blue-200 text-xs mt-1">Mon-Fri 9:00 AM - 6:00 PM</p>
                  </div>
                </div>

                <div
                  className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-200 cursor-pointer group"
                  onClick={() => window.location.href = "mailto:cleardrip.solutions@gmail.com"}
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-base md:text-lg mb-1">Email Us</h4>
                    <p className="text-blue-100 text-sm md:text-base break-all">cleardrip.solutions@gmail.com</p>
                    <p className="text-blue-200 text-xs mt-1">24/7 Support</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-base md:text-lg mb-1">Visit Us</h4>
                    <p className="text-blue-100 text-sm md:text-base">New Delhi, India</p>
                    <p className="text-blue-200 text-xs mt-1">See map below for exact location</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 md:p-6 bg-gradient-to-r from-blue-600 to-blue-700">
            <h3 className="text-xl md:text-2xl font-bold text-white text-center">Our Location</h3>
            <p className="text-blue-100 text-center text-sm md:text-base mt-2">Visit our support center in New Delhi</p>
          </div>
          <div className="relative h-64 sm:h-80 md:h-96 bg-gray-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.918657204778!2d77.20902161461664!3d28.613939691769254!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd37e7f6aab9%3A0xa3b42c0b8c8f2c73!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1692288000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
              title="ClearDrip Location Map"
            ></iframe>
          </div>
          <div className="p-4 md:p-6 text-center bg-gray-50">
            <p className="text-gray-600 text-sm md:text-base">📍 Click the map to get directions to our office</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}