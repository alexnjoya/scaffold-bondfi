"use client";

import { CircleDollarSign, Store, ArrowRightLeft, ShieldCheck, ArrowRight } from "lucide-react";

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast?: boolean;
}

function Step({ icon, title, description, isLast }: StepProps) {
  return (
    <div className="relative group">
      <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
        {/* Icon Container */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <div className="text-primary">
            {icon}
          </div>
        </div>
        
        {/* Content */}
        <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed mb-4">
          {description}
        </p>
        
        {/* Learn More Link */}
        <div className="flex items-center text-primary font-medium text-sm group-hover:translate-x-1 transition-transform duration-300">
          Learn more
          <ArrowRight className="h-4 w-4 ml-1" />
        </div>
      </div>
      
      {/* Connection Line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/20 to-transparent transform -translate-y-1/2" />
      )}
    </div>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: <CircleDollarSign className="h-10 w-10" />,
      title: "Join a Savings Circle",
      description: "Create or join a savings group with friends, family, or community members to pool resources and achieve financial goals together."
    },
    {
      icon: <Store className="h-10 w-10" />,
      title: "Shop with Merchants",
      description: "Use your pooled funds at verified merchants to build credit history, earn rewards, and support local businesses."
    },
    {
      icon: <ArrowRightLeft className="h-10 w-10" />,
      title: "Send Money Globally",
      description: "Transfer funds across borders with minimal fees, instant settlement, and complete transparency."
    },
    {
      icon: <ShieldCheck className="h-10 w-10" />,
      title: "Build Financial History",
      description: "Establish a verifiable credit history that travels with you anywhere and opens doors to financial opportunities."
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <CircleDollarSign className="h-4 w-4" />
            How It Works
          </div>
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Your Journey to Financial Freedom
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our platform makes financial inclusion simple, secure, and accessible to everyone. 
            Follow these four simple steps to start building your financial future.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => (
            <Step
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 text-primary font-medium">
            <ShieldCheck className="h-5 w-5" />
            Ready to get started?
          </div>
        </div>
      </div>
    </section>
  );
}
