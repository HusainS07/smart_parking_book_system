"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function Help() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (session) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  const faqs = [
    {
      question: "What is the Smart Parking System?",
      answer:
        "Our Smart Parking System helps manage and optimize parking spaces efficiently using real-time tracking and automation.",
    },
    {
      question: "How do I reserve a parking spot?",
      answer:
        "You can reserve a spot through our website or mobile app. Simply sign in, select a location, and choose an available slot.",
    },
    {
      question: "Is online payment available?",
      answer:
        "Yes! We offer secure online payment gateways so you can pay easily using UPI, cards, or wallets.",
    },
    {
      question: "Can I cancel a booking?",
      answer:
        "Absolutely. Go to your bookings section and click cancel. Refund policies apply based on time of cancellation.",
    },
    {
      question: "Is the system available in multiple cities?",
      answer:
        "Currently, we operate in selected cities. We're expanding rapidly and will be in your city soon!",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write a message before submitting.");
      setSuccess("");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, query: message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSuccess("");
      } else {
        setSuccess(data.answer);
        setError("");
        setMessage("");
      }
    } catch (err) {
      setError("Failed to send message.");
      setSuccess("");
    }
  };

  const toggleFAQ = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  if (status === "loading") return <div className="text-center py-20">Loading...</div>;

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-blue-800 mb-12 text-center">
        How can we assist you?
      </h1>

      {/* FAQ Accordion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {faqs.map(({ question, answer }, i) => (
          <div key={i} className="bg-white shadow rounded-lg overflow-hidden">
            <button
              onClick={() => toggleFAQ(i)}
              className="w-full text-left p-5 text-lg font-semibold flex justify-between items-center text-blue-700 hover:bg-blue-50 transition"
            >
              {question}
              <span>{expandedIndex === i ? "−" : "+"}</span>
            </button>
            <AnimatePresence>
              {expandedIndex === i && (
                <motion.div
                  className="px-5 pb-5 text-gray-700"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p>{answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-blue-800 mb-6">
          Ask a Question
        </h2>

        {success && (
          <div className="mb-4 p-3 rounded text-green-700 bg-green-100 border border-green-400">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded text-red-700 bg-red-100 border border-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            disabled
            className="w-full mb-4 p-3 border rounded bg-gray-100 text-gray-600"
            placeholder="Your Name"
          />
          <input
            type="email"
            value={email}
            disabled
            className="w-full mb-4 p-3 border rounded bg-gray-100 text-gray-600"
            placeholder="Your Email"
          />
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question here..."
            className="w-full p-3 mb-6 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded font-semibold transition"
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  );
}
