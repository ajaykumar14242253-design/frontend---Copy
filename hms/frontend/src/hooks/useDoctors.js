import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";

export default function useDoctors(params = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["doctors", params],
    retry: false,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await api.get("/doctors", { params });
      return data?.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/doctors", payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Doctor created");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/doctors/${id}`, payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Doctor updated");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/doctors/${id}`);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Doctor deleted");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    ...query,
    createDoctor: createMutation.mutateAsync,
    updateDoctor: updateMutation.mutateAsync,
    deleteDoctor: deleteMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
