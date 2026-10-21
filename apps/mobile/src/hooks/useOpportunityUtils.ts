import { useApi } from "../lib/api";

export function getOpps() {
  const api = useApi();
  const orgs = api.opportunities.list({ limit: 20, category: "" });
}
