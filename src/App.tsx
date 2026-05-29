import { useEffect, useState } from "react";
import { getPressureFoehnData, type WindData } from "./forecast";

export function App() {
  const [windData, setWindData] = useState<WindData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getPressureFoehnData();
      setWindData(data);
    };

    fetchData();
  }, []);

  console.log(windData);

  return (
    <main>

    </main>
  );
}
