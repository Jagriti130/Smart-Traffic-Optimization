import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

export const getAreas = () => API.get("/areas");
export const predictTraffic = (data) => API.post("/predict", data);
export const getSignalAction = (data) => API.post("/signal", data);