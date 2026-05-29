import { useEffect, useState } from "react";
import { getPressureFoehnData, type WindData } from "./forecast";
import { PressureDifferenceChart } from "./PressureDifferenceChart";
import "./App.css";

export function App() {
  const [windData, setWindData] = useState<WindData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPressureFoehnData();
        setWindData(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load data");
      }
    };

    fetchData();
  }, []);

  return (
    <main>
      {error && <p className="status error">{error}</p>}
      {!error && !windData && <p className="status">Loading forecast...</p>}
      {windData && <PressureDifferenceChart data={windData} />}
    </main>
  );
}
