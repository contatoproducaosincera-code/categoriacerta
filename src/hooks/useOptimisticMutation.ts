import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface OptimisticMutationOptions<TData, TVariables> {
  queryKey: string[];
  mutationFn: (variables: TVariables) => Promise<TData>;
  updateFn: (oldData: TData[] | undefined, variables: TVariables) => TData[];
  successMessage: { title: string; description: string };
  errorMessage: { title: string; description: string };
  onSuccess?: (data: TData, variables: TVariables) => void;
}

export function useOptimisticMutation<TData, TVariables>({
  queryKey,
  mutationFn,
  updateFn,
  successMessage,
  errorMessage,
  onSuccess,
}: OptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TData[]>(queryKey);

      // Optimistically update
      queryClient.setQueryData<TData[]>(queryKey, (old) => updateFn(old, variables));

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({
        title: errorMessage.title,
        description: err instanceof Error ? err.message : errorMessage.description,
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      toast(successMessage);
      onSuccess?.(data, variables);
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
