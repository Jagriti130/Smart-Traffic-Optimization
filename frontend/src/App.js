import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { getAreas, predictTraffic, getSignalAction } from "./api";
import "./App.css";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MapClickHandler({ onAreaClick }) {
  useMapEvents({
    click(e) {
      // optional: handle empty click
    },
  });
  return null;
}

function App() {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("Andheri");
  const [result, setResult] = useState(null);
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(false);

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
    getAreas()
      .then((res) => setAreas(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await predictTraffic({
        area: selectedArea,
        ...form,
      });
      setResult(res.data);
    } catch (err) {
      alert("Prediction failed. Is backend running?");
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
    } catch (err) {
      alert("RL service failed");
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🚦 Smart Traffic Optimization</h1>
        <p>Click any area on the map or select from dropdown to predict traffic</p>
      </div>

      <div className="container">
        {/* Left - Map */}
        <div className="map-card">
          <h2>Live Area Map (Mumbai)</h2>
          <MapContainer
            center={[19.08, 72.88]}
            zoom={12}
            style={{ height: "480px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap'
            />
            {areas.map((a) => (
              <Marker
                key={a.area}
                position={[a.latitude, a.longitude]}
                eventHandlers={{
                  click: () => {
                    setSelectedArea(a.area);
                  },
                }}
              >
                <Popup>
                  <b>{a.area}</b>
                  <br />
                  Click marker to select
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Right - Controls */}
        <div className="control-card">
          <h2>Traffic Prediction</h2>

          <div className="form-group">
            <label>Selected Area</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              {areas.map((a) => (
                <option key={a.area} value={a.area}>
                  {a.area}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Hour (0-23)</label>
            <input
              type="number"
              value={form.hour}
              onChange={(e) => setForm({ ...form, hour: +e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Weather</label>
            <select
              value={form.weather}
              onChange={(e) => setForm({ ...form, weather: e.target.value })}
            >
              <option>Clear</option>
              <option>Cloudy</option>
              <option>Rain</option>
              <option>Fog</option>
            </select>
          </div>

          <div className="form-group">
            <label>Vehicle Count</label>
            <input
              type="number"
              value={form.vehicle_count}
              onChange={(e) => setForm({ ...form, vehicle_count: +e.target.value })}
            />
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
                <span className={`badge badge-${result.category}`}>
                  {result.category}
                </span>
              </div>
            </div>
          )}

          {signal && (
            <div className="result-box" style={{ marginTop: 15 }}>
              <h3>RL Signal Control</h3>
              <div className="result-row">
                <span>Suggested Action</span>
                <span style={{ color: "#34d399" }}>{signal.action}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;