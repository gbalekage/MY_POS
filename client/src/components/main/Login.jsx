import React, { useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserContext } from "@/context/UserContext";
import axios from "axios";
import { DialogDescription } from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Keyboard, Loader } from "lucide-react";
import KeyBoard from "./KeyBoard";

const Login = ({ user, open, onOpenChange }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(UserContext);
  const [userData, setUserData] = useState({
    emailOrUsername: user?.email,
    password: "",
  });
  const [showKeyboard, setShowKeyboard] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setUserData({ password: "", emailOrUsername: user?.email });
      setError("");
      setShowKeyboard(false);
    }
  }, [open, user]);

  const changeInputHandler = (e) => {
    setUserData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // Modification ici : même gestion que dans OrderCard
  const handleKeyboardKeyPress = (key) => {
    setUserData((prev) => {
      if (key === "BACKSPACE") {
        return { ...prev, password: prev.password.slice(0, -1) };
      } else {
        return { ...prev, password: prev.password + key };
      }
    });
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const response = await axios.post(
        `${serverUrl}/api/users/login-user`,
        userData
      );
      const loggedInUser = response.data.user;
      setUser(loggedInUser);
      console.log(loggedInUser);
      switch (loggedInUser.role) {
        case "admin":
          navigate("/admin");
          break;
        case "caissier":
          navigate("/cashier");
          break;
        case "manager":
          navigate("/manager");
          break;
        case "serveur":
          navigate("/attendant");
          break;
        default:
          navigate("/not-authorized");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la connexion"
      );
      setError(error.response?.data?.message || "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md w-full p-8 rounded-lg shadow-lg bg-white">
          <DialogHeader>
            <DialogTitle>Connexion utilisateur</DialogTitle>
            <DialogDescription>
              Entrer le mot de passe pour vous connecter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            <div>
              <label htmlFor="email" className="mb-2 block select-none">
                Email
              </label>
              <Input
                id="email"
                name="emailOrUsername"
                value={userData.emailOrUsername || ""}
                className="mt-2 p-3 rounded-lg"
                disabled
                style={{ userSelect: "text" }}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block select-none">
                Mot de passe
              </label>
              <div className="relative mb-2">
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Entrez le mot de passe"
                  value={userData.password}
                  className="mt-2 p-3 rounded-lg pr-14"
                  onChange={changeInputHandler}
                />
                <button
                  type="button"
                  onClick={() => setShowKeyboard(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                  aria-label="Afficher le clavier tactile"
                >
                  <Keyboard />
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button
              onClick={handleLogin}
              className="w-full rounded-full bg-muted-foreground hover:bg-foreground py-4"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2 justify-center">
                  <Loader className="animate-spin size-2" /> <p>En cours...</p>
                </div>
              ) : (
                "Se connecter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clavier virtuel */}
      <KeyBoard
        open={showKeyboard}
        onClose={() => setShowKeyboard(false)}
        onKeyPress={handleKeyboardKeyPress}
        layout="azerty"
      />
    </>
  );
};

export default Login;
