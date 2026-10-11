import React, { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatKg, linearScale, niceTicks, timeTickFormatter, timeTicks } from "../utils/chart";
import { calendarDay, formatDate } from "../utils/format";

const HEIGHT = 220;
const MARGIN = { top: 16, right: 64, bottom: 30, left: 48 };

// Kapsayıcının genişliğini izler; SVG metinleri ölçeklenmeden net kalsın diye viewBox yerine gerçek genişlik.
// İlk genişlik ekran çizilmeden önce doğrudan okunur (ilk karede yanlış boyut ve zıplama olmasın);
// ResizeObserver yalnızca sonraki boyut değişikliklerini izler.
const useElementWidth = (fallback = 600) => {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (el.clientWidth) setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
};

// Kilo geçmişinin zaman içindeki değişimi: tek seri çizgi + hafif alan dolgusu.
// Fare ile en yakın ölçüm, klavyede ok tuşlarıyla ölçümler arasında gezilir.
// Tüm değerler grafiğin altındaki kayıt listesinde de yer alır (grafik bilgiye tek yol değildir).
const WeightChart = ({ records = [] }) => {
  const [frameRef, width] = useElementWidth();
  const [active, setActive] = useState(null); // etkin ölçümün sırası
  const captionId = useId();

  const points = useMemo(
    () =>
      records
        .map((r) => ({ t: calendarDay(r.date)?.getTime() ?? NaN, weight: Number(r.weight), date: r.date }))
        .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.weight))
        .sort((a, b) => a.t - b.t),
    [records]
  );

  if (points.length < 2) return null;

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 80);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const weights = points.map((p) => p.weight);
  const yTicks = niceTicks(Math.min(...weights), Math.max(...weights));
  const x = linearScale([points[0].t, points.at(-1).t], [MARGIN.left, MARGIN.left + innerWidth]);
  const y = linearScale([yTicks[0], yTicks.at(-1)], [MARGIN.top + innerHeight, MARGIN.top]);
  const xTicks = timeTicks(points.map((p) => p.t));
  const formatTick = timeTickFormatter(points.map((p) => p.t));

  const linePath = points.map((p, i) => `${i ? "L" : "M"}${x(p.t)},${y(p.weight)}`).join(" ");
  const baseline = MARGIN.top + innerHeight;
  const areaPath = `${linePath} L${x(points.at(-1).t)},${baseline} L${x(points[0].t)},${baseline} Z`;

  const first = points[0];
  const last = points.at(-1);
  const change = Math.round((last.weight - first.weight) * 100) / 100;
  const changeText =
    change === 0 ? "değişim yok" : `${change > 0 ? "+" : "−"}${formatKg(Math.abs(change))}`;

  const activePoint = active === null ? null : points[active];

  const nearestIndex = (clientX) => {
    const rect = frameRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(x(p.t) - px) < Math.abs(x(points[best].t) - px)) best = i;
    });
    return best;
  };

  const onKeyDown = (e) => {
    const lastIndex = points.length - 1;
    const current = active ?? lastIndex;
    const next = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: lastIndex }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setActive(Math.min(Math.max(next, 0), lastIndex));
  };

  // İpucu kutusu sağ kenara taşmasın
  const tooltipLeft = activePoint ? x(activePoint.t) : 0;
  const flip = tooltipLeft > width - 140;

  return (
    <figure className="weight-chart">
      <figcaption id={captionId} className="chart-caption">
        {points.length} ölçüm · {formatDate(first.date)} – {formatDate(last.date)} ·{" "}
        <strong>{changeText}</strong>
      </figcaption>
      <div
        ref={frameRef}
        className="chart-frame"
        tabIndex={0}
        role="group"
        aria-label="Kilo grafiği. Ölçümler arasında ok tuşlarıyla gezinebilirsiniz; tüm değerler aşağıdaki listede."
        aria-describedby={captionId}
        onPointerMove={(e) => setActive(nearestIndex(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive((a) => a ?? points.length - 1)}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
      >
        <svg width={width} height={HEIGHT} aria-hidden="true" focusable="false">
          {/* Izgara ve y ekseni */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line className="chart-grid" x1={MARGIN.left} x2={MARGIN.left + innerWidth} y1={y(tick)} y2={y(tick)} />
              <text className="chart-axis-label" x={MARGIN.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                {new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(tick)}
              </text>
            </g>
          ))}
          {/* x ekseni (tarihler) */}
          {xTicks.map((tick, i) => (
            <text
              key={tick}
              className="chart-axis-label"
              x={x(tick)}
              y={baseline + 20}
              textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
            >
              {formatTick(tick)}
            </text>
          ))}

          <path className="chart-area" d={areaPath} />
          <path className="chart-line" d={linePath} />

          {activePoint && (
            <line
              className="chart-crosshair"
              x1={x(activePoint.t)}
              x2={x(activePoint.t)}
              y1={MARGIN.top}
              y2={baseline}
            />
          )}

          {points.map((p, i) => (
            <circle
              key={`${p.t}-${i}`}
              className={`chart-dot ${i === active ? "is-active" : ""}`}
              cx={x(p.t)}
              cy={y(p.weight)}
              r={i === active ? 6 : 4}
            />
          ))}

          {/* Yalnızca son değer etiketlenir; diğerleri ipucu ve listede */}
          <text className="chart-end-label" x={x(last.t) + 10} y={y(last.weight)} dy="0.32em">
            {formatKg(last.weight)}
          </text>
        </svg>

        {activePoint && (
          <div
            className={`chart-tooltip ${flip ? "is-flipped" : ""}`}
            style={{ left: tooltipLeft, top: y(activePoint.weight) }}
            aria-hidden="true"
          >
            <strong>{formatKg(activePoint.weight)}</strong>
            <span>{formatDate(activePoint.date)}</span>
          </div>
        )}
      </div>
      {/* Klavyeyle gezinirken ekran okuyucuya etkin ölçümü bildir */}
      <p className="visually-hidden" aria-live="polite">
        {activePoint ? `${formatKg(activePoint.weight)}, ${formatDate(activePoint.date)}` : ""}
      </p>
    </figure>
  );
};

export default WeightChart;
