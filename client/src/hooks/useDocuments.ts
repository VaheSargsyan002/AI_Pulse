import useSWR from "swr";
import type { Doc } from "../types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useDocuments() {
  const { data = [], mutate, isLoading } = useSWR<Doc[]>("/api/documents", fetcher, {
    refreshInterval: 3000,
  });
  return { docs: data, mutate, isLoading };
}
