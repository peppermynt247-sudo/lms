'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import from next/navigation for App Router
import BatchesHeader from '@/components/sections/admin/courses-delivery/courses/components/BatchesHeader';

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  // Function to extract the batchId from the current pathname
  const getBatchIdFromPath = (path) => {
    // Regex to match /admin/classroom/{batchId}/...
    const match = path.match(/\/admin\/classroom\/(\d+)\//);
    return match ? match[1] : null; // Returns the captured batchId (e.g., '1')
  };

  // Determine activeTab based on the current URL path
  const getActiveTabFromPath = (path) => {
    // If the path includes '/students', the active tab should be 'Learners'
    if (path.includes('/students')) {
      return 'Learners'; 
    }
    if (path.includes('/sessions')) {
      return 'Sessions'; 
    }
    if (path.includes('/attendance-report')) {
      return 'Attendance Report';
    }
    if (path.includes('/grades')) {
      return 'Grades';
    }
    if (path.includes('/announcements')) {
      return 'Announcements';
    }
    // Default to 'Learners' if no specific tab path is matched
    // This is crucial for initial load when path might just be /admin/classroom/1
    return 'Learners'; 
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath(pathname));
  const [batchId, setBatchId] = useState(getBatchIdFromPath(pathname));


  // Update activeTab and batchId when the pathname changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath(pathname));
    setBatchId(getBatchIdFromPath(pathname));
  }, [pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab); // Set the active tab in the state

    // Ensure we have a batchId before constructing the new path
    if (!batchId) {
      console.warn('Batch ID not found in URL. Cannot navigate to tab.');
      return;
    }

    // Construct the new path based on the selected tab and the extracted batchId
    let newPath = '';
    switch (tab) {
      case 'Learners': // If the header passes 'Learners' for the students tab
        newPath = `/admin/classroom/${batchId}/students`; // The actual URL path is /students
        break;
      case 'Sessions':
        newPath = `/admin/classroom/${batchId}/sessions`;
        break;
      case 'Attendance Report':
        newPath = `/admin/classroom/${batchId}/attendance-report`;
        break;
      case 'Grades':
        newPath = `/admin/classroom/${batchId}/grades`;
        break;
      case 'Announcements':
        newPath = `/admin/classroom/${batchId}/announcements`;
        break;
      default:
        newPath = `/admin/classroom/${batchId}/students`; // Fallback to students page
    }
    router.push(newPath);
  };

  const handleBackClick = () => {
    router.back(); // Uses Next.js router.back() for navigation
  };

  const handleActionsClick = () => {
    // Add your actions menu logic here
  };

  return (
    <div className="relative p-6 rounded-xl shadow-md overflow-y-auto min-h-screen">
      <BatchesHeader
        title="Java"
        subtitle="Curriculum Linked"
        linkText="View List"
        learners={40} 
        startDate="31 Jan 2025"
        endDate="13 Apr 2025"
        progress={{ current: 1, total: 1, percentage: 100 }}
        activeTab={activeTab} // This prop controls the visual active state
        onTabChange={handleTabChange}
        onBackClick={handleBackClick}
        onActionsClick={handleActionsClick}
      />
      
      {/* Main Content Area */}
      {/* Render the page content below the header */}
      <div className="py-6 max-w-4xl mx-auto">{children}</div>
    </div>
  );
}