"use client";

import { useParams } from "next/navigation";
import { FaWhatsapp, FaFacebookF } from "react-icons/fa";
import { toast } from "react-toastify";
import { Copy, Gift, Users, Wallet2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { referralService } from "@/services/referralService";
import Cookies from "js-cookie";

export default function ReferEarn() {
  const { lang } = useParams();
  const [referralCode, setReferralCode] = useState("");
  const [wallet, setWallet] = useState(0);
  const [referreds, setReferreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReferralData = async () => {
      const storedUserId = localStorage.getItem("userId"); // ✅ dynamic userId from localStorage
      if (!storedUserId) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await referralService.getReferralData(storedUserId);
        if (response.success && response.Data) {
          setReferralCode(response.Data.code || "");
          setWallet(response.Data.wallet || 0);
          setReferreds(response.Data.referreds || []);
          setError("");
        } else {
          setError("Invalid response from server");
        }
      } catch (err) {
        setError("Failed to fetch referral info.");
        setReferralCode("");
        setWallet(0);
        setReferreds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralData();
  }, []);

  const handleCopy = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied!");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check this out!",
          text: "This is something interesting I found.",
          url: window.location.href,
        });
        console.log("Shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Sharing is not supported in this browser.");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <h1 className="text-3xl font-bold text-secondary text-center mb-2">
        Refer & Earn Credits
      </h1>
      <div className="flex justify-center mb-6">
        <span className="block w-20 h-1 rounded-full bg-primary shadow-md"></span>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-8">
          <p className="mt-2 text-content text-base">
            Invite your friends and earn for every successful referral!{" "}
            <a
              href="https://atoms.abc.courses/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-orange transition-colors"
            >
              T&C Apply
            </a>
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
            <p className="mt-2 text-content">Loading referral data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-error mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left: Refer Block */}
            <div className="md:col-span-2 space-y-8">
              {/* Code */}
              <div className="bg-body-bg-1 rounded-xl p-6 text-center border border shadow-sm">
                <p className="text-sm text-light-grey mb-2">Your referral code</p>
                <div className="inline-block bg-primary/10 text-secondary font-mono text-xl px-6 py-3 rounded-xl tracking-wider font-bold shadow-inner border border-primary/20">
                  {referralCode || "-"}
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary text-white hover:bg-secondary/90 transition-colors text-sm font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!referralCode}
                  >
                    <Copy size={16} />
                    Copy Code
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="bg-body-bg-1 rounded-xl p-6 text-center border border shadow-sm">
                <p className="text-content font-semibold text-lg mb-4">Share via</p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <a
                    href={`https://wa.me/?text=Use my referral code ${referralCode} to sign up at ABC Learning!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green text-white px-4 py-2 rounded-full hover:bg-green/90 transition-colors text-sm font-medium shadow-sm"
                  >
                    <FaWhatsapp size={18} />
                    WhatsApp
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=https://abc-learning.com/signup?ref=${referralCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-info text-white px-4 py-2 rounded-full hover:bg-info/90 transition-colors text-sm font-medium shadow-sm"
                  >
                    <FaFacebookF size={18} />
                    Facebook
                  </a>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-neutral text-white px-4 py-2 rounded-full hover:bg-neutral/90 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!referralCode}
                  >
                    <Share2 size={18} />
                    Share
                  </button>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-body-bg-1 rounded-xl p-6 border border shadow-sm">
                <h3 className="text-xl font-semibold text-secondary text-center mb-6">
                  How It Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center justify-center bg-indigo/10 rounded-xl p-6 text-center shadow-sm hover:shadow-md hover:bg-indigo/20 transition-all duration-200 border border-indigo/20">
                    <Users className="text-indigo mb-3" size={28} />
                    <p className="font-semibold text-base text-secondary">
                      Invite Friends
                    </p>
                    <p className="text-sm text-content mt-1">
                      Ask them to join with your code
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-pink-50 rounded-xl p-6 text-center shadow-sm hover:shadow-md hover:bg-pink-100 transition-all duration-200 border border-pink-200">
                    <Gift className="text-pink-600 mb-3" size={28} />
                    <p className="font-semibold text-base text-secondary">
                      Earn ₹500
                    </p>
                    <p className="text-sm text-content mt-1">
                      Once they buy their first course
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-yellow/10 rounded-xl p-6 text-center shadow-sm hover:shadow-md hover:bg-yellow/20 transition-all duration-200 border border-yellow/20">
                    <Wallet2 className="text-yellow mb-3" size={28} />
                    <p className="font-semibold text-base text-secondary">
                      Use Credits
                    </p>
                    <p className="text-sm text-content mt-1">
                      Redeem for course fees
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Wallet & Referrals */}
            <div className="bg-body-bg-1 rounded-xl shadow-md p-6 flex flex-col items-center text-center border border">
              <Wallet2 className="text-secondary mb-4" size={40} />
              <h3 className="text-2xl font-bold text-secondary">My Wallet</h3>
              <p className="mt-2 text-4xl font-extrabold text-primary">₹{wallet}</p>
              <p className="text-sm text-content mt-1">Available Credits</p>

              {referreds?.length > 0 ? (
                <div className="mt-8 w-full border-t border pt-6">
                  <h3 className="text-lg font-semibold text-secondary mb-4">
                    My Referrals ({referreds.length})
                  </h3>
                  <ul className="divide-y divide-border text-left w-full">
                    {referreds.map((ref, idx) => (
                      <li key={idx} className="py-3 flex justify-between items-center">
                        <span className="font-medium text-content-2">{ref.name}</span>
                        <span className="text-xs text-light-grey">
                          Enrolled:{" "}
                          {ref.enrolled
                            ? new Date(ref.enrolled).toLocaleDateString()
                            : "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-8 text-center text-light-grey">
                  <Users className="w-12 h-12 mx-auto text-light-grey/50 mb-3" />
                  <p>No referrals yet. Start inviting!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
