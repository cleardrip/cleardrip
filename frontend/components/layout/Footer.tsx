import { Mail, MapPin, Phone, Facebook, Twitter, Linkedin, Plus, ArrowUp, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";

const SocialLink = ({ icon: Icon, href, label }: { icon: any; href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-300 hover:scale-110"
  >
    <Icon className="w-5 h-5" />
  </a>
);

const ContactItem = ({ icon: Icon, children, href, onClick }: { icon: any; children: React.ReactNode; href?: string; onClick?: () => void }) => (
  <div
    className="flex items-start space-x-3 hover:cursor-pointer group"
    onClick={onClick}
  >
    <Icon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 group-hover:text-blue-400 transition-colors" />
    {href ? (
      <a href={href} className="text-gray-400 hover:text-white transition-colors break-words">
        {children}
      </a>
    ) : (
      <span className="text-gray-400 group-hover:text-white transition-colors break-words">
        {children}
      </span>
    )}
  </div>
);

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <li>
    <Link href={href} className="text-gray-400 hover:text-white transition-colors inline-block hover:translate-x-1 duration-200">
      {children}
    </Link>
  </li>
);

export default function Footer() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isScrolled, setScrolled] = useState(false);
  const router = useRouter();

  const handleScroll = () => {
    setScrolled(window.scrollY > 200);
  };

  const handleButtonClick = () => {
    if (isScrolled) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setModalOpen(true);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer id="contact" className="bg-gray-900 text-white py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src="/cleardrip-logo.png"
              alt="ClearDrip Logo"
              className="cursor-pointer mb-4"
              height={70}
              width={70}
              priority
            />
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              Your trusted partner for smart water health monitoring and RO services.
            </p>
            <div className="flex space-x-3">
              <SocialLink icon={Facebook} href="https://facebook.com" label="Facebook" />
              <SocialLink icon={Twitter} href="https://twitter.com" label="Twitter" />
              <SocialLink icon={Linkedin} href="https://linkedin.com" label="LinkedIn" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2.5">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/contact">Contact Us</FooterLink>
              <FooterLink href="/services">Services</FooterLink>
              <FooterLink href="/products">Products</FooterLink>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Services</h3>
            <ul className="space-y-2.5">
              <FooterLink href="/services?type=amc">AMC Plans</FooterLink>
              <FooterLink href="/services?type=urgent">Emergency Repairs</FooterLink>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact Info</h3>
            <div className="space-y-4">
              <ContactItem
                icon={Phone}
                href="tel:+919876543210"
                onClick={() => window.location.href = 'tel:+919876543210'}
              >
                +91 9876543210
              </ContactItem>
              <ContactItem
                icon={Mail}
                href="mailto:cleardrip.solutions@gmail.com"
                onClick={() => window.location.href = 'mailto:cleardrip.solutions@gmail.com'}
              >
                cleardrip.solutions@gmail.com
              </ContactItem>
              <ContactItem icon={MapPin}>
                Mumbai, India
              </ContactItem>
            </div>
          </div>
        </div>

        {/* Scroll/Action Button */}
        <button
          className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg z-50 hover:bg-blue-500 transition-all duration-300 hover:scale-110"
          onClick={handleButtonClick}
          aria-label={isScrolled ? "Scroll to top" : "Open quick actions"}
        >
          {isScrolled ? <ArrowUp className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>

        {/* Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center z-50 px-4"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pr-8">Select an Option</h2>
              <div className="space-y-3">
                <button
                  onClick={() => { setModalOpen(false); router.push("/user/dashboard"); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  User Dashboard
                </button>
                <button
                  onClick={() => { setModalOpen(false); router.push("/admin/dashboard"); }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Admin Dashboard
                </button>
                <button
                  onClick={() => { setModalOpen(false); router.push("/services"); }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Book Services
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-6 md:pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} ClearDrip. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}