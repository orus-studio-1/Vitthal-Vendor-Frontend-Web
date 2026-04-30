"use client";

import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Kumar",
    company: "Kumar Industries",
    location: "Ahmedabad, Gujarat",
    quote: "Since joining MTWO Groups, our order volume has increased by 60%. The platform connects us with genuine buyers who pay on time.",
    rating: 5,
    category: "Plastic Granules Supplier",
  },
  {
    name: "Priya Sharma",
    company: "Sharma Metals",
    location: "Delhi NCR",
    quote: "The dashboard is very simple to use. Even my father, who is not tech-savvy, can manage orders easily. Payment comes within 7 days guaranteed.",
    rating: 5,
    category: "Aluminium Supplier",
  },
  {
    name: "Mohammed Ali",
    company: "Ali Trading Co.",
    location: "Hyderabad, Telangana",
    quote: "We were skeptical at first, but MTWO Groups's verified buyer system ensures we only deal with serious businesses. No time wasters.",
    rating: 5,
    category: "Steel Products Supplier",
  },
];

export function VendorTestimonials() {
  return (
    <section className="bg-zinc-50 border-t border-zinc-200">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-zinc-900 sm:text-4xl">
            Success Stories from Our Vendors
          </h2>
          <p className="mt-3 text-base text-zinc-600 max-w-2xl mx-auto">
            Hear from suppliers who have grown their business with MTWO Groups
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="mb-4">
                <Quote size={24} className="text-emerald-200" />
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="border-t border-zinc-100 pt-4">
                <p className="font-semibold text-zinc-900">{testimonial.name}</p>
                <p className="text-sm text-zinc-600">{testimonial.company}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {testimonial.category} • {testimonial.location}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
            <span className="text-lg font-bold text-emerald-700">2,300+</span>
            <span className="text-sm text-emerald-700">Active Vendors Trust MTWO Groups</span>
          </div>
        </div>
      </div>
    </section>
  );
}
