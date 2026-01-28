import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl p-4"
      >
        <p className="font-bold text-slate-900 mb-2 text-sm">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

export const SalesLineChart = React.memo(({ data, title = "Evolução de Vendas" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="card-leiritrix overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30">
          <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                style={{ fontSize: '12px', fontWeight: 500 }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px', fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '14px', paddingTop: '20px', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="vendas"
                stroke="#0066e6"
                strokeWidth={3}
                dot={{ fill: '#0066e6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
                name="Vendas"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
});

SalesLineChart.displayName = 'SalesLineChart';

export const SalesBarChart = React.memo(({ data, title = "Vendas por Operadora" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="card-leiritrix overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/30">
          <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                style={{ fontSize: '12px', fontWeight: 500 }}
              />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: '12px', fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '14px', paddingTop: '20px', fontWeight: 600 }}
              />
              <Bar
                dataKey="vendas"
                fill="url(#barGradient)"
                radius={[10, 10, 0, 0]}
                name="Vendas"
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0066e6" stopOpacity={1} />
                  <stop offset="100%" stopColor="#003d8a" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
});

SalesBarChart.displayName = 'SalesBarChart';

export const ConversionFunnelChart = React.memo(({ data, title = "Funil de Conversão" }) => {
  return (
    <Card className="card-leiritrix">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#172B4D]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
            <XAxis
              type="number"
              stroke="#42526E"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#42526E"
              style={{ fontSize: '12px' }}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill="#0052CC"
              radius={[0, 8, 8, 0]}
              name="Quantidade"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

ConversionFunnelChart.displayName = 'ConversionFunnelChart';
