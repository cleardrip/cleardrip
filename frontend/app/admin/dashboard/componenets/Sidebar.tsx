/* eslint-disable react/no-unescaped-entities */
'use client';

import {
    ChevronDown,
    Home,
    LogOut,
    MessageSquare,
    User,
    Package,
    CalendarCheck,
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@radix-ui/react-separator';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// Loading Skeleton Component
function SidebarSkeleton() {
    return (
        <Sidebar className="border-r border-gray-200 bg-white">
            <SidebarHeader className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24 bg-gray-200" />
                        <Skeleton className="h-3 w-20 bg-gray-200" />
                    </div>
                </div>
            </SidebarHeader>

            <Separator className="my-2 h-px bg-gray-200" />

            <SidebarContent className="px-3">
                <div className="space-y-1 py-4">
                    <Skeleton className="h-4 w-20 mb-3 ml-2 bg-gray-200" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-3">
                            <Skeleton className="h-5 w-5 bg-gray-200" />
                            <Skeleton className="h-4 flex-1 bg-gray-200" />
                        </div>
                    ))}
                </div>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-28 bg-gray-200" />
                        <Skeleton className="h-3 w-32 bg-gray-200" />
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const {
        authenticated,
        authLoading,
        logout,
        isSuperAdmin,
        isAdmin,
        user: loggedInUser,
        role,
    } = useAuth();

    // Get navigation items based on role
    const getNavigationItems = () => {
        const baseItems = [
            {
                title: 'Overview',
                url: '/admin/dashboard',
                icon: Home,
            },
            {
                title: 'Manage Services and Slots',
                url: '/admin/dashboard/services',
                icon: MessageSquare,
            },
        ];

        // Only show additional items for superadmin
        if (role === "SUPER_ADMIN" || isSuperAdmin) {
            return [
                ...baseItems,
                {
                    title: 'Manage Products',
                    url: '/admin/dashboard/products',
                    icon: Package,
                },
                {
                    title: 'Manage Staff',
                    url: '/admin/dashboard/staff',
                    icon: User,
                },
                {
                    title: 'Manage Subscriptions',
                    url: '/admin/dashboard/subscriptions',
                    icon: CalendarCheck,
                },
            ];
        }

        // For regular admin, only return base items
        return baseItems;
    };

    const navigationItems = getNavigationItems();

    useEffect(() => {
        // Prefetch pages based on role
        const pagesToPrefetch = navigationItems.map(item => item.url);
        pagesToPrefetch.forEach((page) => {
            router.prefetch(page);
        });
    }, [router, navigationItems]);

    const ClearDripLogo = '/cleardrip-logo.png';

    const email = loggedInUser?.email;
    const userInitials = loggedInUser?.name || email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'AD';

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Logout failed');
        }
    };

    // Show skeleton while loading
    if (authLoading || !loggedInUser) {
        return <SidebarSkeleton />;
    }

    return (
        <Sidebar className="border-r border-gray-200 bg-white/95 backdrop-blur">
            <SidebarHeader className="border-b border-gray-200 bg-white/50 p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="hover:bg-accent/50 transition-colors"
                        >
                            <a href="/" className="flex items-center gap-3 px-2">
                                <div className="flex aspect-square h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                                    <img
                                        src={ClearDripLogo}
                                        alt="Clear Drip Logo"
                                        className="h-6 w-6 object-contain"
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-bold tracking-tight">
                                        CLEAR DRIP
                                    </span>
                                    <span className="truncate text-xs font-medium text-muted-foreground">
                                        Admin Dashboard
                                    </span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-3 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-2 text-xs font-semibold text-gray-600 mb-2 flex items-center justify-between">
                        <span>Navigation</span>
                        <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                        </span>
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="mt-2">
                        <SidebarMenu className="space-y-1">
                            {navigationItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                        className="transition-all duration-200 hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600"
                                    >
                                        <a
                                            href={item.url}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                                        >
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            <span className="text-sm font-medium truncate">
                                                {item.title}
                                            </span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-200 bg-white/50 p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-gray-100 hover:bg-gray-50 transition-colors w-full"
                                >
                                    <Avatar className="h-10 w-10 rounded-lg border-2 border-white shadow-sm">
                                        <AvatarImage
                                            src={loggedInUser.avatar}
                                            alt={loggedInUser.name || email || 'Admin'}
                                        />
                                        <AvatarFallback className="rounded-lg bg-blue-600 text-white font-semibold">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                                        <span className="truncate font-semibold text-gray-900">
                                            {loggedInUser.name || userInitials}
                                        </span>
                                        <span className="truncate text-xs text-gray-600">
                                            {email}
                                        </span>
                                        <span className="truncate text-[10px] font-medium text-blue-600 mt-0.5">
                                            {role === "SUPER_ADMIN" ? "Super Administrator" : "Administrator"}
                                        </span>
                                    </div>
                                    <ChevronDown className="ml-auto h-4 w-4 flex-shrink-0 transition-transform duration-200 data-[state=open]:rotate-180 text-gray-600" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-white/95 backdrop-blur border border-gray-200 shadow-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span className="font-medium">Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
