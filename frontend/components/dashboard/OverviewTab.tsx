import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { TdsClass } from "@/lib/httpClient/tds";
import { SubscriptionClass } from "@/lib/httpClient/subscription";
import { ServicesClass } from "@/lib/httpClient/services";
import { TDSLog } from "@/lib/types/tds";
import { ArrowUpRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  plan: {
    id: string;
    name: string;
    description: string;
    price: string;
    duration: number;
    createdAt: string;
    updatedAt: string;
  };
}

interface Service {
  id: string;
  bookingId?: string;
  scheduledDate: string | null;
  timeSlot?: string;
  serviceType?: string;
  status: string;
}

interface OverviewTabProps {
  user?: {
    name?: string;
    loyaltyBadge?: string;
  };
}

// Constants
const TDS_SAFE_LIMIT = 550;
const FILTER_HEALTH_PERCENTAGE = 85;
const CHART_DAYS = 7;

// Utility functions
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Not scheduled";
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getDaysUntilService = (scheduledDate: string | null): number | null => {
  if (!scheduledDate) return null;
  const today = new Date();
  const serviceDate = new Date(scheduledDate);
  const timeDiff = serviceDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(0, daysDiff);
};

const isSubscriptionActive = (subscription: Subscription | null): boolean => {
  if (!subscription?.endDate) return false;
  const today = new Date();
  const endDate = new Date(subscription.endDate);
  return endDate > today;
};

const getSubscriptionStatus = (subscription: Subscription | null): string => {
  if (!subscription) return "No Subscription";
  return isSubscriptionActive(subscription) ? "Active" : "Expired";
};

