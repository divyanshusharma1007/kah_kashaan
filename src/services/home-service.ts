import api from "@/services/api";

export async function getHomePageDataFromApi() {
  const response = await api.get("/api/home");
  return response.data;
}
