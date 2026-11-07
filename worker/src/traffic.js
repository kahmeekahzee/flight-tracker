// Live aircraft around Changi from community ADS-B feeds (no key needed).

const CHANGI = { lat: 1.3644, lon: 103.9915 };
const RADIUS_NM = 25;

const SOURCES = [
  { name: "adsb.lol", url: `https://api.adsb.lol/v2/lat/${CHANGI.lat}/lon/${CHANGI.lon}/dist/${RADIUS_NM}` },
  { name: "adsb.fi", url: `https://opendata.adsb.fi/api/v2/lat/${CHANGI.lat}/lon/${CHANGI.lon}/dist/${RADIUS_NM}` },
];

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

function compact(a) {
  return {
    hex: a.hex,
    cs: typeof a.flight === "string" ? a.flight.trim() || null : null,
    reg: a.r || null,
    t: a.t || null,
    lat: a.lat,
    lon: a.lon,
    alt: a.alt_baro === "ground" ? 0 : num(a.alt_baro),
    gnd: a.alt_baro === "ground",
    gs: num(a.gs),
    trk: num(a.track) ?? num(a.true_heading),
  };
}

/** Returns { source, ac: [...] }. Tries each source in turn. */
export async function fetchTraffic() {
  let lastErr;
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: { Accept: "application/json", "User-Agent": "changi-board/1.0" },
        cf: { cacheTtl: 5 },
      });
      if (!res.ok) throw new Error(`${src.name} HTTP ${res.status}`);
      const body = await res.json();
      const ac = (body.ac || body.aircraft || [])
        .filter((a) => typeof a.lat === "number" && typeof a.lon === "number")
        .map(compact);
      return { source: src.name, ac };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("No traffic source available");
}
