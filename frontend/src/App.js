import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { getAreas, getSignalAction, predictTraffic } from "./api";
import "./App.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function App() {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("Andheri");
  const [result, setResult] = useState(null);
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Connected to the smart traffic engine.");

  const [form, setForm] = useState({
    hour: 9,
    day_of_week: 1,
    is_holiday: 0,
    weather: "Clear",
    temperature: 28,
    vehicle_count: 140,
    num_lanes: 4,
  });

  useEffect(() => {
    const loadAreas = async () => {
      try {
        const res = await getAreas();
        const areaList = res.data || [];
        setAreas(areaList);
        if (areaList.length > 0 && !areaList.some((item) => item.area === selectedArea)) {
          setSelectedArea(areaList[0].area);
        }
        setStatus("Live area data loaded from the backend.");
      } catch (err) {
        setStatus("Backend unavailable. The dashboard is using fallback UI until the API is reachable.");
      }
    };

    loadAreas();
  }, [selectedArea]);

  const handlePredict = async () => {
    setLoading(true);
    setStatus("Requesting a traffic prediction from the backend...");
    try {
      const res = await predictTraffic({ area: selectedArea, ...form });
      setResult(res.data);
      setStatus(`Prediction ready for ${res.data.area}.`);
    } catch (err) {
      setStatus("Prediction failed. Make sure the backend is running and reachable.");
    }
    setLoading(false);
  };

  const handleSignal = async () => {
    try {
      const res = await getSignalAction({
        queue_n: 16,
        queue_s: 14,
        queue_e: 11,
        queue_w: 13,
        waiting: 27,
      });
      setSignal(res.data);
      setStatus("Signal recommendation received from the RL engine.");
    } catch (err) {
      setStatus("Signal suggestion service is not reachable right now.");
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🚦 Smart Traffic Optimization</h1>
        <p>Monitor city traffic conditions and receive AI-backed signal guidance in one place.</p>
      </div>

      <div className="hero-grid">
        <div className="hero-card">
          <h3>Live prediction</h3>
          <p>Estimate congestion and waiting time for any area before peak hours.</p>
        </div>
        <div className="hero-card">
          <h3>Adaptive control</h3>
          <p>Use reinforcement learning suggestions to optimize signal timing decisions.</p>
        </div>
        <div className="hero-card">
          <h3>Connected dashboard</h3>
          <p>The React UI now talks to the backend API for real route and prediction data.</p>
        </div>
      </div>

      <div className="container">
        <div className="map-card">
          <div className="card-title-row">
            <h2>Live Area Map</h2>
            <span className="pill">Mumbai coverage</span>
          </div>
          <MapContainer center={[19.08, 72.88]} zoom={12} style={{ height: "480px", width: "100%" }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap'
            />
            {areas.map((area) => (
              <Marker
                key={area.area}
                position={[area.latitude, area.longitude]}
                eventHandlers={{ click: () => setSelectedArea(area.area) }}
              >
                <Popup>
                  <b>{area.area}</b>
                  <br />
                  Click to inspect this location.
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="control-card">
          <div className="card-title-row">
            <h2>Traffic Intelligence</h2>
            <span className="pill pill-success">{status}</span>
          </div>

          <div className="form-group">
            <label>Selected Area</label>
            <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)}>
              {areas.map((area) => (
                <option key={area.area} value={area.area}>
                  {area.area}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Hour (0-23)</label>
            <input type="number" value={form.hour} onChange={(e) => setForm({ ...form, hour: +e.target.value })} />
          </div>

          <div className="form-group">
            <label>Weather</label>
            <select value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value })}>
              <option>Clear</option>
              <option>Cloudy</option>
              <option>Rain</option>
              <option>Fog</option>
            </select>
          </div>

          <div className="form-group">
            <label>Vehicle Count</label>
            <input type="number" value={form.vehicle_count} onChange={(e) => setForm({ ...form, vehicle_count: +e.target.value })} />
          </div>

          <button className="btn btn-predict" onClick={handlePredict} disabled={loading}>
            {loading ? "Predicting..." : "Predict Traffic"}
          </button>

          <button className="btn btn-signal" onClick={handleSignal}>
            Get RL Signal Suggestion
          </button>

          {result && (
            <div className="result-box">
              <h3>Prediction for {result.area}</h3>
              <div className="result-row">
                <span>Density</span>
                <span>{result.traffic_density}</span>
              </div>
              <div className="result-row">
                <span>Congestion</span>
                <span>{result.congestion_pct}%</span>
              </div>
              <div className="result-row">
                <span>Waiting Time</span>
                <span>{result.waiting_time} sec</span>
              </div>
              <div className="result-row">
                <span>Category</span>
                <span className={`badge badge-${result.category}`}>{result.category}</span>
              </div>
            </div>
          )}

          {signal && (
            <div className="result-box">
              <h3>RL Signal Control</h3>
              <div className="result-row">
                <span>Suggested Action</span>
                <span className="signal-value">{signal.action}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;