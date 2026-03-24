import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";

export default function useBilling(params = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["billing", params],
    retry: false,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await api.get("/billing", { params });
      return data?.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/billing", payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Invoice created");
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/billing/${id}`, payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Invoice updated");
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/billing/${id}`);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Invoice deleted");
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    ...query,
    createBilling: createMutation.mutateAsync,
    updateBilling: updateMutation.mutateAsync,
    deleteBilling: deleteMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
  };
}
