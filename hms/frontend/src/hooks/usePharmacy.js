import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";

export default function usePharmacy(params = {}) {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ["pharmacy", params],
    retry: false,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await api.get("/pharmacy", { params });
      return data?.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/pharmacy", payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Medicine created");
      queryClient.invalidateQueries({ queryKey: ["pharmacy"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/pharmacy/${id}`, payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Medicine updated");
      queryClient.invalidateQueries({ queryKey: ["pharmacy"] });
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    ...queryResult,
    createMedicine: createMutation.mutateAsync,
    updateMedicine: updateMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
  };
}
