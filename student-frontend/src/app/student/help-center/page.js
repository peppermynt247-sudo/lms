"use client";

import React from "react";
import { FaFacebookF, FaLinkedinIn, FaInstagram, FaYoutube, FaTwitter, FaTwitterSquare } from "react-icons/fa";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import appstore from "@/assets/appStore.svg";
import googleplay from "@/assets/playStore.svg";
import Image from "next/image";
import helpCenterService from "@/services/helpCenter";
import { toast } from "react-toastify";

export default function HelpCenter() {
    const router = useRouter();
    const [message, setMessage] = React.useState("");

    const handleSend = async (message) => {
          if (!message.trim()) 
            return; 

          const emailData = {
            email: "vinanth_b@abc.courses",
            context: message
          };

          try {
            await helpCenterService.sendEmail(emailData);
            setMessage("");
            toast.success("Your message has been sent!");
          } catch (err) {
            toast.error("Something went wrong. Please try again.");
          }
        };


  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-center text-secondary mb-2">Support Centre</h1>
        <div className="flex justify-center mb-6">
          <span className="block w-24 h-1 rounded-full bg-orange shadow-md"></span>
        </div>
        <p className="text-sm mt-1 text-gray-500 text-center">
          Need help? Reach out to us at{" "}
          <a href="mailto:techsupport@abc.courses" className="text-blue-600 underline">
            techsupport@abc.courses
          </a>
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-2">Drop us a message</h2>
          <p className="text-sm text-gray-500 mb-4">
            Our team is here to assist you. Feel free to share your queries or feedback.
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Feel free to write, our team will get back to you shortly"
            className="mb-4"
          />
          <Button
            className="bg-orange hover:bg-orange w-full text-white font-semibold"
            onClick={() => handleSend(message)}
          >
            Send Message
          </Button>

        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md border">
            <h2 className="text-lg font-semibold mb-2">Need Assistance?</h2>
            <p className="text-sm text-gray-500 mb-4">
              You can also contact us via email at{" "}
              <a href="mailto:techsupport@abc.courses" className="text-blue-600 underline">
                techsupport@abc.courses
              </a>
            </p>
            <Button variant="outline" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Mail Us
            </Button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-semibold mb-2">
              Join ABC on your favorite platform
            </h2>
            <p className="text-sm text-gray-500 mb-4">Stay connected - follow us!</p>
            <div className="flex gap-4">
            <a href="https://www.facebook.com/abcfortechnologytraining/" className="text-blue-600 hover:opacity-80">
                <FaFacebookF size={22} />
            </a>
            <a href="https://in.linkedin.com/school/abc-for-technology-training/" className="text-blue-700 hover:opacity-80">
                <FaLinkedinIn size={24} />
            </a>
            <a href="https://www.instagram.com/abcfortechnologytraining/?hl=en" className="text-pink-500 hover:opacity-80">
                <FaInstagram size={24} />
            </a>
            <a href="https://www.youtube.com/@ABCforTechnologyTraining/" className="text-red-600 hover:opacity-80">
                <FaYoutube size={24} />
            </a>
            <a href="https://x.com/abcfortech?lang=en" className="text-red-600 hover:opacity-80">
                <FaTwitterSquare size={24} />
            </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border flex flex-col md:flex-col justify-between items-center">
        <h2 className="text-lg font-semibold mb-2 md:mb-0">Get the Mobile app</h2>
        <p className="text-sm text-gray-500 ">
          Available on your preferred app store.
        </p>
        <div className="flex gap-4">
          <a href="https://apps.apple.com/in/app/abc-atmos/id6740924790" className="text-blue-600 hover:opacity-80">
                <Image src={appstore} alt="App Store" width={140} height={40} />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.edmingle.abc&pcampaignid=web_share" className="text-blue-600 hover:opacity-80">
                <Image src={googleplay} alt="Google Play" width={140} height={40} />
            </a>
        </div>
      </div>
    </div>
  );
}
