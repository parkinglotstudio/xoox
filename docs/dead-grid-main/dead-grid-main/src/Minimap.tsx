import type { Game } from "./engine";
import { FOG_SIZE, FOG_MIN, FOG_CELL } from "./terrain";
import { rescueMapMarker } from "./rescue";
export default function Minimap({ game }: { game: Game }) {
  const size = 140,
    r = 58,
    scale = 1.55,
    rot = (x: number, z: number) => ({
      x: 70 + (x - z) * Math.SQRT1_2 * scale,
      y: 70 + (x + z) * Math.SQRT1_2 * scale,
    });
  return (
    <svg
      className="minimap"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="미니맵: 십자가는 부상 생존자, 가장자리 화살표는 구조 방향, 빨강은 보이는 적, 노랑은 보급"
    >
      <defs>
        <clipPath id="map-mask">
          <circle cx="70" cy="70" r={r} />
        </clipPath>
      </defs>
      <circle
        cx="70"
        cy="70"
        r="65"
        fill="#070b09"
        stroke="#98a48b"
        strokeOpacity=".4"
      />
      <g clipPath="url(#map-mask)">
        <g transform="translate(70 70) rotate(45)">
          {Array.from(game.explored, (value, i) => {
            const x = FOG_MIN + (i % FOG_SIZE) * FOG_CELL - game.player.x;
            const z =
              FOG_MIN + Math.floor(i / FOG_SIZE) * FOG_CELL - game.player.z;
            if (Math.abs(x) > 40 || Math.abs(z) > 40) return null;
            return (
              <rect
                key={i}
                x={x * scale}
                y={z * scale}
                width={FOG_CELL * scale + 0.1}
                height={FOG_CELL * scale + 0.1}
                className="fog-cell"
                fill={
                  game.visible[i] ? "#43594b" : value ? "#1b2c24" : "#070b09"
                }
              />
            );
          })}
          {game.buildings
            .filter((b) => game.hasExplored(b))
            .map((b) => (
              <rect
                key={b.id}
                x={(b.x - b.w / 2 - game.player.x) * scale}
                y={(b.z - b.d / 2 - game.player.z) * scale}
                width={b.w * scale}
                height={b.d * scale}
                fill={b.hp > 0 ? "#718068" : "#594d3e"}
                opacity=".75"
              />
            ))}
        </g>
        {game.enemies
          .filter((e) => game.canSee(e))
          .map((e) => {
            const p = rot(e.x - game.player.x, e.z - game.player.z);
            return (
              <circle
                key={e.id}
                cx={p.x}
                cy={p.y}
                r={e.kind === "boss" ? 4 : 1.7}
                fill={e.kind === "boss" ? "#f5d17d" : "#d98062"}
              />
            );
          })}
        {game.drops
          .filter((d) => d.type !== "xp" && game.canSee(d))
          .map((d) => {
            const p = rot(d.x - game.player.x, d.z - game.player.z);
            return (
              <rect
                key={d.id}
                x={p.x - 2}
                y={p.y - 2}
                width="4"
                height="4"
                fill="#e8bc71"
              />
            );
          })}
      </g>
      {game.survivors
        .filter((s) => s.state === "wounded")
        .map((s) => {
          const p = rescueMapMarker(game.player, s);
          const color = s.healing
            ? "#87d7c0"
            : s.hp < 20
              ? "#f2a15b"
              : "#eee8d3";
          return (
            <g key={s.id} transform={`translate(${p.x} ${p.y})`}>
              <title>{`부상 생존자 ${Math.ceil(s.hp)}% · ${p.distance}m${p.edge ? " · 미니맵 밖" : ""}`}</title>
              <circle r="8" fill="#142525" stroke={color} strokeWidth="1.3" />
              <path d="M-4 0H4M0-4V4" stroke={color} strokeWidth="2" />
              {p.edge && (
                <path
                  d="M8-4L13 0L8 4"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  transform={`rotate(${p.angle})`}
                />
              )}
            </g>
          );
        })}
      <path d="M70 63 L75 76 L70 73 L65 76 Z" fill="#f3ad66" />
      <text x="70" y="13" textAnchor="middle" fill="#adbaa4" fontSize="8">
        N
      </text>
    </svg>
  );
}
