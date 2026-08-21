import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Link as LinkIcon } from "lucide-react";

const QuestionBankActions = ({ onCreate, onLink }) => {
  return (
    <div className="flex gap-4 mb-6">
      <Button variant="outline" onClick={onLink} className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4" />
        Link Existing
      </Button>
      <Button onClick={onCreate} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        New Question Bank
      </Button>
    </div>
  );
};

export default QuestionBankActions;
