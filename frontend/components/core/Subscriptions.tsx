"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Star, Crown, Shield, Sparkles } from "lucide-react";
import { SubscriptionClass } from "@/lib/httpClient/subscription";
import { SubscriptionPlan } from "@/lib/types/subscription";
import { useRazorpayPayment } from "@/hooks/usePayment";
import { toast } from "sonner";
import { PaymentProcessingModal } from "../payment/Processing";

const iconMap: Record<string, React.ElementType> = {
  Basic: Shield,
  Premium: Crown,
  Standard: Star,
};

export default function SubscriptionsSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { startPayment, isProcessing } = useRazorpayPayment();
  const [amount, setAmount] = useState<number | undefined>(undefined);

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      setError(null);
      try {
        const response = await SubscriptionClass.getAllSubscriptions();
        if (response && response.success && response.data) {
          setPlans(
            response.data.slice(0, 3).map((plan: any) => ({
              id: plan.id,
              name: plan.name,
              price: plan.price,
              duration: plan.duration,
              description: plan.description,
              features: plan.features,
              savings: plan.savings ?? null,
              popular: plan.popular ?? false,
            }))
          );
        } else {
          setError("Failed to load subscriptions.");
        }
      } catch (err) {
        setError("Unexpected error occurred while fetching subscriptions.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      if (isProcessing) return;
      setAmount(undefined);
      const plan = plans.find((p) => p.id === planId);
      if (!plan) {
        toast.error("Selected plan not found.");
        return;
      }
      setAmount(Number(plan.price));
      startPayment({
        paymentFor: "SUBSCRIPTION",
        subscriptionPlanId: planId,
        onSuccess: (data) => {
          toast.success("Payment successful! Subscription activated.");
        },
        onError: (error) => {
          toast.error(`Payment failed: ${error.message}`);
        },
      });
    } catch (error) {
      console.error("Subscription failed:", error);
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <PaymentProcessingModal open={isProcessing} total={amount} />
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-blue-100 text-blue-800 border border-blue-200">
            <Sparkles className="w-4 h-4" />
            Available Subscriptions
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-blue-900" title="Compare subscription plans">
            Choose your plan.
            <br className="hidden sm:block" />
            <span className="text-gray-900">We'll handle the rest</span>
          </h2>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed text-gray-700">
            Transparent pricing with no hidden fees. Choose the plan that fits your needs.
          </p>
        </div>

        {/* Main content */}
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12 items-stretch">
          {/* Promotional Card */}
          <div className="xl:w-1/3 order-3 xl:order-1">
            <div className="rounded-3xl p-8 lg:p-10 text-white h-full relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Star className="w-6 h-6 text-yellow-300" />
                  </div>
                  <span className="text-yellow-300 font-semibold text-base">Special Offer</span>
                </div>

                <h3 className="text-2xl lg:text-3xl font-bold mb-6 leading-tight text-white">
                  Save more with annual plans — exclusive loyalty discount included.
                </h3>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span className="text-white text-base">No setup fees</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span className="text-white text-base">24/7 customer support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-300 flex-shrink-0" />
                    <span className="text-white text-base">Money-back guarantee</span>
                  </div>
                </div>

                <div className="mt-8">
                  <img
                    src="/manspeaking.png"
                    alt="Happy customer testimonial illustration"
                    title="Happy customer testimonial"
                    className="w-full h-48 lg:h-56 object-contain opacity-90"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="xl:w-2/3 order-1 xl:order-2">
            {loading ? (
              <div className="text-center py-20 text-xl text-blue-600 font-semibold">Loading subscriptions…</div>
            ) : error ? (
              <div className="text-center py-20 text-xl text-red-600 font-semibold">{error}</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-20 text-xl text-gray-700 font-medium">No subscriptions found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {plans.map((plan, index) => {
                  const IconComponent = iconMap[plan.name] || Shield;
                  return (
                    <PricingCard
                      key={plan.id}
                      plan={plan}
                      IconComponent={IconComponent}
                      index={index}
                      onSubscribe={() => handleSubscribe(plan.id)}
                      isProcessing={isProcessing}
                      processingAmount={amount}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 lg:mt-20 text-center">
          <div className="rounded-2xl p-8 max-w-4xl mx-auto bg-white shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">
              Still have questions?
            </h3>
            <p className="mb-6 text-lg text-gray-700">
              Our team is here to help you choose the right plan for your needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                size="lg"
                title="Contact our sales team"
                aria-label="Contact Sales"
                onClick={()=>{}}
                className="rounded-full px-8 py-6 text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 contact-btn cursor-pointer font-semibold"
              >
                Contact Sales
              </Button>
              <Button
                variant="outline"
                size="lg"
                title="View frequently asked questions"
                aria-label="View FAQ"
                className="rounded-full px-8 py-6 text-lg border-2 border-gray-600 text-gray-700 hover:bg-gray-50 faq-btn cursor-pointer font-semibold"
              >
                View FAQ
              </Button>
            </div>
            {/* View More Button */}
            <div className="mt-6">
              <Button
                variant="outline"
                size="lg"
                title="View More Subscriptions"
                aria-label="View More Subscriptions"
                className="rounded-full px-8 py-6 text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => window.location.href = '/subscriptions'}
              >
                View More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Pricing Card Component
function PricingCard({
  plan,
  IconComponent,
  index,
  onSubscribe,
  isProcessing,
  processingAmount
}: {
  plan: SubscriptionPlan;
  IconComponent: React.ElementType;
  index: number;
  onSubscribe: () => void;
  isProcessing?: boolean;
  processingAmount?: number | undefined;
}) {
  // determine if this specific plan is currently being processed
  const isProcessingThis = Boolean(isProcessing && processingAmount !== undefined && Number(plan.price) === processingAmount);

  return (
    <div
      className={`pricing-card relative bg-white rounded-3xl p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 group ${plan.popular
        ? 'ring-4 ring-blue-500 scale-105 lg:scale-110 border-blue-500'
        : 'border-gray-200 hover:border-blue-400'
        }`}
      title={`${plan.name} — ${plan.description}`}
      role="region"
      aria-label={`${plan.name} plan`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' && !isProcessingThis) onSubscribe(); }}
      style={{
        animationDelay: `${index * 200}ms`,
        animation: 'fadeInUp 0.8s ease-out forwards'
      }}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2" title="Most popular plan">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
            <Star className="w-4 h-4 fill-current" />
            Most Popular
          </div>
        </div>
      )}

      {/* Savings Badge */}
      {plan.savings && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold transform rotate-12 shadow-md" title={`Savings: ${plan.savings}`}>
          {plan.savings}
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${plan.popular ? 'bg-blue-600' : 'bg-gray-800'}`}>
          <IconComponent className="w-8 h-8 text-white" aria-hidden="true" title={`${plan.name} icon`} />
        </div>

        <h3 className="text-2xl lg:text-3xl font-bold mb-2 text-gray-900">
          {plan.name}
        </h3>
        <p className="text-base lg:text-lg text-gray-600">
          {plan.description}
        </p>
      </div>

      {/* Price Display */}
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className="text-3xl lg:text-4xl font-bold text-gray-900">₹{plan.price}</span>
          <span className="text-lg text-gray-600 font-medium">/ {plan.duration} days</span>
        </div>
        {plan.duration === "Lifetime" && (
          <p className="text-sm text-green-600 font-medium">One-time payment</p>
        )}
      </div>

      {/* Features List */}
      {plan.features && plan.features.length > 0 && (
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${plan.popular ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Check className={`w-3 h-3 ${plan.popular ? 'text-blue-600' : 'text-gray-700'}`} />
              </div>
              <span className="leading-relaxed text-gray-800">{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA Button */}
      <Button
        onClick={() => { if (!isProcessing) onSubscribe(); }}
        title={isProcessingThis ? `Processing ${plan.name}` : `Subscribe to ${plan.name}`}
        aria-label={isProcessingThis ? `Processing ${plan.name}` : `Subscribe to ${plan.name}`}
        aria-busy={isProcessingThis}
        className={`subscribe-btn w-full py-6 text-lg font-semibold rounded-2xl transition-all duration-300 group text-white shadow-lg hover:shadow-xl ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'}`}
        disabled={Boolean(isProcessing)}
      >
        {isProcessingThis ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="4"></circle>
              <path d="M22 12a10 10 0 0 0-10-10" stroke="white" strokeWidth="4" strokeLinecap="round"></path>
            </svg>
            Processing...
          </span>
        ) : (
          <>
            Subscribe
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </>
        )}
      </Button>

      {/* Value Proposition */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {plan.duration === "Lifetime" ? "Never worry about RO maintenance again" : "Cancel anytime, no questions asked"}
        </p>
      </div>
    </div>
  );
}

// Add CSS for animations
const styles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pricing-card {
  cursor: pointer;
  will-change: transform, box-shadow, border-color;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}
.pricing-card:focus {
  outline: none;
  box-shadow: 0 8px 24px rgba(13,60,100,0.12), 0 0 0 6px rgba(59,130,246,0.08);
  transform: translateY(-6px) scale(1.01);
  border-color: var(--blue-600);
}
.pricing-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 40px rgba(13,60,100,0.12);
  border-color: var(--blue-600);
}

/* Subscribe button hover/focus for stronger contrast */
.subscribe-btn {
  transition: filter .15s ease, box-shadow .15s ease, transform .15s ease;
}
.subscribe-btn:hover {
  filter: brightness(1.06);
  transform: translateY(-2px);
}
.subscribe-btn:focus {
  outline: none;
  box-shadow: 0 8px 20px rgba(59,130,246,0.12), 0 0 0 6px rgba(59,130,246,0.08);
}

/* CTA buttons */
.contact-btn, .faq-btn {
  transition: background-color .15s ease, transform .15s ease;
}
.contact-btn:hover, .faq-btn:hover {
  filter: brightness(0.98);
  transform: translateY(-2px);
}

/* Ensure icons don't capture pointer */
.pricing-card svg {
  pointer-events: none;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
