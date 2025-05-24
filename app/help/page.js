"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useSession } from "next-auth/react"; // For session management

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, query: message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setSuccess("");
      } else {
        setSuccess("✅ Message sent successfully!");
        setError("");
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to send message.");
      setSuccess("");
    }
  };

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

  if (status === "loading") return <div>Loading...</div>;

  return (
    <>
      <Head>
        <title>Help & Support</title>
        <meta name="description" content="Help and Support Section" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <section className="help-container pt-24 px-4 max-w-screen-xl mx-auto">
        <h2 className="text-4xl font-bold text-blue-800 mb-8 text-center">
          How can we assist you?
        </h2>

        {/* FAQ Section */}
        <div className="faq flex flex-wrap justify-center gap-8 p-4">
          {faqs.map((item, index) => (
            <div
              key={index}
              className="question bg-gray-900 text-white p-6 rounded-xl w-72 text-center shadow-lg transition-all duration-300 ease-in-out transform hover:translate-y-2 hover:shadow-2xl"
            >
              <h3 className="text-yellow-500 text-2xl mb-2">
                {item.question}
              </h3>
              <p className="text-gray-300">{item.answer}</p>
            </div>
          ))}
        </div>

        {/* Contact Us Section */}
        <section className="contact mt-12 p-8 bg-white rounded-xl shadow-lg max-w-lg mx-auto">
          <h2 className="text-3xl font-bold text-center text-blue-800 mb-8">
            Contact Us
          </h2>

          {success && <div className="text-green-500 mb-4">{success}</div>}
          {error && <div className="text-red-500 mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Your Name"
              required
              value={name}
              disabled
              name="name"
              className="w-full p-3 mb-4 border border-gray-300 rounded-md text-lg"
            />
            <input
              type="email"
              placeholder="Your Email"
              required
              value={email}
              disabled
              name="email"
              className="w-full p-3 mb-4 border border-gray-300 rounded-md text-lg"
            />
            <textarea
              placeholder="Your Message"
              rows="4"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded-md text-lg"
            />
            <button
              type="submit"
              className="w-full p-3 bg-blue-800 text-white font-semibold rounded-md hover:bg-blue-900 transition duration-300"
            >
              Send Message
            </button>
          </form>
        </section>
      </section>
    </>
  );
}
