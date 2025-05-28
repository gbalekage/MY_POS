import Layout from "@/components/admin/Layout";
import React, { useState } from "react";
import axios from "@/utils/axiosInstance";
import { Loader, Loader2 } from "lucide-react";
import { UserContext } from "@/context/UserContext";
import { toast } from "sonner";
import EditCompany from "@/components/admin/EditCompany";
import { Button } from "@/components/ui/button";

const CompanyPage = () => {
  const [company, setCompany] = React.useState(null);
  const [logo, setLogo] = React.useState("/logo.png");
  const fileInputRef = React.useRef(null);
  const { user } = React.useContext(UserContext);
  const token = user?.token;
  const [editModal, seteditModal] = useState(false);
  const [companyId, setCompanyId] = useState(null);

  const fetchCompany = async () => {
    try {
      const serverUrl = await window.electronAPI.ipcRenderer.invoke(
        "get-server-url"
      );
      if (!serverUrl) throw new Error("Server URL is not configured");

      const response = await axios.get(`${serverUrl}/api/company-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const entreprise = response.data;
      setCompany(entreprise);
      // Set logo from company data if available
      if (entreprise.logo) {
        // Always use the logo path as provided by the backend, prefix with serverUrl if it starts with /images/
        setLogo(
          entreprise.logo.startsWith("/images/")
            ? `${serverUrl}${entreprise.logo}`
            : entreprise.logo
        );
      } else {
        setLogo("/logo.png");
      }
    } catch (error) {
      console.log(
        "Erreur lors de la récupération des information de l'entreprise :",
        error
      );
      toast.error("Impossible de récupérer les informations de l'entreprise.");
    }
  };

  React.useEffect(() => {
    fetchCompany();
  }, [token]);

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Preview the logo immediately
      const reader = new FileReader();
      reader.onload = (ev) => setLogo(ev.target.result);
      reader.readAsDataURL(file);

      // Upload the logo to the server
      try {
        const serverUrl = await window.electronAPI.ipcRenderer.invoke(
          "get-server-url"
        );
        if (!serverUrl) throw new Error("Server URL is not configured");

        const formData = new FormData();
        formData.append("logo", file);

        const response = await axios.put(
          `${serverUrl}/api/company-logo/${company._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success("Logo mis à jour avec succès !");
        // Re-fetch company info to get the updated logo
        const updatedCompany = await axios.get(
          `${serverUrl}/api/company-info`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCompany(updatedCompany.data);
        if (updatedCompany.data.logo) {
          setLogo(
            updatedCompany.data.logo.startsWith("/images/")
              ? `${serverUrl}${updatedCompany.data.logo}`
              : updatedCompany.data.logo
          );
        } else {
          setLogo("/logo.png");
        }
      } catch (error) {
        console.log("Erreur lors du téléchargement du logo :", error);
        toast.error(
          error.response?.data?.message || "Échec du téléchargement du logo"
        );
      }
    }
  };

  const handleEdit = (id) => {
    setCompanyId(id);
    seteditModal(true);
  };

  if (!company) {
    return (
      <Layout>
        <div className="flex h-screen justify-center items-center">
          <div className="flex items-center gap-3 animate-pulse">
            <Loader className="animate-spin size-5" />
            <span className="animate-pulse">
              Chargement de vos informations...
            </span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-muted-foreground/20">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div
              className="w-24 h-24 rounded-full border-4 border-green-900 bg-white flex items-center justify-center shadow cursor-pointer"
              onClick={handleAvatarClick}
              title="Change avatar"
            >
              <img
                src={logo}
                alt="Company Logo"
                className="w-20 h-20 object-contain rounded-full"
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
            <h1 className="text-2xl font-bold text-center text-foreground mb-1">
              {company.name}
            </h1>
            <span className="text-xs text-muted-foreground">POS System</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M17 7.5V6A2.5 2.5 0 0 0 14.5 3.5h-5A2.5 2.5 0 0 0 7 6v1.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    width="18"
                    height="13"
                    x="3"
                    y="7.5"
                    rx="2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
              <span className="text-base text-foreground">
                {company.address}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13 1.05.37 2.07.72 3.06a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.99.35 2.01.59 3.06.72A2 2 0 0 1 22 16.92z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-base text-foreground">{company.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M4 4h16v16H4V4z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 6.5l-10 7L2 6.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-base text-foreground">{company.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 12h8M12 8v8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-base text-foreground">
                POS Version: <span className="font-semibold">v1.0.0</span>
              </span>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={() => handleEdit(company._id)}
            >
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {editModal && companyId && (
        <EditCompany
          isOpen={editModal}
          onClose={() => seteditModal(false)}
          companyId={companyId}
          onSuccess={() => {
            fetchCompany();
          }}
        />
      )}
    </Layout>
  );
};

export default CompanyPage;
