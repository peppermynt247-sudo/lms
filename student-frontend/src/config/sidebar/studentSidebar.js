// Enhanced Student sidebar configuration
import {
  House,
  BookCopy,
  Megaphone,
  GraduationCap,
  ShoppingBag,
  Settings,
  Wallet,
  Info,
  BarChart3,
  MessageSquare,
  Star,
  CodeXml,
  UserRoundPen,
  Video
} from 'lucide-react';

export const studentSidebarConfig = {
  title: "Student Portal",
  logo: "🎓",
  width: "w-64",
  collapsedWidth: "w-16",
  theme: "dark",
  sections: [
    {
      id: "overview",
      title: "Overview",
      items: [
          {
            id: "dashboard",
            label: "Dashboard",
            href: "/student/dashboard",
            icon: <BarChart3 className="w-5 h-5" />,
            badge: null
          },
      ]
    },
    {
      id: "learning",
      title: "Learning",
      items: [
        {
          id: "my-courses",
          label: "My Courses",
          href: "/student/mycourses",
          icon: <BookCopy className="w-5 h-5" />,
          badge: null
        },
        // {
        //   id: "certificates",
        //   label: "Certificates",
        //   href: "/student/certificates",
        //   icon: <GraduationCap className="w-5 h-5" />,
        //   badge: null
        // },
        {
          id: "playground",
          label: "Playground",
          href: "/student/playground",
          icon: <CodeXml className="w-5 h-5" />,
          badge: null
        },
        {
          id: "recordings",
          label: "Recordings",
          href: "/student/recordings",
          icon: <Video className="w-5 h-5" />,
          badge: null
        }
      ]
    },
    {
      id: "community",
      title: "Community",
      items: [
        // {
        //   id: "announcements",
        //   label: "Announcements",
        //   href: "/student/announcements",
        //   icon: <Megaphone className="w-5 h-5" />,
        //   badge:null
        // },
        {
          id: "discussions",
          label: "Discussions",
          href: "/student/discussions",
          icon: <MessageSquare className="w-5 h-5" />,
          badge: null
        }
      ]
    },
    {
      id: "account",
      title: "Account",
      items: [
        {
          id: "profile",
          label: "Profile",
          href: "/student/profile",
          icon: <UserRoundPen className="w-5 h-5" />,
          badge: null
        },
        {
          id: "my-purchases",
          label: "My Purchases",
          href: "/student/my-purchases",
          icon: <ShoppingBag className="w-5 h-5" />,
          badge: null
        },
        // {
        //   id: "refer-n-earn",
        //   label: "Refer & Earn",
        //   href: "/student/refer-n-earn",
        //   icon: <Wallet className="w-5 h-5" />,
        //   badge: null
        // }
      ]
    },
    {
      id: "support",
      title: "Support",
      items: [
        {
          id: "help-center",
          label: "Help Center",
          href: "/student/help-center",
          icon: <Info className="w-5 h-5" />,
          badge: null
        },
        {
          id: "settings",
          label: "Settings",
          href: "/student/settings",
          icon: <Settings className="w-5 h-5" />,
          badge: null
        },
      ]
    }
  ]
};
