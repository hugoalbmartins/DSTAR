import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useState, useMemo } from "react";

export const ModernTable = ({
  data = [],
  columns = [],
  sortable = true,
  hoverable = true,
  striped = false,
  className = "",
  onRowClick,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronsUpDown size={14} className="opacity-40" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} className="text-brand-600" />
    ) : (
      <ChevronDown size={14} className="text-brand-600" />
    );
  };

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200/60 ${className}`}>
      <table className="w-full">
        <thead className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200/60">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                className={`px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider ${
                  sortable && column.sortable !== false ? "cursor-pointer select-none hover:bg-brand-50/50" : ""
                }`}
                onClick={() => column.sortable !== false && handleSort(column.key)}
                style={{ width: column.width }}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {sortable && column.sortable !== false && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200/60">
          {sortedData.map((row, rowIndex) => (
            <motion.tr
              key={row.id || rowIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rowIndex * 0.02 }}
              className={`
                ${striped && rowIndex % 2 === 1 ? "bg-slate-50/30" : ""}
                ${hoverable ? "hover:bg-brand-50/30 cursor-pointer" : ""}
                ${onRowClick ? "cursor-pointer" : ""}
                transition-colors duration-150
              `}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column, colIndex) => (
                <td key={column.key || colIndex} className="px-4 py-3 text-sm text-slate-700">
                  {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
      {sortedData.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          <p className="text-sm">Nenhum resultado encontrado</p>
        </div>
      )}
    </div>
  );
};

export default ModernTable;
