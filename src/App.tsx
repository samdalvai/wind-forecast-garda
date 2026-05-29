import { useEffect, useState } from "react";
import { getPressureFoehnData, type WindData } from "./forecast";
import "./App.css";

const chartWidth = 820;
const chartHeight = 360;
const padding = {
  top: 24,
  right: 24,
  bottom: 48,
  left: 56,
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    hour: "2-digit",
  }).format(new Date(value));
}

function PressureDifferenceChart({ data }: { data: WindData }) {
  if (data.length === 0) {
    return <p>No forecast data available.</p>;
  }

  const yMin = -8;
  const yMax = 8;
  const yRange = yMax - yMin || 1;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) =>
    padding.left + (index / Math.max(data.length - 1, 1)) * plotWidth;
  const getY = (difference: number) =>
    padding.top + ((yMax - difference) / yRange) * plotHeight;

  const linePoints = data
    .map((point, index) => `${getX(index)},${getY(point.difference)}`)
    .join(" ");
  const zeroY = yMin <= 0 && yMax >= 0 ? getY(0) : null;
  const referenceLines = [-2, 2].filter((value) => value >= yMin && value <= yMax);
  const yTicks = Array.from({ length: 9 }, (_, index) => yMax - index * 2);
  const xTickIndexes = Array.from(
    new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]),
  );

  return (
    <section className="chart-panel" aria-labelledby="pressure-chart-title">
      <div>
        <h1 id="pressure-chart-title">Pressure Difference</h1>
        <p>Brescia/Ghedi - Bolzano, (hPa)</p>
      </div>

      <svg
        className="pressure-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Line chart showing pressure difference over time"
      >
        {yTicks.map((tick) => {
          const y = getY(tick);

          return (
            <g key={tick}>
              <line
                className="chart-grid-line"
                x1={padding.left}
                x2={chartWidth - padding.right}
                y1={y}
                y2={y}
              />
              <text className="chart-y-label" x={padding.left - 12} y={y + 4}>
                {tick.toFixed(1)}
              </text>
            </g>
          );
        })}

        {zeroY !== null && (
          <line
            className="chart-zero-line"
            x1={padding.left}
            x2={chartWidth - padding.right}
            y1={zeroY}
            y2={zeroY}
          />
        )}

        {referenceLines.map((value) => (
          <g key={value}>
            <line
              className="chart-reference-line"
              x1={padding.left}
              x2={chartWidth - padding.right}
              y1={getY(value)}
              y2={getY(value)}
            />
            {/* <text
              className="chart-reference-label"
              x={chartWidth - padding.right - 8}
              y={getY(value) - 8}
            >
              {value}
            </text> */}
          </g>
        ))}

        <line
          className="chart-axis"
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={chartHeight - padding.bottom}
        />
        <line
          className="chart-axis"
          x1={padding.left}
          x2={chartWidth - padding.right}
          y1={chartHeight - padding.bottom}
          y2={chartHeight - padding.bottom}
        />

        <polyline className="chart-line" points={linePoints} />

        {xTickIndexes.map((index) => (
          <text
            className="chart-x-label"
            key={index}
            x={getX(index)}
            y={chartHeight - 18}
          >
            {formatTime(data[index].time)}
          </text>
        ))}
      </svg>
    </section>
  );
}

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

  console.log("wind data length: ", windData?.length);
  console.log("wind data: ", windData);

  return (
    <main>
      {error && <p className="status error">{error}</p>}
      {!error && !windData && <p className="status">Loading forecast...</p>}
      {windData && <PressureDifferenceChart data={windData} />}
    </main>
  );
}
