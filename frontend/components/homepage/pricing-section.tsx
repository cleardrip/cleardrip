"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Star, Sparkles, Crown, Shield } from "lucide-react";
import { SubscriptionClass } from "@/lib/httpClient/subscription";
import { useRouter } from "next/navigation";

// Icon assignment logic based on plan name
const iconMap: Record<string, React.ElementType> = {
  Basic: Shield,
  Premium: Crown,
  Standard: Star,
};

interface Plans {
  id: string;
  name: string;
  price: string | number;
  period: string;
  description: string;
  popular: boolean;
  icon: React.ElementType;
  features: string[];
  savings: string | null;
  buttonText: string;
  buttonVariant: "outline" | "default";
}

export default function PricingSection() {
  const [plans, setPlans] = useState<Plans[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      setError(null);
      try {
        const response = await SubscriptionClass.getAllSubscriptions();
        if (response && response.success && response.data) {
          // Transform API data to match Plans interface
          const transformedPlans: Plans[] = response.data.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            price: plan.price.toString(),
            period: plan.duration,
            description: plan.description || "Perfect for your needs",
            popular: plan.popular || false,
            icon: iconMap[plan.name] || Shield,
            features: plan.features || [],
            savings: plan.savings || null,
            buttonText: plan.popular ? "Best Value" : "Get Started",
            buttonVariant: plan.popular ? "default" : "outline"
          }));
          setPlans(transformedPlans);
        } else {
          setError("Failed to load subscription plans.");
        }
      } catch (err) {
        setError("Unexpected error occurred while fetching plans.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      await SubscriptionClass.subscribeToPlan(planId);
    } catch (error) {
      console.error("Subscription failed:", error);
    }
  };

  const handleViewFAQ = () => {
    const faqSection = document.getElementById('faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 bg-blue-100 text-blue-800 border border-blue-200 shadow-lg">
            <Sparkles className="w-4 h-4" />
            Simple Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-blue-900">
            Choose your plan.
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">We'll handle the rest</span>
          </h2>
          <p className="text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed text-gray-700">
            Transparent pricing with no hidden fees. Choose the plan that fits your needs.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12 items-stretch">
          {/* Promotional Card */}
          <div className="xl:w-1/3 order-3 xl:order-1">
            <div className="rounded-3xl p-8 lg:p-10 text-white h-full relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Star className="w-6 h-6 text-yellow-300" />
                  </div>
                  <span className="text-yellow-300 font-semibold text-lg">Special Offer</span>
                </div>

                <h3 className="text-2xl lg:text-3xl font-bold mb-6 leading-tight text-white">
                  Save more with annual plans — exclusive loyalty discount included.
                </h3>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-300" />
                    <span className="text-white">No setup fees</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-300" />
                    <span className="text-white">24/7 customer support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-300" />
                    <span className="text-white">Money-back guarantee</span>
                  </div>
                </div>

                <div className="mt-8">
                  <img
                    src="/manspeaking.png"
                    alt="Happy customer testimonial illustration"
                    className="w-full h-48 lg:h-56 object-contain opacity-90"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="xl:w-7/12 order-1 xl:order-2">
            {loading ? (
              <div className="text-center py-20 text-xl text-blue-400 font-semibold">Loading plans…</div>
            ) : error ? (
              <div className="text-center py-20 text-xl text-red-400 font-semibold">{error}</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-20 text-xl text-slate-400 font-semibold">No plans found.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  {plans.slice(0, 3).map((plan, index) => {
                    const IconComponent = plan.icon;
                    return (
                      <PricingCard
                        key={plan.id}
                        plan={plan}
                        IconComponent={IconComponent}
                        index={index}
                        onSubscribe={() => handleSubscribe(plan.id)}
                      />
                    );
                  })}
                </div>

                <div className="mt-8 text-center">
                  <Button
                    onClick={() => router.push('/subscriptions')}
                    size="lg"
                    className="rounded-full px-10 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    View All Plans
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 lg:mt-20 text-center">
          <div className="rounded-2xl p-8 max-w-4xl mx-auto bg-white border border-gray-200 shadow-xl">
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
                className="rounded-full px-8 py-6 text-lg border-2 cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 font-semibold transition-all duration-300"
                onClick={() => {
                  router.push('/contact')
                }}
              >
                Contact Sales
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 py-6 text-lg cursor-pointer border-gray-600 text-gray-700 hover:bg-gray-50 hover:border-gray-700 font-semibold transition-all duration-300"
                onClick={handleViewFAQ}
              >
                View FAQ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Extracted PricingCard component
function PricingCard({
  plan,
  IconComponent,
  index,
  onSubscribe
}: {
  plan: Plans;
  IconComponent: React.ElementType;
  index: number;
  onSubscribe: () => void;
}) {
  return (
    <div
      className={`relative bg-white rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 group ${plan.popular
        ? 'ring-4 ring-blue-500 scale-105 border-blue-500'
        : 'border-gray-200 hover:border-blue-400'
        }`}
      style={{
        animationDelay: `${index * 200}ms`,
        animation: 'fadeInUp 0.8s ease-out forwards'
      }}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2">
            <Star className="w-4 h-4 fill-current" />
            Most Popular
          </div>
        </div>
      )}

      {/* Savings Badge */}
      {plan.savings && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold transform rotate-12 shadow-lg z-10">
          {plan.savings}
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${plan.popular ? 'bg-blue-600' : 'bg-gray-800'
          }`}>
          <IconComponent className="w-8 h-8 text-white" />
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
          <span className="text-lg text-gray-600">/ {plan.period} days</span>
        </div>
        {plan.period === "Lifetime" && (
          <p className="text-sm text-green-600 font-medium">One-time payment</p>
        )}
      </div>

      {/* Features List */}
      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${plan.popular ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
              <Check className={`w-3 h-3 ${plan.popular ? 'text-blue-600' : 'text-gray-700'}`} />
            </div>
            <span className="leading-relaxed text-gray-800">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button
        onClick={onSubscribe}
        className={`w-full py-6 text-lg font-semibold rounded-2xl transition-all duration-300 group text-white shadow-lg hover:shadow-xl ${plan.popular
          ? 'bg-blue-600 hover:bg-blue-700'
          : 'bg-gray-800 hover:bg-gray-900'
          }`}
      >
        {plan.buttonText}
        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
      </Button>

      {/* Value Proposition */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {plan.period === "Lifetime" ? "Never worry about RO maintenance again" : "Cancel anytime, no questions asked"}
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
      `;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
