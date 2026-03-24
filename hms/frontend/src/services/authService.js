import apiClient from "./apiClient";

const authService = {
  login: async (payload) => {
    const { data } = await apiClient.post("/auth/login", payload);
    return data?.data || data;
  },
  register: async (payload) => {
    const { data } = await apiClient.post("/auth/register", payload);
    return data?.data || data;
  },
  me: async () => {
    const { data } = await apiClient.get("/auth/me");
    return data?.data?.user || data?.user || null;
  },
};

export default authService;
