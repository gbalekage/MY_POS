// utils/axiosInstance.js
import axios from "axios";
import { toast } from "sonner";

let storeSetShowLogin = null;

export const setLoginDialogHandler = (handler) => {
  storeSetShowLogin = handler;
};

const axiosInstance = axios.create();

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      if (storeSetShowLogin) {
        storeSetShowLogin(true);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
