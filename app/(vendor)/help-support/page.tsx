"use client";

import React, { useState } from "react";
import { Mail, Phone, Clock, MessageSquare, HelpCircle, ChevronDown, MessageCircle, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function HelpSupportPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: "How do I upload a new product?",
      answer:
        "Go to your Products dashboard, click the 'Add Product' button at the top right, fill in all required product specifications, pricing details, and upload high-resolution images. Once submitted, our admin team will review and approve your listing within 24 hours.",
    },
    {
      id: 2,
      question: "When will I receive my payouts?",
      answer:
        "Payouts are automatically processed on a T+2 settlement cycle (within 2 business days of the order delivery). You can view detailed statements and transaction history in the Payouts & Settlements section.",
    },
    {
      id: 3,
      question: "How do I manage customer orders?",
      answer:
        "Whenever a customer places an order, you'll receive real-time email and dashboard notifications. Head to the Orders page to see all details. Once packaged, ship the order and update its status to 'Shipped' along with the courier tracking ID.",
    },
    {
      id: 4,
      question: "What are the commission rates and fees?",
      answer:
        "Commission rates vary by product category, ranging between 2% and 10%. You can view your active rates under your onboarding contract or raise an inquiry to get the detailed category commission matrix.",
    },
    {
      id: 5,
      question: "How do I update my bank account details?",
      answer:
        "To change your registered bank account or update GST/PAN documents, go to your Profile Settings. For security reasons, changes to payment accounts require admin approval, which takes up to 24 hours.",
    },
  ];

  const toggleFAQ = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const WHATSAPP_NUMBER = "918530090303";
  const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello MTWO Support Team, I am a registered vendor on MTWO Groups and need assistance with my store."
  )}`;

  return (
    <div className="min-h-screen bg-[#fafafa] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-600/30 rounded-full text-xs font-medium border border-emerald-500/20">
              <HelpCircle size={14} />
              Vendor Help Center
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Help & Support Center</h1>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed">
              Have questions or need assistance with your catalog, orders, or payouts? Chat directly with our dedicated vendor support team on WhatsApp or review our quick guide below.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* WhatsApp Primary Card */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-2xl p-6 border-2 border-emerald-500/30 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col items-center text-center group cursor-pointer relative overflow-hidden"
          >
            <span className="absolute top-3 right-3 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
              Instant
            </span>
            <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" width="28" height="28" className="fill-current text-[#25D366]">
                <path d="M12.004 2c-5.523 0-10 4.477-10 10 0 1.767.458 3.427 1.258 4.873L2 22l5.282-1.229C8.68 21.523 10.292 22 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.286c-1.503 0-2.928-.415-4.153-1.137l-.298-.175-3.086.719.736-2.999-.192-.307C4.246 15.11 3.718 13.606 3.718 12c0-4.57 3.716-8.286 8.286-8.286 4.57 0 8.286 3.716 8.286 8.286 0 4.57-3.716 8.286-8.286 8.286zm4.537-6.208c-.248-.124-1.468-.724-1.696-.807-.228-.083-.394-.124-.56.124-.166.248-.642.807-.787.973-.145.166-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.236-1.472-1.381-1.72-.145-.248-.016-.382.108-.505.112-.112.248-.29.373-.435.124-.145.166-.248.248-.415.083-.166.041-.31-.021-.435-.062-.124-.56-1.349-.767-1.848-.201-.486-.406-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.31-.228.248-.871.851-.871 2.075 0 1.224.891 2.407 1.015 2.573.124.166 1.754 2.678 4.249 3.755.594.257 1.057.41 1.419.525.596.19 1.139.163 1.568.099.479-.071 1.468-.6 1.675-1.18.207-.58.207-1.077.145-1.18-.062-.103-.228-.166-.477-.29z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">WhatsApp Chat</h3>
            <p className="text-xs text-gray-500 mb-3">Chat directly with admin team</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 group-hover:text-emerald-800">
              Start WhatsApp Chat <ExternalLink size={13} />
            </span>
          </a>

          {/* Email Support */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
            <div className="p-3.5 bg-blue-50 rounded-2xl text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <Mail size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Email Support</h3>
            <p className="text-xs text-gray-500 mb-3">Send official business queries</p>
            <a href="mailto:support@mtwo.in" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors break-all">
              support@mtwo.in
            </a>
          </div>

          {/* Phone Support */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
            <div className="p-3.5 bg-amber-50 rounded-2xl text-amber-600 mb-4 group-hover:scale-110 transition-transform">
              <Phone size={24} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Helpline Number</h3>
            <p className="text-xs text-gray-500 mb-3">Mon - Sat, 9:00 AM - 6:00 PM</p>
            <a href="tel:+918530090303" className="text-sm font-semibold text-amber-700 hover:text-amber-800 transition-colors">
              +91 85300 90303
            </a>
          </div>
        </div>

        {/* WhatsApp Direct Banner Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-[#128C7E] rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
              <ShieldCheck size={14} /> Official Support Line
            </div>
            <h3 className="text-xl md:text-2xl font-bold">Have an urgent order or payout query?</h3>
            <p className="text-emerald-100 text-sm max-w-xl">
              Connect directly with our MTWO merchant operations team on WhatsApp. Share screenshots, invoice copies, or order IDs for instant resolution.
            </p>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-emerald-800 shadow-md hover:bg-emerald-50 transition-all transform active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" className="fill-current text-[#25D366]">
              <path d="M12.004 2c-5.523 0-10 4.477-10 10 0 1.767.458 3.427 1.258 4.873L2 22l5.282-1.229C8.68 21.523 10.292 22 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.286c-1.503 0-2.928-.415-4.153-1.137l-.298-.175-3.086.719.736-2.999-.192-.307C4.246 15.11 3.718 13.606 3.718 12c0-4.57 3.716-8.286 8.286-8.286 4.57 0 8.286 3.716 8.286 8.286 0 4.57-3.716 8.286-8.286 8.286zm4.537-6.208c-.248-.124-1.468-.724-1.696-.807-.228-.083-.394-.124-.56.124-.166.248-.642.807-.787.973-.145.166-.29.186-.538.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.236-1.472-1.381-1.72-.145-.248-.016-.382.108-.505.112-.112.248-.29.373-.435.124-.145.166-.248.248-.415.083-.166.041-.31-.021-.435-.062-.124-.56-1.349-.767-1.848-.201-.486-.406-.42-.56-.428l-.477-.008c-.166 0-.435.062-.663.31-.228.248-.871.851-.871 2.075 0 1.224.891 2.407 1.015 2.573.124.166 1.754 2.678 4.249 3.755.594.257 1.057.41 1.419.525.596.19 1.139.163 1.568.099.479-.071 1.468-.6 1.675-1.18.207-.58.207-1.077.145-1.18-.062-.103-.228-.166-.477-.29z" />
            </svg>
            <span>Chat on WhatsApp (+91 85300 90303)</span>
          </a>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-sm text-gray-500 mt-1">Quick answers to common questions raised by sellers</p>
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

      </div>
    </div>
  );
}
