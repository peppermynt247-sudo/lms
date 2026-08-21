// Instructor sidebar configuration
export const instructorSidebarConfig = {
  title: "Instructor Portal",
  logo: "👨‍🏫",
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
          href: "/instructor",
          icon: "📊"
        },
        {
          id: "courses",
          label: "My Courses",
          href: "/instructor/courses",
          icon: "📚",
          children: [
            {
              id: "active-courses",
              label: "Active Courses",
              href: "/instructor/courses/active",
              icon: "🟢"
            },
            {
              id: "archived-courses",
              label: "Archived Courses",
              href: "/instructor/courses/archived",
              icon: "📦"
            }
          ]
        }
      ]
    }
  ]
};
