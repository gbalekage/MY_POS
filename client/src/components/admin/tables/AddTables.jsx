import React from "react";
import { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import axios from "axios";
import { UserContext } from "@/context/UserContext";

const AddTables = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [userData, setUserData] = useState({
    numberOfTables: "",
  });
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un clients</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const serverUrl = await window.electronAPI.ipcRenderer.invoke(
                "get-server-url"
              );
              if (!serverUrl) throw new Error("Server URL is not configured");
              await axios.post(
                `${serverUrl}/api/tables/add-multiple-tables`,
                { numberOfTables: Number(userData.numberOfTables) },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              toast.success("Client ajouté avec succès !");
              onSuccess?.();
              onClose();
            } catch (error) {
              toast.error(
                error.response?.data?.message ||
                  "Erreur lors de l'ajout du client."
              );
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre de table a creer
              </label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={userData.numberOfTables}
                onChange={(e) =>
                  setUserData({ ...userData, numberOfTables: e.target.value })
                }
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Ajouter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTables;
