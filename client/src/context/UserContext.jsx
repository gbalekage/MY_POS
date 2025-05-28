import { createContext, useEffect, useState } from "react";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Chargement du user depuis Electron Store au montage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await window.electronAPI.ipcRenderer.invoke(
          "get-store-value",
          "user"
        );
        if (storedUser) setUser(storedUser);
      } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur :", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Sauvegarde du user dans Electron Store à chaque changement
  useEffect(() => {
    const saveUser = async () => {
      try {
        await window.electronAPI.ipcRenderer.invoke("set-store-value", {
          key: "user",
          value: user,
        });
      } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'utilisateur :", error);
      }
    };

    if (user !== null) saveUser();
  }, [user]);

  return (
    <UserContext.Provider
      value={{ user, setUser, loading, showLogin, setShowLogin }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
