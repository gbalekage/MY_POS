"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import axiosInstance from "@/utils/axiosInstance";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [chartType, setChartType] = React.useState("attendant"); // "attendant" or "item"
  const [chartData, setChartData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    let url = "/report/sales/by-attendant";
    if (chartType === "item") url = "/report/sales/by-item";
    axiosInstance
      .get(url)
      .then((res) => {
        setChartData(res.data.chartData || []);
      })
      .catch(() => setChartData([]))
      .finally(() => setLoading(false));
  }, [chartType]);

  // Chart config for both types
  const chartConfig =
    chartType === "attendant"
      ? {
          key: "attendant",
          value: "total",
          label: "Sales by Attendant",
          color: "hsl(var(--chart-1))",
        }
      : {
          key: "item",
          value: "total",
          label: "Sales by Item",
          color: "hsl(var(--chart-2))",
        };

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>{chartConfig.label}</CardTitle>
        <CardDescription>Total sales for all time</CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={chartType}
            onValueChange={setChartType}
            variant="outline"
            className="flex"
          >
            <ToggleGroupItem value="attendant" className="h-8 px-2.5">
              By Attendant
            </ToggleGroupItem>
            <ToggleGroupItem value="item" className="h-8 px-2.5">
              By Item
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData} layout="vertical">
              <CartesianGrid vertical={false} />
              <XAxis
                type="number"
                dataKey={chartConfig.value}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                dataKey={chartConfig.value}
                name={chartConfig.key}
                type="monotone"
                fill={chartConfig.color}
                stroke={chartConfig.color}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
