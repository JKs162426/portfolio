import { useFootball } from "./footballContext";
import { LEAGUES } from "./leagues";

export default function LeagueSelect({ value, onChange }) {
  const { t, lang } = useFootball();

  return (
    <div className="fb-leagues" role="group" aria-label={t.leagues.label}>
      {LEAGUES.map((league) => (
        <button
          key={league.code}
          type="button"
          className={`fb-league ${value === league.code ? "active" : ""}`}
          aria-pressed={value === league.code}
          onClick={() => value !== league.code && onChange(league.code)}
          title={`${league.name} · ${league.country[lang]}`}
        >
          <span className="fb-league-emblem" aria-hidden="true">
            <img src={league.emblem} alt="" width="22" height="22" loading="lazy" decoding="async" />
          </span>
          <span>{league.name}</span>
        </button>
      ))}
    </div>
  );
}
