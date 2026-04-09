"use client"

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UsageChartsProps {
  data: { month: string; days: number; cylinders: number }[]
}

const daysChartConfig = {
  days: {
    label: "Days per Cylinder",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const cylindersChartConfig = {
  cylinders: {
    label: "Cylinders Used",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function UsageCharts({ data }: UsageChartsProps) {
  if (data.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-lift glass-card">
          <CardHeader>
            <CardTitle>Days per Cylinder</CardTitle>
            <CardDescription>Track how long each cylinder lasts</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No data yet. Add your first usage record.</p>
          </CardContent>
        </Card>
        <Card className="card-lift glass-card">
          <CardHeader>
            <CardTitle>Monthly Cylinders Used</CardTitle>
            <CardDescription>Number of cylinders per month</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No data yet. Add your first usage record.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="card-lift glass-card">
        <CardHeader>
          <CardTitle>Days per Cylinder</CardTitle>
          <CardDescription>Track how long each cylinder lasts</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={daysChartConfig} className="h-[200px] w-full">
            <LineChart data={data} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="days"
                stroke="var(--color-days)"
                strokeWidth={2}
                dot={{ fill: "var(--color-days)", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="card-lift glass-card">
        <CardHeader>
          <CardTitle>Monthly Cylinders Used</CardTitle>
          <CardDescription>Number of cylinders per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cylindersChartConfig} className="h-[200px] w-full">
            <BarChart data={data} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="cylinders"
                fill="var(--color-cylinders)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
