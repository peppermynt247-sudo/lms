import VideoPlayer from './VideoPlayer';
import { X } from 'lucide-react';

const MaterialPreviewCard = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-0 max-w-3xl w-full mx-4 relative animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-2 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 truncate max-w-[80%]">{data.title || 'Video Preview'}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Video Player */}
        <div className="flex flex-col items-center justify-center px-6 py-8">
          {data.type === 'video' && data.id && (
            <div className="w-full flex justify-center">
              <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-black" style={{ width: '100%', maxWidth: 720 }}>
                <VideoPlayer contentId={data.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialPreviewCard;