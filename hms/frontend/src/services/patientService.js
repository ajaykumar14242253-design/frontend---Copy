import apiClient from "./apiClient";

const patientService = {
  list: async (params = {}) => {
    const { data } = await apiClient.get("/patients", { params });
    return data?.data;
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/patients/${id}`);
    return data?.data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post("/patients", payload);
    return data?.data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/patients/${id}`, payload);
    return data?.data;
  },
  remove: async (id) => {
    const { data } = await apiClient.delete(`/patients/${id}`);
    return data?.data;
  },
};

export default patientService;
