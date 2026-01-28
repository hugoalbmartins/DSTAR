import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState, useMemo } from "react";
import { ModernButton } from "./ModernButton";

export const ModernTable = ({
  data = [],
  columns = [],
  sortable = true,
  hoverable = true,
  striped = false,
  className = "",
  onRowClick,
  itemsPerPage = 15,
  showPagination = true,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = showPagination ? sortedData.slice(startIndex, endIndex) : sortedData;

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

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
          {paginatedData.map((row, rowIndex) => (
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
      {showPagination && totalPages > 1 && (
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200/60 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Mostrando <span className="font-semibold">{startIndex + 1}</span> a{' '}
            <span className="font-semibold">{Math.min(endIndex, sortedData.length)}</span> de{' '}
            <span className="font-semibold">{sortedData.length}</span> resultados
          </div>
          <div className="flex items-center gap-1">
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              icon={ChevronsLeft}
              className="h-8 w-8 p-0"
            />
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              icon={ChevronLeft}
              className="h-8 w-8 p-0"
            />
            <div className="px-3 py-1 text-sm font-medium text-slate-700">
              Página {currentPage} de {totalPages}
            </div>
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              icon={ChevronRight}
              className="h-8 w-8 p-0"
            />
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              icon={ChevronsRight}
              className="h-8 w-8 p-0"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernTable;
