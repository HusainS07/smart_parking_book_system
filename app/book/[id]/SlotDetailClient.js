"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function SlotDetailClient({ slot, initialWallet, session }) {
  const router = useRouter();
  const [wallet, setWallet] = useState(initialWallet);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [bookedHours, setBookedHours] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "", visible: false });
  const [currentHourState, setCurrentHourState] = useState(() => {
    return parseInt(
      new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      })
    );
  });

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);

  const showToast = (message, type = "error") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: "", type: "", visible: false }), 3000);
  };

  // Fetch slot availability for the selected date
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/slots/${slot._id}/availability?date=${selectedDate}`);
      setBookedHours(res.data.bookedHours || []);
    } catch (err) {
      console.error("Failed to fetch availability:", err);
      showToast("Failed to load availability for this date.");
    } finally {
      setLoading(false);
    }
  }, [slot._id, selectedDate]);

  useEffect(() => {
    fetchAvailability();
    // Update current hour in Kolkata timezone
    setCurrentHourState(
      parseInt(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          hour12: false,
        })
      )
    );
  }, [selectedDate, fetchAvailability]);

  const handleWalletBooking = async () => {
    if (selectedHour === null) {
      showToast("Please select an hour");
      return;
    }

    if (!session?.user) {
      showToast("Please log in");
      return;
    }

    if (wallet < slot.amount) {
      showToast("Insufficient wallet balance");
      return;
    }

    try {
      setPaymentLoading(true);
      const res = await axios.post(
        "/api/wallet/deduct",
        { amount: slot.amount },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );

      await axios.post(
        "/api/slots/book",
        {
          slotid: slot.slotid,
          hour: selectedHour,
          date: selectedDate,
          email: session.user.email,
          location: slot.location,
        },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );

      setWallet(res.data.newBalance);
      setBookedHours((prev) => [...prev, selectedHour]);
      showToast(
        `✅ Booked slot ${slot.slotid} at ${selectedHour}:00–${selectedHour + 1}:00.`,
        "success"
      );
      setSelectedHour(null);
    } catch (err) {
      showToast(`Booking failed: ${err.response?.data?.error || "Unknown error"}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleUPIBooking = async () => {
    if (selectedHour === null) {
      showToast("Please select an hour");
      return;
    }

    if (!session?.user) {
      showToast("Please log in");
      return;
    }

    if (paymentLoading) return;
    setPaymentLoading(true);

    let orderId = null;
    let razorpayInstance = null;

    try {
      const orderResponse = await axios.post(
        "/api/payments/create-order",
        {
          slotid: slot.slotid,
          amount: slot.amount,
          date: selectedDate,
          hour: selectedHour,
        },
        { headers: { "Content-Type": "application/json" }, withCredentials: true }
      );

      const { orderId: createdOrderId, amount, currency } = orderResponse.data;
      orderId = createdOrderId;

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount,
          currency: currency,
          order_id: orderId,
          name: "Parking Slot Booking",
          description: `Slot ${slot.slotid} at ${selectedHour}:00 on ${selectedDate}`,
          image: "/logo.png",
          handler: async (response) => {
            try {
              await axios.post(
                "/api/slots/book",
                {
                  slotid: slot.slotid,
                  hour: selectedHour,
                  date: selectedDate,
                  payment_id: response.razorpay_payment_id,
                  email: session.user.email,
                  location: slot.location,
                },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
              );

              setBookedHours((prev) => [...prev, selectedHour]);
              showToast(`✅ Booked slot ${slot.slotid} at ${selectedHour}:00 on ${selectedDate}`, "success");
              setSelectedHour(null);
            } catch (err) {
              showToast(`Booking failed: ${err.response?.data?.error || "Unknown error"}`);
            } finally {
              setPaymentLoading(false);
            }
          },
          modal: {
            ondismiss: async () => {
              try {
                await axios.post(
                  "/api/payments/cancel-order",
                  { slotid: slot.slotid, date: selectedDate, hour: selectedHour },
                  { headers: { "Content-Type": "application/json" }, withCredentials: true }
                );
              } catch (cleanupErr) {}
              showToast("Payment cancelled", "info");
              setPaymentLoading(false);
            },
          },
          prefill: {
            email: session.user.email,
            contact: session.user.phone || "",
            method: "netbanking",
            bank: "HDFCB",
          },
          theme: { color: "#4F46E5" },
        };

        razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on("payment.failed", async (response) => {
          try {
            await axios.post(
              "/api/payments/cancel-order",
              { slotid: slot.slotid, date: selectedDate, hour: selectedHour },
              { headers: { "Content-Type": "application/json" }, withCredentials: true }
            );
          } catch (cleanupErr) {}
          showToast(`Payment failed: ${response.error.description || "Payment issue"}`);
          setPaymentLoading(false);
        });

        razorpayInstance.open();
      };

      script.onerror = () => {
        showToast("Failed to load Razorpay SDK");
        setPaymentLoading(false);
      };
    } catch (err) {
      if (orderId) {
        try {
          await axios.post(
            "/api/payments/cancel-order",
            { slotid: slot.slotid, date: selectedDate, hour: selectedHour },
            { headers: { "Content-Type": "application/json" }, withCredentials: true }
          );
        } catch (cleanupErr) {}
      }
      showToast(`UPI payment failed: ${err.response?.data?.error || "Unknown error"}`);
      setPaymentLoading(false);
    }
  };

  const getHourStatus = (hour) => {
    const isToday =
      selectedDate ===
      new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).split("/").reverse().join("-");
      
    if (bookedHours.includes(hour)) return "booked";
    if (selectedDate === new Date().toISOString().split("T")[0] && hour < currentHourState) return "expired";
    return "available";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-sm font-semibold animate-bounce ${
            toast.type === "success"
              ? "bg-green-600"
              : toast.type === "info"
              ? "bg-blue-600"
              : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Navigation & Title */}
      <button
        onClick={() => router.push(`/book?location=${slot.location}`)}
        className="mb-6 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium transition-all"
      >
        ← Back to Slots
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Slot Metadata Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 flex flex-col justify-between">
          <div>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full uppercase">
              {slot.location}
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">Slot {slot.slotid}</h1>
            <p className="text-2xl font-bold text-green-600 mt-3">₹{slot.amount}/hr</p>

            <div className="mt-6 space-y-4 border-t border-gray-100 pt-4 text-gray-700 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Parking Lot</p>
                <p className="font-semibold text-gray-800">{slot.lotId?.lotName || "Main Lot"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Address</p>
                <p className="font-semibold text-gray-800">{slot.lotId?.address || "Street Road"}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-xs text-indigo-500 uppercase font-bold">Wallet Balance</p>
            <p className="text-xl font-bold text-indigo-900">₹{wallet}</p>
          </div>
        </div>

        {/* Hour Grid and Checkout Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-800">Select Date & Time</h2>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedHour(null);
                }}
                className="border border-gray-200 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
              </div>
            ) : (
              <div>
                {/* Visual indicator legend */}
                <div className="flex gap-4 mb-4 text-xs font-semibold text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-gray-100 border border-gray-200 rounded-md"></span>
                    Available
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-indigo-600 rounded-md"></span>
                    Selected
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-red-100 text-red-800 rounded-md border border-red-200"></span>
                    Booked
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-gray-200 text-gray-400 rounded-md border border-gray-300"></span>
                    Expired
                  </div>
                </div>

                {/* 24-hour Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {hourOptions.map((h) => {
                    const status = getHourStatus(h);
                    const isSelected = selectedHour === h;
                    
                    let btnClass = "bg-white hover:bg-indigo-50 text-gray-800 border border-gray-200";
                    let isDisabled = false;

                    if (status === "booked") {
                      btnClass = "bg-red-100 text-red-600 border border-red-200 cursor-not-allowed";
                      isDisabled = true;
                    } else if (status === "expired") {
                      btnClass = "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed";
                      isDisabled = true;
                    } else if (isSelected) {
                      btnClass = "bg-indigo-600 text-white border border-indigo-700 shadow-md";
                    }

                    return (
                      <button
                        key={h}
                        disabled={isDisabled}
                        onClick={() => setSelectedHour(isSelected ? null : h)}
                        className={`py-3 px-2 rounded-xl text-center text-sm font-semibold transition-all duration-150 flex flex-col items-center justify-center gap-0.5 ${btnClass}`}
                      >
                        <span>{`${String(h).padStart(2, "0")}:00`}</span>
                        <span className="text-[10px] opacity-75">{`${String(h + 1).padStart(2, "0")}:00`}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary & Buttons */}
          {selectedHour !== null && (
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl shadow-xl p-6 text-white border border-indigo-950 animate-fade-in">
              <h3 className="text-lg font-bold">Booking Details</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm opacity-90">
                <div>
                  <p className="text-xs opacity-60 uppercase font-bold">Selected Time</p>
                  <p className="font-semibold text-lg">{`${selectedHour}:00 – ${selectedHour + 1}:00`}</p>
                </div>
                <div>
                  <p className="text-xs opacity-60 uppercase font-bold">Booking Date</p>
                  <p className="font-semibold text-lg">{selectedDate}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-4 border-t border-indigo-700/50">
                <button
                  onClick={handleWalletBooking}
                  disabled={paymentLoading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-150 shadow-md flex items-center justify-center gap-2"
                >
                  Pay ₹{slot.amount} with Wallet
                </button>
                <button
                  onClick={handleUPIBooking}
                  disabled={paymentLoading}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-150 shadow-md flex items-center justify-center gap-2"
                >
                  {paymentLoading ? "Processing..." : `Pay ₹${slot.amount} Online`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
