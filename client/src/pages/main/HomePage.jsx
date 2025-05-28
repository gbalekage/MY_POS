import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, X } from "lucide-react";
import Login from "@/components/main/Login";

const HomePage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const serverUrl = await window.electronAPI.ipcRenderer.invoke(
          "get-server-url"
        );
        if (!serverUrl) throw new Error("Server URL is not configured");

        const response = await axios.get(`${serverUrl}/api/users`);
        const activeUsers = response.data.filter((user) => user.isActive);
        setUsers(activeUsers);
      } catch (err) {
        setError(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const formattedTime = time.toLocaleTimeString();
  const formattedDate = time.toLocaleDateString();

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleLoginConfirm = ({ email, password }) => {
    console.log("Login request with:", email, password);
    localStorage.setItem("loggedInUser", JSON.stringify({ email }));
    setDialogOpen(false);
  };

  // Reset selectedUser on dialog close
  const handleDialogOpenChange = (isOpen) => {
    setDialogOpen(isOpen);
    if (!isOpen) {
      setSelectedUser(null);
    }
  };

  const handleCloseApp = async () => {
    if (window?.electronAPI?.ipcRenderer) {
      await window.electronAPI.ipcRenderer.invoke("close-app");
    }
  };

  if (loading) return <div className="p-4">Chargement des utilisateurs...</div>;
  if (error) return <div className="p-4 text-red-500">Erreur: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">MYPOS</h1>
        <div className="flex items-center gap-4 text-gray-600">
          <span>{formattedDate}</span>
          <span>{formattedTime}</span>
          <X
            className="bg-red-500 rounded-sm w-6 h-6 text-white hover:bg-red-600 cursor-pointer transition"
            onClick={handleCloseApp}
          />
        </div>
      </header>

      {/* User List */}
      <main className="flex-1 p-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {users.length === 0 ? (
          <p className="text-gray-600 col-span-full">
            Aucun utilisateur actif trouvé.
          </p>
        ) : (
          users.map((user) => {
            let bgColor = "bg-white";
            if (user.role === "admin") bgColor = "bg-green-100";
            else if (user.role === "manager") bgColor = "bg-yellow-100";

            return (
              <Card
                key={user.id || user._id}
                className={`aspect-auto flex flex-col justify-center items-center shadow-sm hover:shadow-md transition cursor-pointer ${bgColor}`}
                onClick={() => handleUserClick(user)}
              >
                <CardContent className="p-4 text-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {user.name || user.username || "Utilisateur"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {user.email || "Email non fourni"}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>

      {/* Login Dialog */}
      {selectedUser && (
        <Login
          user={selectedUser}
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          onConfirm={handleLoginConfirm}
        />
      )}
    </div>
  );
};

export default HomePage;
