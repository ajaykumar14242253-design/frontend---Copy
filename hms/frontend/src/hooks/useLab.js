import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "../lib/api";

export default function useLab(params = {}) {
  const queryClient = useQueryClient();

  const queryResult = useQuery({
    queryKey: ["lab", params],
    retry: false,
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await api.get("/lab", { params });
      return data?.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post("/lab", payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Lab order created");
      queryClient.invalidateQueries({ queryKey: ["lab"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/lab/${id}`, payload);
      return data?.data;
    },
    onSuccess: () => {
      toast.success("Lab order updated");
      queryClient.invalidateQueries({ queryKey: ["lab"] });
    },
    onError: (error) => toast.error(error.message),
  });

  return {
    ...queryResult,
    createLabOrder: createMutation.mutateAsync,
    updateLabOrder: updateMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
  };
}
