import { memo, useState } from "react";

// Escudo con carga diferida; si la imagen falla se muestran las siglas
function TeamCrest({ team, size = 28 }) {
  const [failed, setFailed] = useState(false);

  if (!team?.crest || failed) {
    return (
      <span className="fb-crest fb-crest-fallback" style={{ width: size, height: size }} aria-hidden="true">
        {team?.tla?.slice(0, 3) || "?"}
      </span>
    );
  }

  return (
    <img
      className="fb-crest"
      src={team.crest}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default memo(TeamCrest);
