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
import { Loader } from "lucide-react";

const AddUser = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(UserContext);
  const token = user?.token;
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    role: "serveur",
    password: "",
    password2: "",
    isActive: true,
    avatar: "default-image.jpg",
  });
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier les information de l'entreprise</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const serverUrl = await window.electronAPI.ipcRenderer.invoke(
                "get-server-url"
              );
              if (!serverUrl) throw new Error("Server URL is not configured");
              await axios.post(`${serverUrl}/api/users/create-user`, userData, {
                headers: { Authorization: `Bearer ${token}` },
              });
              toast.success("Utilisateur ajouté avec succès !");
              onSuccess?.();
              onClose();
            } catch (error) {
              toast.error(
                error.response?.data?.message ||
                  "Erreur lors de l'ajout de l'utilisateur."
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={userData.username}
                onChange={(e) =>
                  setUserData({ ...userData, username: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Téléphone
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={userData.phone}
                onChange={(e) =>
                  setUserData({ ...userData, phone: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={userData.address}
                onChange={(e) =>
                  setUserData({ ...userData, address: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={userData.password}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirmer le Mot de passe
              </label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                value={userData.password2}
                onChange={(e) =>
                  setUserData({ ...userData, password2: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rôle</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={userData.role}
                onChange={(e) =>
                  setUserData({ ...userData, role: e.target.value })
                }
                required
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="serveur">Serveur</option>
                <option value="caissier">Caissier</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={userData.isActive}
                onChange={(e) =>
                  setUserData({ ...userData, isActive: e.target.checked })
                }
              />
              <label htmlFor="isActive" className="text-sm">
                Actif
              </label>
            </div>
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <Loader className="animate-spin size-2" /> <p>En cours...</p>
                </div>
              ) : (
                "Ajouter"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUser;
