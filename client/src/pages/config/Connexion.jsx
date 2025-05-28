import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader } from "lucide-react";

const Connexion = () => {
  const [loading, setLoading] = useState(false);

  const handleRetry = async (e) => {
    e.preventDefault();
    setLoading(true);

    const handler = (_, status) => {
      setLoading(false);
      if (status) {
        toast.success("Connexion réussie !");
      } else {
        toast.error("Échec de la connexion au serveur.");
      }
      window.electronAPI.ipcRenderer.removeListener(
        "connection-status",
        handler
      );
    };

    window.electronAPI.ipcRenderer.on("connection-status", handler);
    window.electronAPI.ipcRenderer.send("retry-connection");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="bg-card p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Connexion au serveur
        </h2>
        <p className="mb-6 text-center text-muted-foreground">
          Impossible de se connecter au serveur.
          <br />
          Vérifiez votre connexion réseau ou contactez l’administrateur.
        </p>
        <form onSubmit={handleRetry} className="flex flex-col gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader className="animate-spin size-2" />{" "}
                <p>Nouvelle tentative...</p>
              </div>
            ) : (
              "Réessayer"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Connexion;
