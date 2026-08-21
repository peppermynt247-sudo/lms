import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAllQuestionBanks } from "@utils/api";
import { toast } from "react-toastify";

const SelectQuestionBankModal = ({ open, onClose, onSelect }) => {
  const [questionBanks, setQuestionBanks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestionBanks = async () => {
    setLoading(true);
    try {
      const response = await getAllQuestionBanks();
      setQuestionBanks(response?.data?.data || []);
    } catch (error) {
      toast.error("Failed to fetch question banks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchQuestionBanks();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Question Bank</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-auto">
            {questionBanks.map((qb) => (
              <div
                key={qb.questionBankId || qb.id}
                className="border p-3 rounded hover:bg-muted cursor-pointer flex justify-between items-center"
                onClick={() => {
                  onSelect(qb);
                  onClose();
                }}
              >
                <div>
                  <div className="font-medium text-sm">{qb.name || qb.title}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {qb.questionBankId || qb.id}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Select
                </Button>
              </div>
            ))}
            {questionBanks.length === 0 && (
              <p className="text-muted-foreground text-sm text-center">
                No question banks available.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SelectQuestionBankModal;
