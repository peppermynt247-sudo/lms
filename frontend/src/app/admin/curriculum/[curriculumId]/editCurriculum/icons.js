import { FileText, Video, CheckSquare } from "lucide-react";

export function getItemIcon(type) {
  switch (type) {
    case "video":
      return <Video className="w-4 h-4 text-blue-500" />;
    case "document":
      return <FileText className="w-4 h-4 text-green-500" />;
    case "quiz":
      return <CheckSquare className="w-4 h-4 text-purple-500" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500" />;
  }
}


