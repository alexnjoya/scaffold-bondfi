"use client";

import { Quote } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  image: string;
}

function TestimonialCard({ quote, author, role, image }: TestimonialProps) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <Quote className="h-8 w-8 text-primary/20 mb-4" />
      <p className="text-gray-700 mb-6 italic">{quote}</p>
      <div className="flex items-center">
        <img 
          src={image} 
          alt={author} 
          className="w-12 h-12 rounded-full object-cover mr-4"
        />
        <div>
          <h4 className="font-bold">{author}</h4>
          <p className="text-gray-600 text-sm">{role}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const testimonials = [
    {
      quote: "BondFi has transformed how our savings group operates. The transparency and automation have built trust among members.",
      author: "Sarah Johnson",
      role: "Savings Circle Leader",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"
    },
    {
      quote: "As a small business owner, accepting payments through BondFi has increased my customer base and simplified my accounting.",
      author: "Michael Osei",
      role: "Shop Owner",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop"
    },
    {
      quote: "Sending money to my family back home is now instant and costs a fraction of what I used to pay with traditional services.",
      author: "Amina Diallo",
      role: "Remittance User",
      image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=150&auto=format&fit=crop"
    }
  ];

  return (
    <section id="testimonials" className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied users who are building financial security with BondFi.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              image={testimonial.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
