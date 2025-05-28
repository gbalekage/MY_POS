import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "@/context/UserContext";
import { Loader } from "lucide-react";

const DeleteItem = ({ isOpen, onClose, onSuccess, selectedItem }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configuré");
      await axios.delete(`${serverUrl}/api/items/${selectedItem._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Item supprimé avec succès !");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Erreur lors de la suppression de l'item."
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le produit</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le produit{" "}
            <b>{selectedItem?.name}</b> ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-red-500 hover:bg-red-600"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteItem;
