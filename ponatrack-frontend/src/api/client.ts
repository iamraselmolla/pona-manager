import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants";

const apiClient = axios.create({
  baseURL: "http://localhost:4000/api",
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export default apiClient;
