'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3, Droplet, FileText, Bell, User, Settings, LogOut, Menu, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MyServices from '@/components/dashboard/MyServices';
import { OverviewTab } from '@/components/dashboard/OverviewTab';
import Payment from '@/components/dashboard/Payment';
import ProfileComponent from '@/components/dashboard/Profile';
import SettingsPage from '@/components/dashboard/Settings';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'services', label: 'My Services', icon: FileText },
  // { id: 'tds', label: 'Water TDS', icon: Droplet },
  { id: 'bills', label: 'Billing', icon: FileText },
  // { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'settings', label: 'Support', icon: Settings }
] as const;

type ViewType = typeof NAV_ITEMS[number]['id'];

const ClearDripDashboard = () => {
  const { authenticated, isUser, user, logout, authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize view from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ViewType | null;
    const validTabs = NAV_ITEMS.map(item => item.id);

    if (tabParam && validTabs.includes(tabParam)) {
      setView(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && (!authenticated || !isUser)) {
      router.push('/user/signin');
    }
  }, [authenticated, isUser, authLoading, router]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (id: ViewType) => {
    setView(id);
    // Update URL with new tab
    router.push(`/user/dashboard?tab=${id}`, { scroll: false });
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    alert("Logged out successfully");
    router.push('/user/signin');
  };

  const renderView = () => {
    switch (view) {
      case 'overview':
        return <OverviewTab />
      case 'services':
        return <MyServices />
      // case 'tds':
      //   return <Card><CardHeader><CardTitle>Water TDS</CardTitle></CardHeader><CardContent><p>Live water TDS.</p></CardContent></Card>;
      case 'bills':
        return <Payment />
      // case 'alerts':
      //   return <Card><CardHeader><CardTitle>Alerts</CardTitle></CardHeader><CardContent><p>Active alerts and notifications.</p></CardContent></Card>;
      case 'profile':
        return <ProfileComponent />
      case 'settings':
        return <SettingsPage />
      default:
        return null;
    }
  };

  if (authLoading) return <p className="flex items-center justify-center h-screen">Loading...</p>;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <nav
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-100 p-4 flex flex-col transition-transform duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="mb-6 font-bold text-lg sm:text-xl md:text-xl flex justify-between items-center">
          <span className="truncate">ClearDrip</span>
          <button
            className="md:hidden text-gray-700 hover:text-gray-900"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <ul className="flex-grow space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                onClick={() => handleNavClick(id)}
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm md:text-base transition-colors ${view === id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-blue-100'
                  }`}
              >
                <Icon className="mr-3 flex-shrink-0" size={18} />
                <span className="truncate">{label}</span>
              </button>
            </li>
          ))}
        </ul>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full flex items-center justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-sm md:text-base"
        >
          <LogOut className="mr-3 flex-shrink-0" size={18} />
          <span>Logout</span>
        </Button>
      </nav>

      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <div className="md:hidden flex items-center justify-between bg-gray-100 p-4 border-b border-gray-200">
          <button
            className="text-gray-700 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="w-6" />
        </div>

        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 bg-white">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

// Wrapper component to handle Suspense
const DashboardWithSuspense = () => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <ClearDripDashboard />
    </Suspense>
  );
};

export default DashboardWithSuspense;
