import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SkillGapChart = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-gray-500">No data available</p>;

  // Color mapping: High gap (>66) = red, Medium (33-66) = amber, Low (<33) = emerald
  const getBarColor = (gapScore) => {
    if (gapScore > 66) return '#ef4444'; // red-500
    if (gapScore > 33) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
        <XAxis dataKey="topic" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value) => [`${value}%`, 'Gap Score']}
        />
        <Bar dataKey="gapScore" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.gapScore)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SkillGapChart;
