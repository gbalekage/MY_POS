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

const EditCompany = ({ isOpen, onClose, companyId, onSuccess }) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const { user } = useContext(UserContext);
  const token = user?.token;

  useEffect(() => {
    const getCompany = async () => {
      try {
        const serverUrl = await window.electronAPI.ipcRenderer.invoke(
          "get-server-url"
        );
        if (!serverUrl) throw new Error("Server URL is not configured");

        const response = await axios.get(
          `${serverUrl}/api/company/${companyId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setName(response.data.name);
        setAddress(response.data.address);
        setPhone(response.data.phone);
        setEmail(response.data.email);
        setIsDemo(response.data.isDemo);
      } catch (error) {
        toast.error(error.response.data.message);
      }
    };

    getCompany();
  }, [token]);

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
            try {
              const serverUrl = await window.electronAPI.ipcRenderer.invoke(
                "get-server-url"
              );
              if (!serverUrl) throw new Error("Server URL is not configured");
              await axios.put(
                `${serverUrl}/api/company/${companyId}`,
                {
                  name,
                  address,
                  phone,
                  email,
                  isDemo,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              toast.success(
                "Informations de l'entreprise modifiées avec succès !"
              );
              onSuccess?.();
              onClose();
            } catch (error) {
              toast.error(
                error.response?.data?.message ||
                  "Erreur lors de la modification."
              );
            }
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDemo"
                checked={isDemo}
                onChange={(e) => setIsDemo(e.target.checked)}
              />
              <label htmlFor="isDemo" className="text-sm">
                Démo
              </label>
            </div>
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Modifier</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompany;
