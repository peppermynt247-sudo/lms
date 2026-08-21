"use client";
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BatchesHeader = ({
  title = "Java",
  subtitle = "1 Curriculum Linked",
  linkText = "View List",
  learners = 40,
  startDate = "31 Jan 2025",
  endDate = "13 Apr 2025",
  progress = { current: 1, total: 1, percentage: 100 },
  activeTab = "Learners",
  onTabChange = () => {},
  onBackClick = undefined, // Optional prop
  onActionsClick = () => {},
  courseId // Add courseId prop for specific navigation
}) => {
  const router = useRouter();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick(); // Use custom handler if provided
    } else if (courseId) {
      // Navigate to the batches page for the specific course
      router.push(`/admin/courses/${courseId}/batches`);
    } else {
      router.back(); // Fallback to browser history
    }
  };

  const tabs = [
    "Learners",
    "Sessions",
    "Attendance Report",
    "Content Progress",
    "Assessment Progress"
  ];

  return (
    <div className="bg-white border-b border-borderColor1">
      {/* Header Section */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Title and Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackClick}
              className="p-2 hover:bg-whitegrey1 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-contentColor2" />
            </button>
            
            <div>
              <h1 className="text-size-32 font-semibold text-headingColor">{title}</h1>
              <div className="flex items-center text-sm text-contentColor">
                <span>{learners} {subtitle}</span>
                <button className="ml-2 text-blue hover:text-blue/80 font-medium flex items-center transition-colors duration-200">
                  {linkText}
                  <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Actions Button */}
          <button
            onClick={onActionsClick}
            className="flex items-center px-4 py-2 bg-blue text-white rounded hover:bg-blue/90 transition-colors duration-200 font-medium"
          >
            Actions
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-4 gap-8 mt-8 px-10">
          <div>
            <p className="text-sm text-contentColor2 mb-1">Learners Enrolled</p>
            <p className="text-lg font-semibold text-headingColor">{learners}</p>
          </div>
          
          <div>
            <p className="text-sm text-contentColor2 mb-1">Start date</p>
            <p className="text-lg font-semibold text-headingColor">{startDate}</p>
          </div>
          
          <div>
            <p className="text-sm text-contentColor2 mb-1">End date</p>
            <p className="text-lg font-semibold text-headingColor">{endDate}</p>
          </div>
          
          <div>
            <p className="text-sm text-contentColor2 mb-1">Class Progress</p>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-headingColor">
                {progress.current}/{progress.total}
              </span>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-green-600">
                  {progress.percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-10 mt-4">
        <nav className="flex border-b border-borderColor">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab
                  ? 'border-blue text-blue '
                  : 'border-transparent text-contentColor2 hover:border-blue-light hover:text-blue'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default BatchesHeader;