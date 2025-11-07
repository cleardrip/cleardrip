"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Trash2,
  Mail,
  User,
  MessageSquare,
  Download,
  Search,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { APIURL } from "@/utils/env"

interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  createdAt: string
}

const ContactTableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    ))}
  </div>
)

const ContactCard = ({
  contact,
  onDelete,
}: {
  contact: ContactMessage
  onDelete: (id: string) => void
}) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-6">
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">
              {contact.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(contact.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDelete(contact.id)}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200 group flex-shrink-0"
          title="Delete contact"
        >
          <Trash2 className="h-4 w-4 text-gray-600 group-hover:text-red-600 transition-colors duration-200" />
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500">Email</p>
        <a
          href={`mailto:${contact.email}`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
        >
          {contact.email}
        </a>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500">Message</p>
        <p className="text-sm text-gray-600 line-clamp-3">{contact.message}</p>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          {new Date(contact.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  </div>
)

export default function ContactsPage() {
  const { authenticated, authLoading, role } = useAuth()
  const router = useRouter()

  const [contacts, setContacts] = useState<ContactMessage[]>([])
  const [filteredContacts, setFilteredContacts] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  const hasAdminAccess = () => {
    return authenticated && (role === "SUPER_ADMIN" || role === "ADMIN")
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (hasAdminAccess()) {
      const fetchContacts = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`${APIURL}/contactus`, {
            method: "GET",
            credentials: "include",
          })

          const data = await response.json()

          if (response.ok) {
            setContacts(data)
            setFilteredContacts(data)
          } else {
            setError(data.message || "Failed to fetch contacts")
            toast.error("Failed to fetch contacts")
          }
        } catch (error: any) {
          setError(error.message)
          toast.error("Error fetching contacts", {
            description: error.message,
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchContacts()
    }
  }, [authenticated, role])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredContacts(contacts)
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredContacts(filtered)
    }
  }, [searchTerm, contacts])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return

    try {
      const response = await fetch(`${APIURL}/contactus/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id))
        toast.success("Contact deleted successfully")
      } else {
        toast.error("Failed to delete contact")
      }
    } catch (error: any) {
      toast.error("Error deleting contact", {
        description: error.message,
      })
    }
  }

  // Handle export to CSV
  const handleExportCSV = () => {
    if (filteredContacts.length === 0) {
      toast.error("No contacts to export")
      return
    }

    const headers = ["Name", "Email", "Message", "Created At"]
    const rows = filteredContacts.map((contact) => [
      contact.name,
      contact.email,
      `"${contact.message.replace(/"/g, '""')}"`,
      new Date(contact.createdAt).toLocaleString(),
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `contacts-${new Date().toISOString()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success("Contacts exported successfully")
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm sm:text-base">Loading...</span>
        </div>
      </div>
    )
  }

  if (!authenticated || !hasAdminAccess()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-lg border shadow-sm max-w-md w-full">
          <div className="text-center">
            <Mail className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              You need to be logged in as an admin to access contact messages.
            </p>
            <button
              onClick={() => router.push("/admin/signin")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Go to Admin Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => router.back()}
                className="md:hidden flex items-center gap-2 text-blue-600 hover:text-blue-800 w-fit text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                      Contact Messages
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                    Manage and review all contact messages from users
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  disabled={filteredContacts.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm text-sm sm:text-base whitespace-nowrap"
                >
                  <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">Export CSV</span>
                  <span className="xs:hidden">Export</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <p className="text-red-800 text-xs sm:text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-4 sm:p-6">
                <ContactTableSkeleton />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-base sm:text-lg font-medium">
                  {contacts.length === 0
                    ? "No contact messages yet"
                    : "No messages match your search"}
                </p>
              </div>
            ) : (
              <>
                <div className="md:hidden">
                  <div className="divide-y divide-gray-200">
                    {filteredContacts.map((contact) => (
                      <div key={contact.id} className="p-4 sm:p-6">
                        <ContactCard contact={contact} onDelete={handleDelete} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">
                          Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">
                          Message
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900">
                          Date
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact, index) => (
                        <tr
                          key={contact.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                {contact.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <a
                              href={`mailto:${contact.email}`}
                              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block"
                            >
                              {contact.email}
                            </a>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 max-w-xs">
                              {contact.message}
                            </p>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                              {new Date(contact.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleDelete(contact.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200 group"
                                title="Delete contact"
                              >
                                <Trash2 className="h-4 w-4 text-gray-600 group-hover:text-red-600 transition-colors duration-200" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredContacts.length > 0 && (
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">
                      Showing{" "}
                      <span className="text-gray-900 font-semibold">
                        {filteredContacts.length}
                      </span>{" "}
                      of{" "}
                      <span className="text-gray-900 font-semibold">
                        {contacts.length}
                      </span>{" "}
                      messages
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
