// Admin sidebar configuration
export const adminSidebarConfig = {
  title: "Admin Portal",
  logo: "⚙️",
  width: "w-64",
  collapsedWidth: "w-16",
  theme: "light",
  sections: [
    {
      id: "main",
      title: "Main",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          href: "/admin",
          icon: "📊"
        },
        {
          id: "overview",
          label: "System Overview",
          href: "/admin/overview",
          icon: "🖥️"
        }
      ]
    },
    {
      id: "user-management",
      title: "User Management",
      items: [
        {
          id: "users",
          label: "Users",
          href: "/admin/users",
          icon: "👥",
          children: [
            {
              id: "students",
              label: "Students",
              href: "/admin/users/students",
              icon: "🎓"
            },
            {
              id: "instructors",
              label: "Instructors",
              href: "/admin/users/instructors",
              icon: "👨‍🏫"
            },
            {
              id: "admins",
              label: "Administrators",
              href: "/admin/users/admins",
              icon: "👨‍💼"
            }
          ]
        },
        {
          id: "roles",
          label: "Roles & Permissions",
          href: "/admin/roles",
          icon: "🔐"
        }
      ]
    },
    {
      id: "academic",
      title: "Academic Management",
      items: [
        {
          id: "courses",
          label: "Courses",
          href: "/admin/courses",
          icon: "📚",
          children: [
            {
              id: "all-courses",
              label: "All Courses",
              href: "/admin/courses/all",
              icon: "📖"
            },
            {
              id: "course-categories",
              label: "Categories",
              href: "/admin/courses/categories",
              icon: "🏷️"
            }
          ]
        },
        {
          id: "departments",
          label: "Departments",
          href: "/admin/departments",
          icon: "🏢"
        },
        {
          id: "academic-calendar",
          label: "Academic Calendar",
          href: "/admin/calendar",
          icon: "📅"
        }
      ]
    },
    {
      id: "system",
      title: "System",
      items: [
        {
          id: "settings",
          label: "System Settings",
          href: "/admin/settings",
          icon: "⚙️"
        },
        {
          id: "reports",
          label: "Reports",
          href: "/admin/reports",
          icon: "📊"
        },
        {
          id: "logs",
          label: "System Logs",
          href: "/admin/logs",
          icon: "📋"
        },
        {
          id: "backup",
          label: "Backup & Recovery",
          href: "/admin/backup",
          icon: "💾"
        }
      ]
    },
    {
      id: "communication",
      title: "Communication",
      items: [
        {
          id: "notifications",
          label: "Notifications",
          href: "/admin/notifications",
          icon: "🔔",
          badge: "3"
        },
        {
          id: "announcements",
          label: "System Announcements",
          href: "/admin/announcements",
          icon: "📢"
        }
      ]
    }
  ]
};
