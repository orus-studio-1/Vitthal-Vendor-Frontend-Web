"use client";

import React, { useState } from "react";
import { Mail, Phone, Clock, MessageSquare, Send, HelpCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function HelpSupportPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: "How do I upload a new product?",
      answer: "Go to your Products dashboard, click the 'Add Product' button at the top right, fill in all required product specifications, pricing details, and upload high-resolution images. Once submitted, our admin team will review and approve your listing within 24 hours.",
    },
    {
      id: 2,
      question: "When will I receive my payouts?",
      answer: "Payouts are automatically processed on a T+2 settlement cycle (within 2 business days of the order delivery). You can view detailed statements and transaction history in the Payouts & Settlements section.",
    },
    {
      id: 3,
      question: "How do I manage customer orders?",
      answer: "Whenever a customer places an order, you'll receive real-time email and dashboard notifications. Head to the Orders page to see all details. Once packaged, ship the order and update its status to 'Shipped' along with the courier tracking ID.",
    },
    {
      id: 4,
      question: "What are the commission rates and fees?",
      answer: "Commission rates vary by product category, ranging between 2% and 10%. You can view your active rates under your onboarding contract or raise an inquiry to get the detailed category commission matrix.",
    },
    {
      id: 5,
      question: "How do I update my bank account details?",
      answer: "To change your registered bank account or update GST/PAN documents, go to your Profile Settings. For security reasons, changes to payment accounts require admin approval, which takes up to 24 hours.",
    },
  ];

  const toggleFAQ = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in both the subject and message fields.");
      return;
    }

    setIsSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubject("");
      setMessage("");
      setCategory("general");
      toast.success("Support ticket created successfully! We will get back to you within 24 hours.");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-600/30 rounded-full text-xs font-medium border border-emerald-500/20">
              <HelpCircle size={14} />
              Help Center
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Help & Support Center</h1>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
              Have questions or need assistance with your store? Browse our frequently asked questions or connect with our dedicated vendor support team.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
              <Mail size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Email Support</h3>
            <p className="text-xs text-gray-400 mb-3">Send us an email anytime</p>
            <a href="mailto:support@mtwo.in" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              support@mtwo.in
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
              <Phone size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Call Support</h3>
            <p className="text-xs text-gray-400 mb-3">Talk to a support agent</p>
            <a href="tel:+918530090303" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              +91 85300 90303
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Business Hours</h3>
            <p className="text-xs text-gray-400 mb-3">When we are active</p>
            <span className="text-sm font-semibold text-gray-700">
              Mon - Sat, 9:00 AM - 6:00 PM
            </span>
          </div>
        </div>

        {/* Support Chat Box CTA */}
        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
              <MessageSquare className="text-emerald-600" size={20} />
              Need Instant Help?
            </h3>
            <p className="text-sm text-emerald-800 leading-relaxed max-w-xl">
              Chat directly with our support administrators. Solve technical glitches, order discrepancies, or update requests in real-time.
            </p>
          </div>
          <Link
            href="/chat"
            className="w-full md:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-emerald-200 hover:bg-emerald-700 transition-all text-center"
          >
            Chat with Admin
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-sm text-gray-500 mt-1">Quick answers to common questions raised by our sellers</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {faqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div key={faq.id} className="transition-colors hover:bg-gray-50/20">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-semibold text-gray-800 hover:text-gray-900 outline-none cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`text-gray-400 transition-transform duration-200 transform ${isExpanded ? "rotate-180 text-emerald-600" : ""}`}
                    >
                      ▼
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-48 border-t border-gray-50 bg-gray-50/30" : "max-h-0"}`}
                  >
                    <p className="px-6 py-5 text-sm text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Submit a Support Ticket</h2>
            <p className="text-sm text-gray-500 mt-1">Send a message directly to our help desk. We will respond within 24 hours.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: "general", label: "General" },
                  { value: "payouts", label: "Payouts & Settlements" },
                  { value: "products", label: "Product Listing" },
                  { value: "technical", label: "Technical Issue" },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-4 py-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                      category === cat.value
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-50"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-semibold text-gray-700 block">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your inquiry"
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-semibold text-gray-700 block">
                Message Description
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain your question or problem in detail..."
                rows={5}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={16} />
                  Submit Inquiry
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
