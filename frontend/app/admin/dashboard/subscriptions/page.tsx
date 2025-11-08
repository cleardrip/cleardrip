"use client";

import React, { useState, useEffect, useRef, useId, useCallback } from "react";
import { ShieldCheck, Trash2, Plus, Loader2, X, AlertCircle } from "lucide-react";
import { Subscription } from "@/lib/types/subscription";
import { SubscriptionClass } from "@/lib/httpClient/subscription";
import { toast } from "sonner";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: 0,
    duration: 0,
    description: "",
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const createDialogId = useId();
  const deleteDialogId = useId();

  const formatINR = useCallback((amount: number | string) => {
    const num = typeof amount === "number" ? amount : Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    if (formVisible) nameInputRef.current?.focus();
  }, [formVisible]);

  useEffect(() => {
    const hasModalOpen = formVisible || !!deleteId;
    if (hasModalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [formVisible, deleteId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (deleteId) setDeleteId(null);
        if (formVisible) setFormVisible(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formVisible, deleteId]);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const data = await SubscriptionClass.getAllSubscriptions();
      setSubscriptions(data?.data || []);
    } catch (error: any) {
      console.error("Failed to fetch subscriptions:", error);
      toast.error("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  }

  function onInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setNewPlan((prev) => ({
      ...prev,
      [name]: ["price", "duration"].includes(name) ? Number(value) : value,
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newPlan.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    if (newPlan.price < 0) {
      toast.error("Price cannot be negative");
      return;
    }
    if (newPlan.duration < 1) {
      toast.error("Duration must be at least 1 day");
      return;
    }

    setFormLoading(true);
    try {
      await SubscriptionClass.createSubscriptionPlan(newPlan);
      toast.success("Subscription plan created successfully");
      setNewPlan({ name: "", price: 0, duration: 0, description: "" });
      setFormVisible(false);
      fetchSubscriptions();
    } catch (error: any) {
      console.error("Failed to create subscription:", error);
      toast.error(error.message || "Failed to create subscription");
    } finally {
      setFormLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;

    setDeleteError(null);
    setFormLoading(true);

    try {
      const response = await SubscriptionClass.deleteSubscriptionPlan(deleteId);
      toast.success("Subscription deleted successfully");
      setSubscriptions((subs) => subs.filter((s) => s.id !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || "Failed to delete subscription";
      setDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  }

  async function toggleActiveStatus(planId: string, currentStatus: boolean) {
    setToggleLoading(planId);
    try {
      await SubscriptionClass.toggleSubscriptionStatus(planId);
      toast.success(`Subscription plan ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchSubscriptions();
    } catch (error: any) {
      console.error("Failed to toggle subscription status:", error);
      toast.error(error.message || "Failed to update subscription status");
    } finally {
      setToggleLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white text-blue-700 px-3 py-2 rounded shadow z-50"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-30 bg-white border-b border-gray-200" role="banner">
        <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  Subscription Plans
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Create and manage plans
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormVisible(true)}
              title="Create a new subscription plan"
              aria-label="Create a new subscription plan"
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all text-xs sm:text-sm font-medium flex-shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-600 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span className="hidden sm:inline">Add Plan</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="p-3 sm:p-4 md:p-6">
        <div className="max-w-5xl mx-auto">
          <section
            className="bg-white rounded-lg shadow-sm border"
            role="region"
            aria-labelledby="subscription-plans-heading"
            aria-busy={loading}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 id="subscription-plans-heading" className="text-base sm:text-lg font-semibold text-gray-900">
                All Plans
              </h2>
              <div className="sr-only" aria-live="polite">
                {loading
                  ? "Loading subscription plans..."
                  : `Loaded ${subscriptions.length} subscription plan${subscriptions.length === 1 ? "" : "s"}.`}
              </div>
              {/* Added admin delete restriction note */}
              <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3 flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" aria-hidden="true" />
                <p className="text-xs sm:text-sm text-amber-800">
                  Note: Admins cannot delete subscription plans which are already used. Deactivate a plan instead to prevent new sign-ups.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12 sm:py-16">
                <Loader2 className="animate-spin text-blue-600 w-8 h-8" aria-label="Loading" />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-12 sm:py-16 px-4">
                <ShieldCheck className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-3 sm:mb-4" aria-hidden="true" />
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  No subscription plans found.
                </p>
                <button
                  type="button"
                  onClick={() => setFormVisible(true)}
                  title="Create your first plan"
                  aria-label="Create your first plan"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
                >
                  Create Your First Plan
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200" role="list">
                {subscriptions.map((plan) => (
                  <div
                    key={plan.id}
                    role="listitem"
                    className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-gray-50 to-white hover:shadow-sm transition-shadow flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                          {plan.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${plan.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-blue-700 font-medium mt-1">
                        {formatINR(plan.price)} • {plan.duration} day{plan.duration !== 1 ? "s" : ""}
                      </p>
                      {plan.description && (
                        <p className="text-xs sm:text-sm text-gray-700 mt-2 line-clamp-2">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => toggleActiveStatus(plan.id, plan.isActive)}
                        disabled={toggleLoading === plan.id}
                        title={`${plan.isActive ? 'Deactivate' : 'Activate'} subscription plan "${plan.name}"`}
                        aria-label={`${plan.isActive ? 'Deactivate' : 'Activate'} subscription plan ${plan.name}`}
                        className={`px-3 py-2 rounded-md border transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${plan.isActive
                            ? "border-orange-400 text-orange-700 hover:bg-orange-50 focus-visible:ring-orange-600"
                            : "border-green-400 text-green-700 hover:bg-green-50 focus-visible:ring-green-600"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {toggleLoading === plan.id ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" aria-hidden="true" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                        )}
                        <span className="text-xs sm:text-sm hidden sm:inline">
                          {plan.isActive ? "Deactivate" : "Activate"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteId(plan.id);
                          setDeleteError(null);
                        }}
                        title={`Delete subscription plan "${plan.name}"`}
                        aria-label={`Delete subscription plan ${plan.name}`}
                        className="px-3 py-2 rounded-md border border-red-400 text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                        <span className="text-xs sm:text-sm hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {formVisible && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={onSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${createDialogId}-title`}
            aria-describedby={`${createDialogId}-desc`}
            className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 md:p-10 my-auto relative animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
          >
            <button
              onClick={() => setFormVisible(false)}
              type="button"
              className="absolute right-4 sm:right-6 top-4 sm:top-6 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              aria-label="Close create subscription plan dialog"
              title="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </button>

            <h2 id={`${createDialogId}-title`} className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-center pr-8">
              Create Subscription Plan
            </h2>
            <p id={`${createDialogId}-desc`} className="text-sm text-gray-600 mb-6 sm:mb-8 text-center">
              Fill out the fields to create a new subscription plan
            </p>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="plan-name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Plan Name *
                </label>
                <input
                  id="plan-name"
                  ref={nameInputRef}
                  name="name"
                  value={newPlan.name}
                  onChange={onInputChange}
                  placeholder="e.g., Premium Monthly"
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="plan-price" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Price (₹) *
                  </label>
                  <input
                    id="plan-price"
                    name="price"
                    value={newPlan.price}
                    onChange={onInputChange}
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="plan-duration" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Duration (days) *
                  </label>
                  <input
                    id="plan-duration"
                    name="duration"
                    value={newPlan.duration}
                    onChange={onInputChange}
                    type="number"
                    min={1}
                    step={1}
                    placeholder="30"
                    className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="plan-description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="plan-description"
                  name="description"
                  value={newPlan.description}
                  rows={3}
                  onChange={onInputChange}
                  placeholder="Enter plan description..."
                  className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 sm:mt-8">
              <button
                type="button"
                onClick={() => setFormVisible(false)}
                title="Cancel creating plan"
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg text-gray-700 bg-white font-medium text-sm sm:text-base hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                aria-disabled={formLoading}
                title="Create plan"
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-blue-600 text-white font-medium text-sm sm:text-base hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                    Creating...
                  </>
                ) : (
                  "Create Plan"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${deleteDialogId}-title`}
            aria-describedby={`${deleteDialogId}-desc`}
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 my-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
          >
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
            </div>

            <h2 id={`${deleteDialogId}-title`} className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 text-center">
              Confirm Delete
            </h2>
            <p id={`${deleteDialogId}-desc`} className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 text-center">
              Are you sure you want to delete this subscription plan? This action cannot be undone.
            </p>

            {/* Added admin delete restriction note in dialog */}
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2" role="note" aria-live="polite">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" aria-hidden="true" />
              <div className="text-xs sm:text-sm text-amber-800">
                Note: Admins cannot delete subscription plans. Deactivate the plan instead to stop new sign-ups.
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2" role="alert">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs sm:text-sm text-red-800">{deleteError}</div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeleteError(null);
                }}
                disabled={formLoading}
                aria-disabled={formLoading}
                type="button"
                title="Cancel deletion"
                className="flex-1 border border-gray-300 bg-white text-gray-700 rounded-lg py-2.5 sm:py-3 font-medium text-sm sm:text-base hover:bg-gray-50 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={formLoading}
                aria-disabled={formLoading}
                type="button"
                title="Delete this plan"
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 sm:py-3 font-medium text-sm sm:text-base hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
