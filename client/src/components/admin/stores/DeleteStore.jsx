import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

const DeleteStore = ({
  isOpen,
  onClose,
  onSuccess,
  selectedStore,
  onDelete,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le magasin</DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          Voulez-vous vraiment supprimer ce magasin ? Cette action est
          irréversible.
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2 justify-center">
                <Loader className="animate-spin size-2" /> <p>En cours...</p>
              </div>
            ) : (
              "Supprimer"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteStore;
