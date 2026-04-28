"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What documents are required to register as a vendor?",
    answer: "You need a valid GST registration, PAN card, business address proof, and a cancelled cheque for bank account verification. Our team verifies all documents within 24-48 hours.",
  },
  {
    question: "How and when do I receive payments?",
    answer: "Payments are transferred directly to your registered bank account within 7 days of order delivery. You can track all payments through your vendor dashboard and download statements anytime.",
  },
  {
    question: "Is there any registration or monthly fee?",
    answer: "No. Registration is completely free. There are no monthly or annual charges. You only pay a small commission (2-5%) when you successfully sell a product through our platform.",
  },
  {
    question: "Can I set my own prices and MOQ?",
    answer: "Absolutely. You have complete control over your pricing, Minimum Order Quantity (MOQ), and stock availability. You can update these anytime through your product management dashboard.",
  },
  {
    question: "What if a buyer cancels or returns an order?",
    answer: "We have a fair dispute resolution system. If a buyer cancels before dispatch, you don't pay any commission. For returns due to quality issues, we investigate and ensure fair treatment for both parties.",
  },
  {
    question: "How do I get notified about new orders?",
    answer: "You receive instant notifications via SMS, email, and in-app alerts. You can also download our mobile app to manage orders on the go. Our support team also calls for high-value orders.",
  },
];

function FAQItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: { question: string; answer: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, []);

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isOpen
          ? "border-emerald-300 shadow-md ring-1 ring-emerald-100"
          : "border-zinc-200 hover:border-zinc-300"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-200"
      >
        <span
          className={`font-medium pr-4 transition-colors duration-200 ${
            isOpen ? "text-emerald-900" : "text-zinc-900"
          }`}
        >
          {faq.question}
        </span>
        <div
          className={`shrink-0 rounded-full p-1.5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isOpen
              ? "bg-emerald-100 text-emerald-700 rotate-180"
              : "bg-zinc-100 text-zinc-500"
          }`}
        >
          <ChevronDown size={18} />
        </div>
      </button>
      <div
        className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-6 pb-4">
          <p className="text-sm text-zinc-600 leading-relaxed transition-opacity duration-200">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function VendorFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-zinc-50 border-t border-zinc-200">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-zinc-900 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            Everything you need to know about selling on Vitthal
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-zinc-600 mb-3">Still have questions?</p>
          <a
            href="/help"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
