"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/images/ABClogo.png";
import { toast } from "react-toastify";
import {
  LogOut,
  Menu,
  ChevronDown,
  LayoutDashboard,
  BookOpen,
  Users,
  ShoppingCart,
  Settings,
  Award,
  MessageSquare,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";
import Cookies from "js-cookie";

const navSections = [
  {
    id: "main",
    title: "Main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin/dashboard",
      },
    ],
  },
  {
    id: "academic",
    title: "Academic",
    items: [
      {
        id: "course-delivery",
        label: "Course Delivery",
        icon: BookOpen,
        children: [
          { id: "courses", label: "Courses", href: "/admin/courses" },
          { id: "bundles", label: "Bundles", href: "/admin/bundle" },
          { id: "batches", label: "Batches", href: "/admin/batches" },
          { id: "curriculum", label: "Curriculum", href: "/admin/curriculum" },
          {
            id: "question-bank",
            label: "Question Bank",
            href: "/admin/question-bank",
          },
          {
            id: "live-sessions",
            label: "Live Sessions",
            href: "/admin/sessions",
          },
        ],
      },
      {
        id: "users",
        label: "Users",
        icon: Users,
        children: [
          { id: "learners", label: "Learners", href: "/admin/users/learners" },
          {
            id: "admins",
            label: "Admins & Instructors",
            href: "/admin/users/admin-instructors",
          },
          {
            id: "enrollment",
            label: "New Enrollment",
            href: "/admin/users/new-enrollment",
          },
        ],
      },
    ],
  },
  {
    id: "business",
    title: "Business",
    items: [
      {
        id: "sales",
        label: "Sales",
        icon: ShoppingCart,
        children: [
          {
            id: "fee-templates",
            label: "Fee Templates",
            href: "/admin/fee-templates",
          },
          { id: "coupons", label: "Coupons", href: "/admin/sales/coupons" },
        ],
      },
      {
        id: "certificates",
        label: "Certificates",
        icon: Award,
        href: "/admin/certificates",
      },
      {
        id: "discussions",
        label: "Discussions",
        icon: MessageSquare,
        href: "/admin/discussions",
      },
    ],
  },
  {
    id: "system",
    title: "System",
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        children: [
          {
            id: "profile",
            label: "Your Profile",
            href: "/admin/settings/profile",
          },
          {
            id: "password",
            label: "Change Password",
            href: "/admin/settings/password",
          },
        ],
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Auto-expand sections that contain the active route
  const getInitialExpanded = () => {
    const expanded = {};
    navSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.some((child) => pathname === child.href)) {
          expanded[item.id] = true;
        }
      });
    });
    return expanded;
  };

  const [expandedItems, setExpandedItems] = useState(getInitialExpanded);

  useEffect(() => {
    const fetchProfileImage = async () => {
      const token = Cookies.get("accessToken");
      if (!token) return;
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/myprofile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const cdnUrl = response.data?.data?.profileImageUrl;
        setProfileImage(cdnUrl || null);
      } catch {
        setProfileImage(null);
      }
    };
    fetchProfileImage();
  }, []);

  const toggleItem = (itemId) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleLogoutConfirm = async () => {
    const token = Cookies.get("accessToken");
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.removeItem("accessToken");
      Cookies.remove("accessToken");
      toast.success("Logged out successfully");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch {
      toast.error("Failed to logout. Please try again.");
    }
    setShowLogoutModal(false);
  };

  const isActive = (href) => pathname === href;
  const isParentActive = (item) =>
    item.children?.some((child) => pathname === child.href) || false;

  const renderItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const expanded = expandedItems[item.id];
    const active = hasChildren ? isParentActive(item) : isActive(item.href);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleItem(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
              active
                ? "bg-[#ff5b00]/15 text-[#ff5b00]"
                : "text-white hover:bg-white/30"
            }`}
          >
            <div className="flex items-center space-x-3">
              {Icon && (
                <Icon
                  size={18}
                  className={active ? "text-[#ff5b00]" : "text-white/80 group-hover:text-white"}
                />
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""} ${
                active ? "text-[#ff5b00]" : "text-white/60 group-hover:text-white"
              }`}
            />
          </button>
          {expanded && (
            <div className="ml-6 mt-1 space-y-1 border-l-2 border-[#ff5b00]/40 pl-3">
              {item.children.map((child) => (
                <Link
                  key={child.id}
                  href={child.href}
                  onClick={() => setMobileOpen(false)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(child.href)
                      ? "bg-[#ff5b00] text-white shadow-lg"
                      : "text-white hover:bg-white/30"
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
          active
            ? "bg-[#ff5b00] text-white shadow-lg"
            : "text-white hover:bg-white/30"
        }`}
      >
        {Icon && (
          <Icon
            size={18}
            className={active ? "text-white" : "text-white/80 group-hover:text-white"}
          />
        )}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-[#ff5b00] text-white p-2 rounded-full shadow-lg"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[#1a2b4e] text-white w-64 flex flex-col flex-shrink-0 rounded-tr-2xl rounded-br-2xl shadow-2xl border-r border-white/20 fixed md:static top-0 left-0 h-screen z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-6 flex justify-center items-center">
          <Image
            src={logo}
            alt="ABC Logo"
            placeholder="blur"
            className="brightness-110 h-auto w-auto max-h-14"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 sidebar-scrollbar">
          {navSections.map((section) => (
            <div key={section.id} className="mb-6">
              {section.title && (
                <h3 className="px-3 text-xs font-semibold uppercase tracking-wide text-white/70 mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => renderItem(item))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="mt-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3 min-w-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover shadow-lg flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-[#ff5b00] to-orange-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {loading ? "Loading..." : user?.name || "Admin"}
                </p>
                <p className="text-xs text-white/70 font-medium truncate">
                  {loading ? "" : user?.roles || "Administrator"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 text-white/70 hover:text-white hover:bg-[#ff5b00] rounded-xl transition-all duration-200 flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Logout
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-4 py-2 text-white bg-[#ff5b00] hover:bg-[#e55400] rounded-lg transition-colors font-medium text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