// Sub-components
const LiveTDSCard: React.FC<{ liveTDS: number | null }> = ({ liveTDS }) => (
  <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-lg overflow-hidden">
    <CardContent className="p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Live TDS</span>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-label="Live indicator"></div>
        </div>
        <div className="text-4xl sm:text-6xl opacity-20" aria-hidden="true">💧</div>
      </div>
      <div className="mb-2">
        <div className="text-3xl sm:text-4xl font-bold mb-1">
          {liveTDS !== null ? (
            <span>{liveTDS} <span className="text-lg sm:text-2xl">ppm</span></span>
          ) : (
            <span className="text-white/60 text-xl sm:text-2xl">No data</span>
          )}
        </div>
        <div className="text-xs sm:text-sm opacity-80">Safe until {TDS_SAFE_LIMIT}ppm</div>
      </div>
      {liveTDS !== null && liveTDS > TDS_SAFE_LIMIT && (
        <div className="flex items-center gap-2 mt-3 p-2 bg-red-500/20 rounded text-xs">
          <AlertTriangle className="w-4 h-4" />
          <span>TDS level exceeds safe limit</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const FilterHealthCard: React.FC = () => {
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference * (1 - FILTER_HEALTH_PERCENTAGE / 100);

  return (
    <Card className="bg-white border shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Filter Health</h3>
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4" role="progressbar" aria-valuenow={FILTER_HEALTH_PERCENTAGE} aria-valuemin={0} aria-valuemax={100}>
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="36"
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="36"
                stroke="#06b6d4"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold text-gray-700">{FILTER_HEALTH_PERCENTAGE}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">remaining</p>
          <p className="text-xs text-gray-500 text-center mt-3">
            Estimated replacement in 2 months
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const SubscriptionCard: React.FC<{ subscription: Subscription | null; user?: OverviewTabProps['user'] }> = ({
  subscription,
  user
}) => {
  const status = getSubscriptionStatus(subscription);
  const statusColor = status === "Active" ? "text-green-600" : status === "Expired" ? "text-red-600" : "text-gray-600";

  return (
    <Card className="bg-white border shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Subscription Plan</h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="More options"
          >
            {/* <MoreHorizontal className="w-5 h-5" /> */}
          </button>
        </div>

        {subscription ? (
          <div className="space-y-2.5">
            <InfoRow label="Plan" value={subscription.plan.name || "N/A"} valueClass="capitalize" />
            <InfoRow label="Status" value={status} valueClass={`capitalize ${statusColor}`} />
            {user?.loyaltyBadge && (
              <InfoRow label="Badge" value={user.loyaltyBadge} valueClass="text-yellow-600" />
            )}
            {subscription.startDate && (
              <InfoRow label="Valid from" value={formatDate(subscription.startDate)} />
            )}
            {subscription.endDate && (
              <InfoRow label="Valid until" value={formatDate(subscription.endDate)} />
            )}
            {subscription.id && (
              <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                ID: {subscription.id.slice(0, 8)}...
              </p>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-4">No active subscription found</div>
        )}
      </CardContent>
    </Card>
  );
};

const InfoRow: React.FC<{ label: string; value: string; valueClass?: string }> = ({
  label,
  value,
  valueClass = ""
}) => (
  <div>
    <p className="text-sm text-gray-600">
      {label}: <span className={`font-medium ${valueClass}`}>{value}</span>
    </p>
  </div>
);

const WaterAnalyticsCard: React.FC<{ chartData: any[]; alertDay: string | undefined }> = ({
  chartData,
  alertDay
}) => (
  <Card className="bg-white border shadow-sm">
    <CardContent className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h3 className="text-base sm:text-lg font-semibold">Water Usage Analytics</h3>
        <select
          className="text-sm border rounded px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Select time period"
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
      </div>

      {chartData.length > 0 ? (
        <>
          <div className="h-48 sm:h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis
                  domain={[0, 800]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="InputTDS"
                  stroke="#374151"
                  strokeWidth={2}
                  dot={{ fill: '#374151', strokeWidth: 2, r: 3 }}
                  name="Input TDS"
                />
                <Line
                  type="monotone"
                  dataKey="PurifiedTDS"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  name="Purified TDS"
                />
                {alertDay && (
                  <ReferenceDot
                    x={alertDay}
                    y={chartData.find(d => d.day === alertDay)?.InputTDS}
                    r={6}
                    fill="#ef4444"
                    stroke="#dc2626"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <LegendItem color="bg-gray-700" label="Input TDS" />
            <LegendItem color="bg-blue-500" label="Purified TDS" />
          </div>

          {alertDay && (
            <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-red-700">
                <strong>Alert:</strong> Input TDS levels exceeded {TDS_SAFE_LIMIT} ppm on {alertDay}
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500">
          No TDS data available
        </div>
      )}
    </CardContent>
  </Card>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 ${color} rounded-full`}></div>
    <span className="text-xs sm:text-sm text-gray-600">{label}</span>
  </div>
);

const NextServiceCard: React.FC<{ nextService: Service | null }> = ({ nextService }) => {
  const daysUntil = nextService?.scheduledDate ? getDaysUntilService(nextService.scheduledDate) : null;

  const handleReschedule = useCallback(() => {
    toast.info("Reschedule feature coming soon");
  }, []);

  const handleAddToCalendar = useCallback(() => {
    toast.info("Add to calendar feature coming soon");
  }, []);

  return (
    <Card className="bg-white border shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold">Next RO Service</h3>
          <button
            className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="View service details"
          >
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
          </button>
        </div>

        {nextService ? (
          <div className="space-y-4">
            {daysUntil !== null && (
              <p className="text-sm text-gray-600">
                Due in <span className="font-semibold text-lg text-gray-900">{daysUntil}</span>{" "}
                <span className="font-semibold">Days</span>
              </p>
            )}

            <div className="space-y-2">
              <InfoRow label="Date" value={formatDate(nextService.scheduledDate)} />
              {nextService.bookingId && (
                <InfoRow label="Booking ID" value={nextService.bookingId} />
              )}
              {nextService.id && !nextService.bookingId && (
                <InfoRow label="Service ID" value={nextService.id} />
              )}
              <InfoRow label="Time" value={nextService.timeSlot || "Between 10 AM – 1 PM"} />
              {nextService.serviceType && (
                <InfoRow label="Type" value={nextService.serviceType} valueClass="capitalize" />
              )}
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={handleReschedule}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Reschedule
              </button>
              <button
                onClick={handleAddToCalendar}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Add to Calendar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-4">No upcoming service scheduled</div>
        )}
      </CardContent>
    </Card>
  );
};

// Main component
export const OverviewTab: React.FC<OverviewTabProps> = ({ user }) => {
  const [tdsLogs, setTdsLogs] = useState<TDSLog[]>([]);
  const [liveTDS, setLiveTDS] = useState<number | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [nextService, setNextService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [tdsRes, subRes, servicesRes] = await Promise.allSettled([
          TdsClass.getRecentTDSLogs(1, CHART_DAYS),
          SubscriptionClass.getCurrentSubscription(),
          ServicesClass.getAllServices(5, 0)
        ]);

        // Handle TDS data
        if (tdsRes.status === 'fulfilled') {
          const logs = Array.isArray(tdsRes.value.tdsLogs) ? tdsRes.value.tdsLogs : [];
          setTdsLogs(logs);
          if (logs.length) {
            setLiveTDS(logs[logs.length - 1]?.tdsValue || null);
          }
        }

        // Handle subscription data
        if (subRes.status === 'fulfilled') {
          setSubscription((subRes.value as any).data || null);
        }

        // Handle services data
        if (servicesRes.status === 'fulfilled') {
          const services = Array.isArray(servicesRes.value.services) ? servicesRes.value.services : [];
          // const upcoming = services.find((svc: any) =>
          //   svc.status === "PENDING" || svc.status === "SCHEDULED"
          // ) as Service | null; // Ensure upcoming is of type Service or null
          // setNextService(upcoming || null);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const chartData = useMemo(() =>
    tdsLogs.map((log: any, idx: number) => ({
      day: log.day || (log.createdAt ? new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) : `Day ${idx + 1}`),
      InputTDS: log.inputTds ?? log.tdsValue ?? 0,
      PurifiedTDS: log.purifiedTds ?? 0,
    })),
    [tdsLogs]
  );

  const alertDay = useMemo(() =>
    chartData.find((log: any) => log.InputTDS > TDS_SAFE_LIMIT)?.day,
    [chartData]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-base sm:text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-96">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p className="text-base sm:text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-4">
      {/* Top row - 2 cards on large screens */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <LiveTDSCard liveTDS={liveTDS} />
        <FilterHealthCard />
      </div>

      {/* Subscription card - Right column on large screens */}
      <SubscriptionCard subscription={subscription} user={user} />

      {/* Water Analytics - Full width on medium screens, 2 cols on large */}
      <div className="lg:col-span-2">
        <WaterAnalyticsCard chartData={chartData} alertDay={alertDay} />
      </div>

      {/* Next Service - Right column on large screens */}
      <NextServiceCard nextService={nextService} />
    </div>
  );
};
