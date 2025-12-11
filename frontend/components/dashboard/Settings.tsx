import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Mail } from 'lucide-react';

const SettingsPage = () => {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="w-full bg-blue-50/30 border-none rounded-lg">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            Need help?
          </CardTitle>
          <p className="text-sm sm:text-base text-gray-600">
            We're here to assist — choose a support option below.
          </p>
        </CardHeader>

        <CardContent className="pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-fr">
            {/* WhatsApp Support */}
            <Card className="border border-gray-200 rounded-lg hover:shadow-lg transition-transform duration-200 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center flex flex-col justify-between h-full" role="region" aria-labelledby="whatsapp-title">
                <div>
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-green-50 to-green-100">
                      <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" aria-hidden />
                    </div>
                  </div>

                  <h3 id="whatsapp-title" className="text-lg sm:text-xl font-semibold mb-2 text-gray-800">
                    Message us on WhatsApp
                  </h3>

                  <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                    Get instant replies, book services, and chat with your RO assistant anytime.
                  </p>

                  <p className="text-xs text-gray-500">Available 9am–7pm IST</p>
                </div>

                <div className="mt-6">
                  <a
                    href="https://wa.me/918882143722?text=Hi%20team,%20I%20visited%20your%20Cleardrip%20platform%20and%20would%20like%20to%20know%20more."
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open WhatsApp chat in a new tab"
                  >
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto px-6 py-2 border-gray-300 hover:bg-gray-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                    >
                      Chat now
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Phone Support */}
            <Card className="border border-gray-200 rounded-lg hover:shadow-lg transition-transform duration-200 transform hover:-translate-y-1">
              <CardContent className="p-6 text-center flex flex-col justify-between h-full" role="region" aria-labelledby="phone-title">
                <div>
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100">
                      <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" aria-hidden />
                    </div>
                  </div>

                  <h3 id="phone-title" className="text-lg sm:text-xl font-semibold mb-2 text-gray-800">
                    Customer support
                  </h3>

                  <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                    Connect directly with our team for quick help or urgent concerns.
                  </p>

                  <p className="text-xs text-gray-500">Mon–Sat, 9am–6pm IST</p>
                </div>

                <div className="mt-6">
                  <a href="tel:+918882143722" aria-label="Call customer support">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto px-6 py-2 border-gray-300 hover:bg-gray-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                    >
                      Call now
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Email Support */}
            <Card className="border border-gray-200 rounded-lg hover:shadow-lg transition-transform duration-200 transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-6 text-center flex flex-col justify-between h-full" role="region" aria-labelledby="mail-title">
                <div>
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-50 to-amber-100">
                      <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" aria-hidden />
                    </div>
                  </div>

                  <h3 id="mail-title" className="text-lg sm:text-xl font-semibold mb-2 text-gray-800">
                    Reach us by email
                  </h3>

                  <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
                    Send us your feedback or detailed queries — we respond within 24–48 hours.
                  </p>

                  <p className="text-xs text-gray-500">Response time may vary</p>
                </div>

                <div className="mt-6">
                  <a
                    href="mailto:cleardrip.solutions@gmail.com"
                    aria-label="Send support email"
                  >
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto px-6 py-2 border-gray-300 hover:bg-gray-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                    >
                      Send mail
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
