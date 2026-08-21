const SectionPreviewCard = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Preview Section: {data.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-gray-700">This is a preview of the section '{data.title}'.</p>
          <p className="text-sm text-gray-600">Total Materials: {data.materials}</p>
          <p className="text-sm text-gray-600">Duration: {data.duration}</p>
          {/* You can add more detailed preview content here, e.g., a list of materials */}
          <h4 className="font-medium mt-4">Materials:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {data.items && data.items.map(item => (
              <li key={item.id}>{item.title} ({item.type})</li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Close</button>
        </div>
      </div>
    </div>
  );
};

export default SectionPreviewCard;