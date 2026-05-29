import { useEffect, useState } from "react";
import { getPressureFoehnData, type WindData } from "./forecast";
import "./App.css";

const chartWidth = 820;
const chartHeight = 360;
const padding = {
  top: 24,
  right: 12,
  bottom: 48,
  left: 44,
};
const lowerThreshold = -2;
const upperThreshold = 2;

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "2-digit",
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
  const plotBottom = chartHeight - padding.bottom;
  const lowerThresholdY = getY(lowerThreshold);
  const upperThresholdY = getY(upperThreshold);
  const windLabelX = padding.left + plotWidth / 2;
  const oraLabelY = padding.top + 14;
  const pelerLabelY = plotBottom - 84;

  const linePoints = data
    .map((point, index) => `${getX(index)},${getY(point.difference)}`)
    .join(" ");
  const zeroY = yMin <= 0 && yMax >= 0 ? getY(0) : null;
  const referenceLines = [lowerThreshold, upperThreshold].filter(
    (value) => value >= yMin && value <= yMax,
  );
  const yTicks = Array.from({ length: 9 }, (_, index) => yMax - index * 2);
  const days = data.reduce<{ date: string; startIndex: number; endIndex: number }[]>(
    (result, point, index) => {
      const date = point.time.split("T")[0];
      const currentDay = result.at(-1);

      if (currentDay?.date === date) {
        currentDay.endIndex = index;
      } else {
        result.push({ date, startIndex: index, endIndex: index });
      }

      return result;
    },
    [],
  );
  const chartPoints = data.map((point, index) => ({
    difference: point.difference,
    x: getX(index),
    y: getY(point.difference),
  }));
  const getHighlightedAreaPaths = (
    threshold: number,
    isHighlighted: (difference: number) => boolean,
  ) => {
    const thresholdY = getY(threshold);
    const paths: string[] = [];
    let activeArea: { x: number; y: number }[] = [];

    const closeActiveArea = () => {
      if (activeArea.length < 2) {
        activeArea = [];
        return;
      }

      const first = activeArea[0];
      const last = activeArea[activeArea.length - 1];
      paths.push(
        [
          `M ${first.x},${thresholdY}`,
          ...activeArea.map((point) => `L ${point.x},${point.y}`),
          `L ${last.x},${thresholdY}`,
          "Z",
        ].join(" "),
      );
      activeArea = [];
    };

    for (let index = 0; index < chartPoints.length - 1; index += 1) {
      const current = chartPoints[index];
      const next = chartPoints[index + 1];
      const currentIsHighlighted = isHighlighted(current.difference);
      const nextIsHighlighted = isHighlighted(next.difference);
      const crossedThreshold = currentIsHighlighted !== nextIsHighlighted;
      const crossingPoint = crossedThreshold
        ? {
          x:
            current.x +
            ((threshold - current.difference) /
              (next.difference - current.difference)) *
            (next.x - current.x),
          y: thresholdY,
        }
        : null;

      if (currentIsHighlighted && activeArea.length === 0) {
        activeArea.push({ x: current.x, y: current.y });
      }

      if (currentIsHighlighted && nextIsHighlighted) {
        activeArea.push({ x: next.x, y: next.y });
      } else if (currentIsHighlighted && crossingPoint) {
        activeArea.push(crossingPoint);
        closeActiveArea();
      } else if (nextIsHighlighted && crossingPoint) {
        activeArea = [crossingPoint, { x: next.x, y: next.y }];
      }
    }

    closeActiveArea();

    return paths;
  };
  const highlightedAreaPaths = [
    ...getHighlightedAreaPaths(
      lowerThreshold,
      (difference) => difference < lowerThreshold,
    ),
    ...getHighlightedAreaPaths(
      upperThreshold,
      (difference) => difference > upperThreshold,
    ),
  ];

  return (
    <section className="chart-panel" aria-labelledby="pressure-chart-title">
      <div>
        <h1 id="pressure-chart-title">Wind forecast Garda Lake</h1>
        <p>Brescia/Ghedi - Bolzano, (hPa)</p>
      </div>

      <svg
        className="pressure-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Line chart showing pressure difference over time"
      >
        <rect
          className="chart-wind-zone"
          x={padding.left}
          y={padding.top}
          width={plotWidth}
          height={upperThresholdY - padding.top}
        />
        <rect
          className="chart-wind-zone"
          x={padding.left}
          y={lowerThresholdY}
          width={plotWidth}
          height={plotBottom - lowerThresholdY}
        />

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

        {days.slice(1).map((day) => (
          <line
            className="chart-day-line"
            key={day.date}
            x1={getX(day.startIndex)}
            x2={getX(day.startIndex)}
            y1={padding.top}
            y2={chartHeight - padding.bottom}
          />
        ))}

        {highlightedAreaPaths.map((path) => (
          <path className="chart-highlight-area" d={path} key={path} />
        ))}

        {referenceLines.map((value) => (
          <g key={value}>
            <line
              className="chart-reference-line"
              x1={padding.left}
              x2={chartWidth - padding.right}
              y1={getY(value)}
              y2={getY(value)}
            />
          </g>
        ))}

        <g className="chart-wind-label">
          <polygon
            points={[
              `${windLabelX},${oraLabelY}`,
              `${windLabelX + 42},${oraLabelY + 20}`,
              `${windLabelX + 26},${oraLabelY + 20}`,
              `${windLabelX + 26},${oraLabelY + 46}`,
              `${windLabelX - 26},${oraLabelY + 46}`,
              `${windLabelX - 26},${oraLabelY + 20}`,
              `${windLabelX - 42},${oraLabelY + 20}`,
            ].join(" ")}
          />
          <text x={windLabelX} y={oraLabelY + 37}>
            ORA
          </text>
        </g>

        <g className="chart-wind-label">
          <polygon
            points={[
              `${windLabelX},${pelerLabelY + 68}`,
              `${windLabelX + 42},${pelerLabelY + 48}`,
              `${windLabelX + 26},${pelerLabelY + 48}`,
              `${windLabelX + 26},${pelerLabelY + 22}`,
              `${windLabelX - 26},${pelerLabelY + 22}`,
              `${windLabelX - 26},${pelerLabelY + 48}`,
              `${windLabelX - 42},${pelerLabelY + 48}`,
            ].join(" ")}
          />
          <text x={windLabelX} y={pelerLabelY + 41}>
            PELER
          </text>
        </g>

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

        {days.map((day) => (
          <text
            className="chart-x-label"
            key={day.date}
            x={getX((day.startIndex + day.endIndex) / 2)}
            y={chartHeight - 18}
          >
            {formatDay(data[day.startIndex].time)}
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

  return (
    <main>
      {error && <p className="status error">{error}</p>}
      {!error && !windData && <p className="status">Loading forecast...</p>}
      {windData && <PressureDifferenceChart data={windData} />}
    </main>
  );
}
