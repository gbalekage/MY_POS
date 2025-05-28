import React from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

const LogoutButton = ({ onLogout, loading = false }) => {
  return (
    <Button
      onClick={onLogout}
      disabled={loading}
      className="bg-red-600 hover:bg-red-700 rounded-full text-white font-bold px-4 py-2"
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader className="animate-spin size-2" /> <p>Déconnexion...</p>
        </div>
      ) : (
        "Se déconnecter"
      )}
    </Button>
  );
};

export default LogoutButton;
