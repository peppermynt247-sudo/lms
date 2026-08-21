"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from "js-cookie";
import axios from "axios";
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '@/assets/images/ABClogo.png';

const Sidebar = ({ config = {}, currentUser = null, onLogout = null }) => {
  const [profileImage, setProfileImage] = useState(null);
  useEffect(() => {
    // Match StudentProfile logic for fetching profile image
    const fetchProfileImage = async () => {
      const token = Cookies.get("accessToken");
      if (!token) return setProfileImage(null);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL}/api/user/myprofile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const cdnUrl = response.data?.data?.profileImageUrl;
        setProfileImage(cdnUrl || null);
      } catch (error) {
        setProfileImage(null);
      }
    };
    fetchProfileImage();
  }, []);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const [expandedSections, setExpandedSections] = useState({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      dispatch(logout());
      router.push('/login');
    }
  };

  const userName = user?.user?.name || 'User';
  const roleDisplay = user?.roles?.[0] || 'Student';

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    handleLogout();
  };
  const handleLogoutCancel = () => setShowLogoutModal(false);
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  const toggleMobileSidebar = () => setMobileOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLogoutModal && !event.target.closest('.logout-modal')) {
        setShowLogoutModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLogoutModal]);

  const isActiveLink = (href) => pathname === href;

  const renderMenuItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections[item.id];
    const isActive = isActiveLink(item.href || '');
    const paddingLeft = level > 0 ? `pl-${8 + level * 4}` : 'pl-4';

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => toggleSection(item.id)}
            className={`w-full flex items-center justify-between p-3 transition-colors duration-200 text-white hover:bg-primary/20 ${paddingLeft} rounded-lg`}
          >
            <div className="flex items-center space-x-3">
              {item.icon && <span className="text-white">{item.icon}</span>}
              <span className="font-medium">{item.label}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isExpanded && (
            <div className="space-y-1">
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href || '#'}
        onClick={() => setMobileOpen(false)}
        className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${paddingLeft} ${
          isActive
            ? 'bg-primary text-white shadow-md'
            : 'text-white hover:bg-white/30'
        }`}
      >

        {item.icon && (
          <span className={`mr-3 ${isActive ? 'text-white' : 'text-white/80'}`}>
            {item.icon}
          </span>
        )}
        <span className="flex-1 text-left font-medium">{item.label}</span>
        {item.badge && (
          <span className="ml-auto bg-primary text-white text-xs rounded-full px-2 py-1 font-semibold">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-primary text-white p-2 rounded-full shadow-lg"
        onClick={toggleMobileSidebar}
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      <div
        className={`w-64 flex flex-col border-r border-secondary/50 bg-secondary h-full rounded-tr-md rounded-br-md shadow-lg fixed lg:static z-50 transform lg:translate-x-0 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header - Centered Logo */}
        <div className="p-6 border-b border-secondary/50 flex justify-center items-center">
          <Image src={logo} alt="Logo" width={120} height={120} className="brightness-110 h-auto w-auto max-h-16" />
        </div>


        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-1 custom-scrollbar">
          {config.sections?.map((section, index) => (
            <div key={section.id || index} className="mb-6">
              {section.title && (
                <h3 className="px-3 text-xs font-semibold uppercase text-white/70 mb-3 tracking-wide">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items?.map(item => renderMenuItem(item))}
              </div>
            </div>
          ))}
        </div>

        {/* User Menu */}
        <div className="border-t border-secondary/50 mt-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover shadow-lg flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold truncate text-white">{userName}</p>
                <p className="text-xs text-white/70 font-medium">{roleDisplay}</p>
              </div>
            </div>
            <button
              onClick={handleLogoutClick}
              className="p-2 text-white/70 hover:text-primary-400 hover:bg-primary rounded-lg transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="logout-modal bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button
                  onClick={handleLogoutCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  No
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-4 py-2 text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors font-medium"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
