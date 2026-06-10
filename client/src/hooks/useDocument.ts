import useSWR from "swr";
import type { Doc } from "../types";

const fetcher = (url: string) => fetch(url).then(r => {
  if (r.status === 404) throw Object.assign(new Error("not_found"), { status: 404 });
  return r.json();
});

export function useDocument(id: string | undefined) {
  const { data, isLoading, error } = useSWR<Doc>(
    id ? `/api/documents/${id}` : null,
    fetcher,
    { refreshInterval: (data) => (data?.status === "ready" ? 0 : 3000) }
  );
  return { doc: data, isLoading, error };
}
