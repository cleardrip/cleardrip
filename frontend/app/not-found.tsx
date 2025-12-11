import Link from 'next/link';
import { ArrowLeft, Home, Mail, FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="text-center max-w-2xl mx-auto space-y-8">

                {/* Visual Element */}
                <div className="relative">
                    <div className="text-9xl font-bold text-blue-100 select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-blue-50 p-4 rounded-full ring-8 ring-white shadow-sm">
                            <FileQuestion className="w-12 h-12 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                        Page Not Found
                    </h1>
                    <p className="text-lg text-gray-600 max-w-md mx-auto">
                        Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow group w-full sm:w-auto justify-center"
                    >
                        <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Back to Home
                    </Link>

                    <Link
                        href="/contact"
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:border-blue-200 hover:bg-blue-50 text-gray-700 font-medium rounded-lg transition-all shadow-sm w-full sm:w-auto justify-center group"
                    >
                        <Mail className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
                        Contact Support
                    </Link>
                </div>

                {/* Helper Link */}
                <div className="pt-8">
                    <Link
                        href="/"
                        className="text-sm text-gray-500 hover:text-blue-600 flex items-center justify-center gap-1 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go back to previous page
                    </Link>
                </div>
            </div>
        </div>
    );
}
