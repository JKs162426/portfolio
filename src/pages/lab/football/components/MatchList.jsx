import { useRef } from "react";
import MatchCard from "./MatchCard";
import Pagination from "./Pagination";
import { paginate } from "../lib/utils";

const PAGE_SIZE = 10;

export default function MatchList({ matches, page, onPageChange, onOpen, teamId, showDate }) {
  const listRef = useRef(null);
  const current = paginate(matches, page, PAGE_SIZE);

  function changePage(next) {
    onPageChange(next);
    // Al cambiar de página, volver al inicio de la lista (no de la página)
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="fb-match-list-wrap" ref={listRef}>
      <ul className="fb-match-list">
        {current.items.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onOpen={onOpen}
            teamId={teamId}
            showDate={showDate}
          />
        ))}
      </ul>
      <Pagination page={current.page} pageCount={current.pageCount} onChange={changePage} />
    </div>
  );
}
