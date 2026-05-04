"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartPoint {
  mes: string;
  total: number;
}

export default function EleitoresChart({ data }: { data: ChartPoint[] }) {
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-44 text-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-slate-700/40 flex items-center justify-center">
          <span className="text-slate-500 text-lg">📊</span>
        </div>
        <p className="text-sm text-slate-500">Nenhum eleitor cadastrado ainda.</p>
        <p className="text-xs text-slate-600">Os dados aparecerão aqui conforme você cadastrar eleitores.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
        <XAxis
          dataKey="mes"
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(59,130,246,0.08)" }}
          contentStyle={{
            background: "#1E293B",
            border: "1px solid #1E3A5F",
            borderRadius: "8px",
            fontSize: 12,
          }}
          labelStyle={{ color: "#94a3b8" }}
          itemStyle={{ color: "#10B981" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => [typeof v === "number" ? v : 0, "eleitores"]}
        />
        <Bar dataKey="total" fill="url(#barGrad)" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill="url(#barGrad)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
