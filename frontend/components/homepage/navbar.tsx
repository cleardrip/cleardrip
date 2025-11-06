"use client";
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut, Search, ShoppingCart, User, Menu, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, className = "", onClick }) => (
    <Link
        href={href}
        className={`text-gray-900 hover:text-blue-600 font-medium transition-colors duration-200 ${className}`}
        onClick={onClick}
    >
        {children}
    </Link>
);

const CartButton: React.FC<{
    onClick: () => void;
    count: number;
    size?: 'md' | 'sm';
}> = ({ onClick, count, size = 'md' }) => {
    const isMd = size === 'md';
    return (
        <Button
            variant="ghost"
            size="sm"
            className="p-2 relative cursor-pointer" 
            onClick={onClick}
            aria-label={`Shopping cart${count > 0 ? `, ${count} item${count > 1 ? 's' : ''}` : ''}`}
        >
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {count > 0 && (
                <span
                    className={`absolute -top-1 -right-1 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium 
                        ${isMd ? 'w-5 h-5 text-xs' : 'w-4 h-4 text-[10px]'}`}
                >
                    {count > (isMd ? 99 : 9) ? (isMd ? '99+' : '9+') : count}
                </span>
            )}
            <span className="sr-only" aria-live="polite">{count} items in cart</span>
        </Button>
    );
};

