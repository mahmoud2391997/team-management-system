'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#6b7280', '#3b82f6', '#eab308', '#22c55e']

interface TaskStatusChartProps {
  todo: number
  inProgress: number
  review: number
  completed: number
}

export default function TaskStatusChart({ todo, inProgress, review, completed }: TaskStatusChartProps) {
  const data = [
    { name: 'To Do', value: todo },
    { name: 'In Progress', value: inProgress },
    { name: 'Review', value: review },
    { name: 'Completed', value: completed },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No tasks yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
