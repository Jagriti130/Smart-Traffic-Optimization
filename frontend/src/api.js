import axios from "axios";

const API = axios.create({
  baseURL: "https://smart-trafiic-optimization.onrender.com",
});

export const getAreas = () => API.get("/areas");
export const predictTraffic = (data) => API.post("/predict", data);
export const getSignalAction = (data) => API.post("/signal", data);
