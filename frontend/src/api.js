import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export const getAreas = () => API.get("/areas");
export const predictTraffic = (data) => API.post("/predict", data);
export const getSignalAction = (data) => API.post("/signal", data);
