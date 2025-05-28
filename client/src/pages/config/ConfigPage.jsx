import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { Loader } from "lucide-react";

const ConfigPage = () => {
  const [serverUrl, setServerUrl] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [checked, setChecked] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setLoading(true);
    setServerStatus(null);
    setChecked(false);
    try {
      await axios.get(`${serverUrl}/api/health`);
      setServerStatus("on");
      setChecked(true);
      toast.success("Le serveur est en ligne !");
    } catch (err) {
      setServerStatus("off");
      setChecked(false);
      toast.error(
        "Le serveur est inaccessible. Veuillez vérifier l'URL et réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${serverUrl}/api/create-demo`, {
        token: "balekagegael.com",
      });

      if (response.status === 201 || response.status === 200) {
        if (window.electronAPI?.ipcRenderer) {
          window.electronAPI.ipcRenderer.send("save-config", serverUrl);
          setSuccess(true);
          toast.success("Démo initialisée avec succès !");
          setTimeout(() => {
            window.close();
          }, 500);
        }
      } else {
        toast.error("Échec de l'initialisation de la démo.");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la démo :", error);
      toast.error(
        // "Impossible de créer la démo. Vérifiez que le serveur est accessible"
        error.response.data.message
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <title>Configuration | POS</title>
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle>Configuration initiale</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={checked ? handleSave : handleCheck}
            className="space-y-4"
          >
            <div>
              <label htmlFor="server-url" className="block mb-1 font-medium">
                URL du serveur :
              </label>
              <Input
                id="server-url"
                type="text"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setChecked(false);
                  setServerStatus(null);
                }}
                placeholder="ex: http://localhost:3000"
                required
                disabled={loading || success}
              />
            </div>
            {!checked ? (
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !serverUrl}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader className="animate-spin size-2" />{" "}
                    <p>Vérification...</p>
                  </div>
                ) : (
                  "Vérifier le serveur"
                )}
              </Button>
            ) : (
              <Button type="submit" className="w-full" disabled={success}>
                Enregistrer
              </Button>
            )}
            {serverStatus === "on" && (
              <div className="text-green-600 text-center mt-2">
                ✅ Serveur en ligne
              </div>
            )}
            {serverStatus === "off" && (
              <div className="text-red-600 text-center mt-2">
                ❌ Serveur hors ligne
              </div>
            )}
            {success && (
              <div className="text-green-600 text-center mt-2">
                Configuration enregistrée !
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigPage;
