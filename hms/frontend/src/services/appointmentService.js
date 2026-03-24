import apiClient from "./apiClient";

const appointmentService = {
  list: async (params = {}) => {
    const { data } = await apiClient.get("/appointments", { params });
    return data?.data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post("/appointments", payload);
    return data?.data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/appointments/${id}`, payload);
    return data?.data;
  },
  remove: async (id) => {
    const { data } = await apiClient.delete(`/appointments/${id}`);
    return data?.data;
  },
};

export default appointmentService;
