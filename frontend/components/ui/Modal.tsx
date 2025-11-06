"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
}

const Modal = ({ children, onClose }: ModalProps) => {
    useEffect(() => {
        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";

        // Cleanup function to restore scroll
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>

                {/* Content */}
                {children}
            </div>
        </div>
    );
};

export default Modal;
