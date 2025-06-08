"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function Help() {
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  if (status === "loading") return <div>Loading...</div>;

  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-blue-800 mb-12 text-center">
        How can we assist you?
      </h1>

      {/* FAQ section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {faqs.map(({ question, answer }, i) => (
          <div
            key={i}
            className="bg-gray-900 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
          >
            <h3 className="text-yellow-400 text-2xl font-semibold mb-3">{question}</h3>
            <p className="text-gray-300">{answer}</p>
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-blue-800 mb-6">
          Ask a Question
        </h2>

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            disabled
            className="w-full p-3 mb-4 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
            placeholder="Your Name"
          />
          <input
            type="email"
            value={email}
            disabled
            className="w-full p-3 mb-4 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
            placeholder="Your Email"
          />
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question here..."
            className="w-full p-3 mb-6 border border-gray-300 rounded-md resize-none focus:outline-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-800 text-white py-3 rounded-md font-semibold hover:bg-blue-900 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  );
}
