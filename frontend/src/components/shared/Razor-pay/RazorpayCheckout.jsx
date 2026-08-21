"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "@utils/api";

export default function RazorpayCheckout() {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
   const installmentId = 18;
    const planId = 4;
    const userId = 3; 
    const courseId = 3; 
    const bundleId = 3;


  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setIsScriptLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error("Failed to load Razorpay script");
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  const handlePay = async () => {
    if (!isScriptLoaded) {
      alert("Payment system is still loading. Please wait...");
      return;
    }

    setIsLoading(true);
    
   
    try {
      const response = await api.post("/api/payment/createorder", {
        userId,
        amount: 1,
        currency: "INR",
      courseId,
       planId,
        installmentId
      });


      const paymentData = response.data.Data;

      if (!paymentData || !paymentData.orderId) {
        alert("Failed to create payment order - invalid response");
        return;
      }

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount * 100,
        currency: paymentData.currency,
        name: "Your Platform",
        description: `${paymentData.itemName} - ${paymentData.planName}`,
        order_id: paymentData.orderId,
        handler: function (response) {
        
          alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
          verifyPayment(response, paymentData.paymentId); // ✅ Call backend verification
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9000000000",
        },
        notes: {
          payment_id: paymentData.paymentId,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal closed");
            setIsLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment initialization error:", error);
      alert("Something went wrong. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Verify payment with backend
  const verifyPayment = async (razorpayResponse, internalPaymentId) => {
    try {


      const response = await api.post("/api/payment/verifypayment", {
        orderId: razorpayResponse.razorpay_order_id,
        paymentId: razorpayResponse.razorpay_payment_id,
        signature: razorpayResponse.razorpay_signature,
        internalPaymentId: internalPaymentId,
      });

      if (response.data.success) {
        alert("🎉 Payment verified successfully!");
      } else {
        alert("❌ Verification failed: " + response.data.message);
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("Verification failed. Check console.");
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={!isScriptLoaded || isLoading}
      className={`px-4 py-2 rounded text-white ${
        !isScriptLoaded || isLoading
          ? "bg-blue cursor-not-allowed"
          : "bg-blue hover:bg-blue-700"
      }`}
    >
      {isLoading ? "Processing..." : !isScriptLoaded ? "Loading..." : "Pay ₹1 for Course"}
    </button>
  );
}
