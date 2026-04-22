import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DataPoint {
  date: string;
  fatigue: number | null;
  sleep_quality: number | null;
  mood: number | null;
  stress: number | null;
}

interface LoadChartProps {
  data: DataPoint[];
  fatigueOnly?: boolean;
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
}

export function LoadChart({ data, fatigueOnly = false }: LoadChartProps) {
  const labels = data.map((d) => shortDate(d.date));

  const datasets = fatigueOnly
    ? [
        {
          label: "Fatiga",
          data: data.map((d) => d.fatigue),
          borderColor: "#E8520A",
          backgroundColor: "rgba(232, 82, 10, 0.15)",
          borderWidth: 2.5,
          pointBackgroundColor: "#E8520A",
          pointBorderColor: "#120a07",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3,
        },
      ]
    : [
        {
          label: "Fatiga",
          data: data.map((d) => d.fatigue),
          borderColor: "#E8520A",
          backgroundColor: "rgba(232, 82, 10, 0.1)",
          borderWidth: 2.5,
          pointBackgroundColor: "#E8520A",
          pointBorderColor: "#120a07",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3,
        },
        {
          label: "Sueño",
          data: data.map((d) => d.sleep_quality),
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96, 165, 250, 0.05)",
          borderWidth: 2,
          pointBackgroundColor: "#60a5fa",
          pointBorderColor: "#120a07",
          pointBorderWidth: 2,
          pointRadius: 3.5,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.3,
        },
        {
          label: "Ánimo",
          data: data.map((d) => d.mood),
          borderColor: "#a78bfa",
          backgroundColor: "rgba(167, 139, 250, 0.05)",
          borderWidth: 2,
          pointBackgroundColor: "#a78bfa",
          pointBorderColor: "#120a07",
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.3,
        },
        {
          label: "Estrés",
          data: data.map((d) => d.stress),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.05)",
          borderWidth: 2,
          pointBackgroundColor: "#f59e0b",
          pointBorderColor: "#120a07",
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false,
          tension: 0.3,
        },
      ];

  /* TIPADO DIRECTO CON ChartOptions — elimina el conflicto */
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#8a7060",
          font: { family: "Sora", size: 11 },
          boxWidth: 12,
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "#1f1008",
        borderColor: "#3d2418",
        borderWidth: 1,
        titleColor: "#f0ebe8",
        bodyColor: "#8a7060",
        titleFont: { family: "Sora", size: 12, weight: "bold" },
        bodyFont: { family: "Sora", size: 11 },
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label}: ${ctx.parsed.y ?? "—"} / 10`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "#1f1008" },
        ticks: {
          color: "#8a7060",
          font: { family: "Sora", size: 10 },
          maxRotation: 0,
        },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 10,
        grid: { color: "#1f1008" },
        ticks: {
          color: "#8a7060",
          font: { family: "Sora", size: 10 },
          stepSize: 2,
        },
        border: { display: false },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  return (
    <Line
      data={{ labels, datasets }}
      options={options}
    />
  );
}