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

const DeleteClient = ({ isOpen, onClose, onSuccess, selectedUser }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      await axios.delete(`${serverUrl}/api/customers/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Client supprimé avec succès !");
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la suppression du client."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le client</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le client{" "}
            <b>{selectedUser?.fullName}</b> ? Cette action est irréversible.
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
            className="bg-red-500 hover:bg-red-600 flex items-center gap-2"
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

export default DeleteClient;
