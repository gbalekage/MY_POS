import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/context/UserContext";

const ClientLogsModal = ({ isOpen, onClose, user }) => {
  const { user: currentUser } = useContext(UserContext);
  const token = currentUser?.token;
  const [logs, setLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?._id) {
      setLoading(true);
      (async () => {
        try {
          const serverUrl = await window.electronAPI.ipcRenderer.invoke(
            "get-server-url"
          );
          const res = await axios.get(`${serverUrl}/api/customers/${user._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setLogs(res.data.activityLogs || []);
          setLoginHistory(res.data.loginHistory || []);
        } catch (e) {
          setLogs([]);
          setLoginHistory([]);
        } finally {
          setLoading(false);
        }
      })();
    } else if (!isOpen) {
      setLogs([]);
      setLoginHistory([]);
    }
  }, [isOpen, user, token]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historique du client</DialogTitle>
          <DialogDescription>
            Affiche les logs d'activité de <b>{user?.fullName}</b>
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
            <div>
              <h3 className="font-semibold mb-2">Logs d'activité</h3>
              <ul className="max-h-64 overflow-y-auto divide-y">
                {logs.length === 0 ? (
                  <li className="text-muted-foreground text-sm py-2">
                    Aucune activité trouvée.
                  </li>
                ) : (
                  logs.map((log, idx) => (
                    <li key={idx} className="py-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                      </div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm break-words">{log.description}</div>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Historique de connexion</h3>
              <ul className="max-h-64 overflow-y-auto divide-y">
                {loginHistory.length === 0 ? (
                  <li className="text-muted-foreground text-sm py-2">
                    Aucun historique trouvé.
                  </li>
                ) : (
                  loginHistory.map((entry, idx) => (
                    <li key={idx} className="py-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        {entry.date ? new Date(entry.date).toLocaleString() : "-"}
                      </div>
                      <div className="text-sm break-words">{entry.info || entry.ip || "Connexion"}</div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientLogsModal;
