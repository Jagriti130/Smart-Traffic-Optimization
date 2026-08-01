import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://smart-trafiic-optimization.onrender.com",
  timeout: 20000,
});

export const getAreas = () => API.get("/areas");
export const predictTraffic = (data) => API.post("/predict", data);
export const getSignalAction = (data) => API.post("/signal", data);
