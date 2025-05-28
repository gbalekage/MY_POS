import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import React, { useContext, useEffect, useState, useCallback } from "react";
import Layout from "@/components/admin/Layout";
import { UserContext } from "@/context/UserContext";
import axios from "axios";
import { toast } from "sonner";

const Admin = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);
  const token = user?.token;

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");
      const response = await axios.get(`${serverUrl}/api/today/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data.orders);
    } catch (error) {
      setError("Impossible de récupérer les commandes.");
      toast.error("Impossible de récupérer les commandes.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <Layout>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            {loading ? (
              <div className="text-center py-8">
                Chargement des commandes...
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : (
              <DataTable data={data} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
