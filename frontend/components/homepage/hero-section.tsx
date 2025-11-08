import { Button } from "@/components/ui/button";
import { X, AlertCircle, Droplets, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface AlertBannerProps {
    onClose: () => void;
}

interface HeroImageProps {
    src: string;
    alt: string;
    className: string;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ onClose }) => {
    return (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 px-4 sm:px-6 py-3 shadow-sm z-10 relative">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm sm:text-base text-gray-800 min-w-0">
                        <span className="font-medium">High TDS levels detected.</span>
                        <span className="hidden sm:inline ml-1">
                            <Link
                                href="/services"
                                prefetch={true}
                                className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200 hover:cursor-pointer"
                            >
                                Service recommended - Get instant help
                            </Link>
                        </span>
                        <span className="sm:hidden ml-1">
                            <Link
                                href="/services"
                                prefetch={true}
                                className="text-blue-600 hover:text-blue-800 underline font-medium hover:cursor-pointer"
                            >
                                Get help
                            </Link>
                        </span>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        onClose();
                    }}
                    className="p-1 hover:bg-orange-200 rounded-full flex-shrink-0 hover: cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors duration-200"
                    aria-label="Close alert"
                >
                    <X className="w-4 h-4 text-gray-600" />
                </Button>
            </div>
        </div>
    );
};

const HeroImage: React.FC<HeroImageProps> = ({ src, alt, className }) => (
    <div className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}>
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </div>
);

const FeatureHighlight: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="flex items-center gap-2 text-blue-100">
        {icon}
        <span className="text-sm font-medium">{text}</span>
    </div>
);

export default function HeroSection() {
    const [showTdsAlert, setShowTdsAlert] = useState(true);
    const router = useRouter();

    const handleCloseAlert = () => {
        setShowTdsAlert(false);
    };

    const handleBookService = () => {
        router.push("/services");
    };

    const handlePrefetch = () => {
        router.prefetch("/services");
    };

    const heroImages = [
        {
            src: "/hero1.png",
            alt: "Professional technician servicing RO water purification system",
            className: "h-40 sm:h-48 lg:h-56"
        },
        {
            src: "/hero2.png",
            alt: "Advanced water filtration components and technology",
            className: "h-32 sm:h-40 lg:h-48"
        },
        {
            src: "/hero3.png",
            alt: "Smart TDS monitoring device with real-time readings",
            className: "h-32 sm:h-36 lg:h-40"
        },
        {
            src: "/hero4.png",
            alt: "Complete RO system installation in modern home",
            className: "h-48 sm:h-56 lg:h-64"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-20 w-48 h-48 bg-white rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full blur-2xl" />
            </div>

            {/* Alert Banner */}
            {showTdsAlert && (
                <AlertBanner onClose={handleCloseAlert} />
            )}

            {/* Hero Content */}
            <div className="relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto gap-8 lg:gap-12">
                    {/* Left Content */}
                    <div className="w-full lg:w-1/2 text-white space-y-6 lg:space-y-8 text-center lg:text-left">
                        <div className="space-y-4">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
                                <span className="block">Smart Water Care</span>
                                <span className="block bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                                    That Just Works
                                </span>
                            </h1>
                            <p className="text-lg sm:text-xl lg:text-2xl text-blue-100 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                                Cleardrip alerts you instantly when TDS crosses safe limits, ensuring your family always has clean, pure water.
                            </p>
                        </div>

                        {/* Feature Highlights */}
                        <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6">
                            <FeatureHighlight
                                icon={<Droplets className="w-4 h-4" />}
                                text="Pure Water"
                            />
                            <FeatureHighlight
                                icon={<Shield className="w-4 h-4" />}
                                text="Safe & Tested"
                            />
                            <FeatureHighlight
                                icon={<Zap className="w-4 h-4" />}
                                text="Instant Alerts"
                            />
                        </div>

                        {/* CTA Button */}
                        <div className="pt-4">
                            <Button
                                size="lg"
                                onClick={handleBookService}
                                onMouseEnter={handlePrefetch}
                                onFocus={handlePrefetch}
                                className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                Book a Service
                            </Button>
                            <p className="text-xs sm:text-sm text-blue-200 mt-3">
                                Free consultation • Same day service available
                            </p>
                        </div>
                    </div>

                    {/* Right Content - Image Grid */}
                    <div className="w-full lg:w-1/2 mt-8 lg:mt-0">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 max-w-lg mx-auto lg:max-w-none">
                            {/* Left Column */}
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                                <HeroImage
                                    src={heroImages[0].src}
                                    alt={heroImages[0].alt}
                                    className={heroImages[0].className}
                                />
                                <HeroImage
                                    src={heroImages[1].src}
                                    alt={heroImages[1].alt}
                                    className={heroImages[1].className}
                                />
                            </div>

                            {/* Right Column */}
                            <div className="space-y-3 sm:space-y-4 lg:space-y-6 mt-4 sm:mt-6 lg:mt-8">
                                <HeroImage
                                    src={heroImages[2].src}
                                    alt={heroImages[2].alt}
                                    className={heroImages[2].className}
                                />
                                <HeroImage
                                    src={heroImages[3].src}
                                    alt={heroImages[3].alt}
                                    className={heroImages[3].className}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}