"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { CollectionUsageStats, UsageStats } from "@/lib/catalog-usage-stats";
import { useId } from "react";
import { Area, AreaChart } from "recharts";

const catalogChartConfig = {
  collectors: {
    label: "Colecionadores",
    color: "var(--chart-1)",
  },
  collections: {
    label: "Coleções",
    color: "var(--chart-2)",
  },
  profiles: {
    label: "Profiles",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function hasCatalogUsage(usage?: UsageStats | null) {
  return Boolean(
    usage && (usage.collectors > 0 || usage.collections > 0 || usage.profiles > 0),
  );
}

function hasCollectionUsage(usage?: CollectionUsageStats | null) {
  return Boolean(usage && (usage.collectors > 0 || usage.profiles > 0));
}

function UsageLegend({
  items,
}: {
  items: Array<{ key: keyof typeof catalogChartConfig; value: number }>;
}) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span
            className="size-1.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: catalogChartConfig[item.key].color }}
          />
          <span>
            {item.value} {String(catalogChartConfig[item.key].label).toLowerCase()}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CatalogUsageLine({ usage }: { usage?: UsageStats | null }) {
  const reactId = useId().replace(/:/g, "");
  if (!hasCatalogUsage(usage) || !usage) return null;

  const chartData = [
    {
      metric: "Colecionadores",
      collectors: usage.collectors,
      collections: 0,
      profiles: 0,
    },
    {
      metric: "Coleções",
      collectors: 0,
      collections: usage.collections,
      profiles: 0,
    },
    {
      metric: "Profiles",
      collectors: 0,
      collections: 0,
      profiles: usage.profiles,
    },
  ];

  return (
    <div
      className="flex flex-col gap-1.5"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <ChartContainer
        config={catalogChartConfig}
        className="aspect-auto h-14 w-full"
        initialDimension={{ width: 240, height: 56 }}
      >
        <AreaChart data={chartData} margin={{ top: 2, left: 0, right: 0, bottom: 0 }}>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel indicator="dot" />}
          />
          <defs>
            <linearGradient id={`fillCollectors-${reactId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-collectors)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-collectors)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id={`fillCollections-${reactId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-collections)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-collections)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id={`fillProfiles-${reactId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-profiles)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-profiles)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            dataKey="profiles"
            type="natural"
            fill={`url(#fillProfiles-${reactId})`}
            fillOpacity={0.4}
            stroke="var(--color-profiles)"
            strokeWidth={1.5}
            stackId="a"
          />
          <Area
            dataKey="collections"
            type="natural"
            fill={`url(#fillCollections-${reactId})`}
            fillOpacity={0.4}
            stroke="var(--color-collections)"
            strokeWidth={1.5}
            stackId="a"
          />
          <Area
            dataKey="collectors"
            type="natural"
            fill={`url(#fillCollectors-${reactId})`}
            fillOpacity={0.4}
            stroke="var(--color-collectors)"
            strokeWidth={1.5}
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
      <UsageLegend
        items={[
          { key: "collectors", value: usage.collectors },
          { key: "collections", value: usage.collections },
          { key: "profiles", value: usage.profiles },
        ]}
      />
    </div>
  );
}

export function CollectionUsageLine({
  usage,
}: {
  usage?: CollectionUsageStats | null;
}) {
  const reactId = useId().replace(/:/g, "");
  if (!hasCollectionUsage(usage) || !usage) return null;

  const chartData = [
    {
      metric: "Colecionadores",
      collectors: usage.collectors,
      profiles: 0,
    },
    {
      metric: "Profiles",
      collectors: 0,
      profiles: usage.profiles,
    },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <ChartContainer
        config={catalogChartConfig}
        className="aspect-auto h-14 w-full"
        initialDimension={{ width: 240, height: 56 }}
      >
        <AreaChart data={chartData} margin={{ top: 2, left: 0, right: 0, bottom: 0 }}>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel indicator="dot" />}
          />
          <defs>
            <linearGradient id={`fillCollectorsCol-${reactId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-collectors)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-collectors)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id={`fillProfilesCol-${reactId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-profiles)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-profiles)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            dataKey="profiles"
            type="natural"
            fill={`url(#fillProfilesCol-${reactId})`}
            fillOpacity={0.4}
            stroke="var(--color-profiles)"
            strokeWidth={1.5}
            stackId="a"
          />
          <Area
            dataKey="collectors"
            type="natural"
            fill={`url(#fillCollectorsCol-${reactId})`}
            fillOpacity={0.4}
            stroke="var(--color-collectors)"
            strokeWidth={1.5}
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
      <UsageLegend
        items={[
          { key: "collectors", value: usage.collectors },
          { key: "profiles", value: usage.profiles },
        ]}
      />
    </div>
  );
}
