'use client';

import { useRouter, useParams } from 'next/navigation';
import { ClipboardList, Plus } from 'lucide-react';

export default function TestsPage() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params.id;

  const handleAddTest = () => {
    router.push(`/admin/curriculum/${curriculumId}/tests/create-test`);
  };

  return (
    <div className="">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tests</h1>
          <p className="text-gray-600">Manage tests and assessments for this curriculum</p>
        </div> */}

        {/* No Tests State */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 mt-8">
          <div className="text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-24 bg-blue-50 rounded-lg relative">
                <ClipboardList className="w-12 h-12 text-blue-300" />
                {/* Pencil Icon */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-300 rounded-sm"></div>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              No Tests
            </h2>

            {/* Description */}
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              No additional tests or assessments outside the curriculum have been uploaded yet
            </p>

            {/* Add Test Button */}
            <button
              onClick={handleAddTest}
              className="inline-flex items-center px-6 py-3 bg-blue text-white font-medium rounded hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}