const AccountMenu: React.FC<{
    variant: 'desktop' | 'mobile';
    displayName: string;
    user: any;
    userInitial: string;
    dashboardHref: string;
    onLogout: () => void;
}> = ({ variant, displayName, user, userInitial, dashboardHref, onLogout }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
                variant="ghost"
                className={variant === 'desktop'
                    ? "flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2"
                    : "p-2"}
            >
                {variant === 'desktop' && (
                    <span className="text-sm text-gray-700 font-medium hidden sm:inline">
                        Hello {displayName}
                    </span>
                )}
                {user?.avatar ? (
                    <img
                        src={user.avatar}
                        alt={`${displayName}'s avatar`}
                        loading="lazy"
                        className={variant === 'desktop'
                            ? "w-8 h-8 rounded-full object-cover"
                            : "w-6 h-6 rounded-full object-cover"}
                    />
                ) : (
                    <div
                        className={variant === 'desktop'
                            ? "w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold"
                            : "w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold"}
                        aria-hidden
                    >
                        {userInitial}
                    </div>
                )}
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white">
            <div className="px-3 py-2 text-sm text-gray-800">
                <div className="font-semibold">{displayName}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href={dashboardHref} className="flex items-center gap-2 w-full">
                    <User className="w-4 h-4" />
                    Dashboard
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onClick={onLogout}
                className="text-red-600 focus:text-red-600"
            >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const Navbar: React.FC = () => {
    const { authenticated, user, role, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const { cartCount } = useCart();

    const handleSearchQuery = () => {
        const q = searchQuery.trim();
        if (!q) return;
        router.push(`/search?query=${encodeURIComponent(q)}`);
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
    };

    const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    useEffect(() => {
        const q = searchQuery.trim();
        if (!q) return;
        const t = setTimeout(() => {
            router.prefetch(`/search?query=${encodeURIComponent(q)}`);
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery, router]);

    useEffect(() => {
        router.prefetch(`/products`);
        router.prefetch(`/services`);
        router.prefetch(`/subscriptions`);
    }, [router]);

    useEffect(() => {
        if (!isSearchOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsSearchOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isSearchOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully");
            setIsMobileMenuOpen(false);
        } catch (error) {
            toast.error("Failed to logout. Please try again.");
        }
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
    };

    const getUserDisplayName = () => {
        return user?.name || user?.email?.split("@")[0] || "User";
    };

    const getUserInitial = () => {
        const name = user?.name || user?.email;
        return name ? name.charAt(0).toUpperCase() : "U";
    };

    const getDashboardRoute = () => {
        return role === "ADMIN" || role === "SUPER_ADMIN"
            ? "/admin/dashboard"
            : "/user/dashboard";
    };

    const displayName = getUserDisplayName();
    const userInitial = getUserInitial();
    const dashboardHref = getDashboardRoute();

    return (
        <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2 flex-shrink-0 select-none">
                        <Link
                            href="/"
                            className="flex items-center gap-2 outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            aria-label="Go to homepage"
                        >
                            <img
                                src="/cleardrip-logo.png"
                                alt="Clear Drip Logo"
                                className="w-8 h-8"
                                loading="eager"
                                width={32}
                                height={32}
                            />
                            <span className="font-bold text-lg sm:text-xl text-gray-900 select-none">
                                CLEARDRIP
                            </span>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        <NavLink href="/">Home</NavLink>
                        <NavLink href="/products">Products</NavLink>
                        <NavLink href="/services">Services</NavLink>
                        <NavLink href="/subscriptions">Subscriptions</NavLink>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearchQuery();
                            }}
                            className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 min-w-[200px]"
                            role="search"
                            aria-label="Site search"
                        >
                            <label htmlFor="navbar-search" className="sr-only">Search</label>
                            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <input
                                id="navbar-search"
                                type="text"
                                placeholder="Search…"
                                className="bg-transparent border-none outline-none text-sm w-full"
                                aria-label="Search"
                                autoComplete="off"
                                value={searchQuery}
                                onChange={handleSearchQueryChange}
                            />
                        </form>

                        {authenticated && role === "USER" && (
                            <>
                                <CartButton onClick={() => router.push('/cart')} count={cartCount} size="md" />
                            </>
                        )}
                        {authenticated ? (
                            <AccountMenu
                                variant="desktop"
                                displayName={displayName}
                                user={user}
                                userInitial={userInitial}
                                dashboardHref={dashboardHref}
                                onLogout={handleLogout}
                            />
                        ) : (
                            <Link
                                href="/user/signup"
                                className="px-4 py-2 border border-gray-900 rounded-2xl hover:bg-gray-900 hover:text-white transition-colors duration-200 text-gray-900 font-medium"
                            >
                                Sign Up
                            </Link>
                        )}
                    </div>

                    <div className="flex md:hidden items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            onClick={toggleSearch}
                            aria-label="Toggle search"
                            aria-expanded={isSearchOpen}
                            aria-controls="mobile-search"
                        >
                            <Search className="w-5 h-5 text-gray-600" />
                        </Button>

                        {authenticated ? (
                            <AccountMenu
                                variant="mobile"
                                displayName={displayName}
                                user={user}
                                userInitial={userInitial}
                                dashboardHref={dashboardHref}
                                onLogout={handleLogout}
                            />
                        ) : (
                            <Link
                                href="/user/signup"
                                className="px-3 py-1.5 text-sm border border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-colors duration-200 text-gray-900 font-medium"
                            >
                                Sign Up
                            </Link>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 lg:hidden"
                            onClick={toggleMobileMenu}
                            aria-label="Toggle mobile menu"
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-nav"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6 text-gray-600" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-600" />
                            )}
                        </Button>
                    </div>
                </div>

                {isSearchOpen && (
                    <div id="mobile-search" className="md:hidden py-3 border-t border-gray-200">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSearchQuery();
                            }}
                            className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
                            role="search"
                            aria-label="Site search"
                        >
                            <label htmlFor="mobile-navbar-search" className="sr-only">Search</label>
                            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <input
                                id="mobile-navbar-search"
                                type="text"
                                placeholder="Search…"
                                className="bg-transparent border-none outline-none text-sm w-full"
                                aria-label="Search"
                                autoFocus
                                autoComplete="off"
                                value={searchQuery}
                                onChange={handleSearchQueryChange}
                            />
                        </form>
                    </div>
                )}

                {isMobileMenuOpen && (
                    <div id="mobile-nav" className="lg:hidden border-t border-gray-200 bg-white">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <NavLink
                                href="/"
                                className="block px-3 py-2 rounded-md text-base"
                                onClick={closeMobileMenu}
                            >
                                Home
                            </NavLink>
                            <NavLink
                                href="/products"
                                className="block px-3 py-2 rounded-md text-base"
                                onClick={closeMobileMenu}
                            >
                                Products
                            </NavLink>
                            <NavLink
                                href="/services"
                                className="block px-3 py-2 rounded-md text-base"
                                onClick={closeMobileMenu}
                            >
                                Services
                            </NavLink>
                            <NavLink
                                href="/subscriptions"
                                className="block px-3 py-2 rounded-md text-base"
                                onClick={closeMobileMenu}
                            >
                                Subscription
                            </NavLink>

                            <div className="border-t border-gray-200 pt-2 mt-2">
                                <div className="flex items-center gap-4 px-3 py-2">
                                    <CartButton onClick={() => router.push('/cart')} count={cartCount} size="sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav >
    );
};

export default Navbar;