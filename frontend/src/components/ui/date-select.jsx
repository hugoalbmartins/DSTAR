import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";

export function DateSelect({ value, onChange, className, placeholder = "Selecionar data" }) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (value && value instanceof Date && !isNaN(value.getTime())) {
      setDay(value.getDate().toString().padStart(2, "0"));
      setMonth((value.getMonth() + 1).toString().padStart(2, "0"));
      setYear(value.getFullYear().toString());
    } else {
      setDay("");
      setMonth("");
      setYear("");
    }
  }, [value]);

  const getDaysInMonth = (month, year) => {
    if (!month || !year) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  const handleDayChange = (newDay) => {
    setDay(newDay);
    if (month && year) {
      const maxDays = getDaysInMonth(month, year);
      const validDay = Math.min(parseInt(newDay), maxDays);
      const date = new Date(parseInt(year), parseInt(month) - 1, validDay);
      if (!isNaN(date.getTime())) {
        onChange?.(date);
      }
    }
  };

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth);
    if (day && year) {
      const maxDays = getDaysInMonth(newMonth, year);
      const validDay = Math.min(parseInt(day), maxDays);
      const date = new Date(parseInt(year), parseInt(newMonth) - 1, validDay);
      if (!isNaN(date.getTime())) {
        onChange?.(date);
      }
    }
  };

  const handleYearChange = (newYear) => {
    setYear(newYear);
    if (day && month) {
      const maxDays = getDaysInMonth(month, newYear);
      const validDay = Math.min(parseInt(day), maxDays);
      const date = new Date(parseInt(newYear), parseInt(month) - 1, validDay);
      if (!isNaN(date.getTime())) {
        onChange?.(date);
      }
    }
  };

  const handleClear = () => {
    setDay("");
    setMonth("");
    setYear("");
    onChange?.(null);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const months = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Março" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const maxDays = getDaysInMonth(month, year);
  const days = Array.from({ length: maxDays }, (_, i) => {
    const d = (i + 1).toString().padStart(2, "0");
    return { value: d, label: d };
  });

  const isComplete = day && month && year;
  const displayValue = isComplete
    ? `${day}/${month}/${year}`
    : placeholder;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 p-3 rounded-md border border-slate-200 bg-white hover:border-slate-300 transition-colors">
        <CalendarIcon className="h-4 w-4 text-[#c8f31d] flex-shrink-0" />
        <div className="flex-1 flex items-center gap-2">
          <Select value={day} onValueChange={handleDayChange}>
            <SelectTrigger className="h-8 border-slate-200 bg-white text-slate-900 w-[80px] px-2">
              <SelectValue placeholder="Dia" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 max-h-60">
              {days.map((d) => (
                <SelectItem
                  key={d.value}
                  value={d.value}
                  className="text-white hover:bg-white/10"
                >
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={month} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-8 border-slate-200 bg-white text-slate-900 flex-1 px-2">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 max-h-60">
              {months.map((m) => (
                <SelectItem
                  key={m.value}
                  value={m.value}
                  className="text-white hover:bg-white/10"
                >
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 border-slate-200 bg-white text-slate-900 w-[100px] px-2">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 max-h-60">
              {years.map((y) => (
                <SelectItem
                  key={y}
                  value={y.toString()}
                  className="text-white hover:bg-white/10"
                >
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isComplete && (
          <button
            type="button"
            onClick={handleClear}
            className="text-white/50 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        )}
      </div>
      {isComplete && (
        <p className="text-white/50 text-xs mt-1">
          {displayValue}
        </p>
      )}
    </div>
  );
}
