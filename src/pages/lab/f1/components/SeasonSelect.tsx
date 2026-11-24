import { useId } from "react";
import { useF1 } from "../context/f1Context";
import { seasonOptions } from "../lib/seasons";

export default function SeasonSelect({ onChange }: { onChange: (season: number) => void }) {
  const { t, season } = useF1();
  const id = useId();
  return (
    <div className="f1-season">
      <label htmlFor={id}>{t.season}</label>
      <select id={id} value={season} onChange={(e) => onChange(Number(e.target.value))}>
        {seasonOptions().map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
