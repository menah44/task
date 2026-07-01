import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="bg-[#161b22] border border-[#30363d] text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">{title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="bg-[#161b22] border-t border-[#30363d] pt-4 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-[#30363d] text-gray-300 hover:text-white hover:bg-[#30363d]"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-primary hover:bg-primary/80 text-white font-medium"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
