import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-[#172B4D] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const SalesLineChart = React.memo(({ data, title = "Evolução de Vendas" }) => {
  return (
    <Card className="card-leiritrix">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#172B4D]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
            <XAxis
              dataKey="name"
              stroke="#42526E"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#42526E"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
            />
            <Line
              type="monotone"
              dataKey="vendas"
              stroke="#0052CC"
              strokeWidth={3}
              dot={{ fill: '#0052CC', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7 }}
              name="Vendas"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

SalesLineChart.displayName = 'SalesLineChart';

export const SalesBarChart = React.memo(({ data, title = "Vendas por Operadora" }) => {
  return (
    <Card className="card-leiritrix">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#172B4D]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
            <XAxis
              dataKey="name"
              stroke="#42526E"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#42526E"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
            />
            <Bar
              dataKey="vendas"
              fill="#0052CC"
              radius={[8, 8, 0, 0]}
              name="Vendas"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
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
