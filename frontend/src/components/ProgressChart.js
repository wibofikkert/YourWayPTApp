import React from 'react'
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
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function ProgressChart({ data, exerciseName, metric = 'max_weight' }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        Nog geen data beschikbaar
      </div>
    )
  }

  const metricLabels = {
    max_weight: 'Max gewicht (kg)',
    max_reps: 'Max reps',
    total_volume: 'Totaal volume (kg)',
  }

  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
    }),
    datasets: [
      {
        label: metricLabels[metric] || metric,
        data: data.map(d => d[metric]),
        borderColor: '#063854',
        backgroundColor: 'rgba(6, 56, 84, 0.08)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#063854',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterLabel: (ctx) => {
            const point = data[ctx.dataIndex]
            const lines = []
            if (metric === 'max_weight') lines.push(`Max reps: ${point.max_reps}`)
            if (point.avg_rpe) lines.push(`Gem. RPE: ${point.avg_rpe}`)
            lines.push(`Sets: ${point.total_sets}`)
            return lines
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: metricLabels[metric] || metric },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  }

  return (
    <div style={{ height: 300 }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
