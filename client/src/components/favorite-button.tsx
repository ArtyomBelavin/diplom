"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { FavoriteItem } from "@/lib/favorites";
import { useAccessibility } from "@/providers/accessibility-provider";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  productId: number;
  className?: string;
};

export function FavoriteButton({
  productId,
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { auth, announce } = useAccessibility();
  const favoritesQuery = useQuery({
    queryKey: ["favorites", auth.token],
    queryFn: () =>
      apiFetch<FavoriteItem[]>("/users/favorites", {
        token: auth.token,
      }),
    enabled: Boolean(auth.token),
  });

  const favoriteIds = new Set(
    (favoritesQuery.data ?? []).map((favorite) => favorite.productId),
  );
  const isFavorite = favoriteIds.has(productId);

  const addMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>(`/users/favorites/${productId}`, {
        method: "POST",
        token: auth.token,
      }),
    onSuccess: async (response) => {
      announce(response.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["favorites"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
      ]);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>(`/users/favorites/${productId}`, {
        method: "DELETE",
        token: auth.token,
      }),
    onSuccess: async (response) => {
      announce(response.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["favorites"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
      ]);
    },
  });

  const toggleFavorite = async () => {
    if (!auth.token) {
      router.push("/login");
      return;
    }

    if (isFavorite) {
      await removeMutation.mutateAsync();
      return;
    }

    await addMutation.mutateAsync();
  };

  return (
    <button
      aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        isFavorite
          ? "border-transparent bg-[color:var(--accent)] text-white shadow-sm"
          : "border-[color:var(--border)] bg-white/85 text-[color:var(--muted)] backdrop-blur hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]",
        className,
      )}
      type="button"
      onClick={() => void toggleFavorite()}
    >
      <Heart
        className={cn(
          "size-5 transition-transform",
          isFavorite && "fill-current",
          (addMutation.isPending || removeMutation.isPending) && "scale-90",
        )}
      />
    </button>
  );
}
