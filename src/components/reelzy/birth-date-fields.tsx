import { useEffect, useMemo, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function daysInMonth(year: number, month: number) {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

const selectClass =
  "h-12 w-full touch-manipulation appearance-none rounded-xl border border-border bg-surface-raised px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Day / month / year pickers. Far faster than a native calendar on Android,
 * where scrolling back 30 years one month at a time is painful.
 */
export function BirthDateFields({
  value,
  onChange,
}: {
  value: string;
  onChange: (isoDate: string) => void;
}) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!m) return;
    setYear(m[1] ?? "");
    setMonth(String(Number(m[2])));
    setDay(String(Number(m[3])));
  }, [value]);

  const thisYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 100 }, (_, i) => thisYear - 13 - i),
    [thisYear],
  );
  const days = useMemo(
    () => Array.from({ length: daysInMonth(Number(year), Number(month)) }, (_, i) => i + 1),
    [year, month],
  );

  function push(nextDay: string, nextMonth: string, nextYear: string) {
    if (!nextDay || !nextMonth || !nextYear) {
      onChange("");
      return;
    }
    onChange(
      `${nextYear}-${String(Number(nextMonth)).padStart(2, "0")}-${String(Number(nextDay)).padStart(2, "0")}`,
    );
  }

  return (
    <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
      <select
        aria-label="Day"
        value={day}
        onChange={(e) => {
          setDay(e.target.value);
          push(e.target.value, month, year);
        }}
        className={selectClass}
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select
        aria-label="Month"
        value={month}
        onChange={(e) => {
          setMonth(e.target.value);
          push(day, e.target.value, year);
        }}
        className={selectClass}
      >
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        aria-label="Year"
        value={year}
        onChange={(e) => {
          setYear(e.target.value);
          push(day, month, e.target.value);
        }}
        className={selectClass}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
