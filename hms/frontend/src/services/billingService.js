import apiClient from "./apiClient";

const billingService = {
  list: async (params = {}) => {
    const { data } = await apiClient.get("/billing", { params });
    return data?.data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post("/billing", payload);
    return data?.data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/billing/${id}`, payload);
    return data?.data;
  },
  remove: async (id) => {
    const { data } = await apiClient.delete(`/billing/${id}`);
    return data?.data;
  },
};

export default billingService;
