// Função Netlify: junta os calendários iCal (Uniplaces/Spotahome/Google Calendar)
// e devolve as datas ocupadas em JSON para o calendário do site.
//
// Configure no painel Netlify > Site configuration > Environment variables:
//   ICAL_URLS = link1.ics,link2.ics,...   (separados por vírgula)
//
// Resposta: { updatedAt: ISO, busy: [{ start: "YYYY-MM-DD", end: "YYYY-MM-DD", source }] }
// "end" é exclusivo (dia de saída, livre para nova entrada).

const pad = n => String(n).padStart(2, "0");

function toYmd(raw) {
  // aceita 20261219, 20261219T140000Z, 20261219T140000
  const m = raw.match(/(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
function addDay(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function parseIcs(text, source) {
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const events = [];
  for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const body = block.split("END:VEVENT")[0];
    const get = key => {
      const line = body.split(/\r?\n/).find(l => l.startsWith(key + ":") || l.startsWith(key + ";"));
      return line ? line.slice(line.indexOf(":") + 1).trim() : null;
    };
    if ((get("STATUS") || "").toUpperCase() === "CANCELLED") continue;
    if ((get("TRANSP") || "").toUpperCase() === "TRANSPARENT") continue;
    const start = get("DTSTART") && toYmd(get("DTSTART"));
    let end = get("DTEND") && toYmd(get("DTEND"));
    if (!start) continue;
    if (!end || end <= start) end = addDay(start);
    events.push({ start, end, source });
  }
  return events;
}

function merge(ranges) {
  const s = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  const out = [];
  for (const r of s) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end;
      if (!last.source.includes(r.source)) last.source += " + " + r.source;
    } else out.push({ ...r });
  }
  return out;
}

function sourceName(url) {
  if (/uniplaces/i.test(url)) return "Uniplaces";
  if (/spotahome/i.test(url)) return "Spotahome";
  if (/google/i.test(url)) return "Calendário principal";
  return "Calendário";
}

export default async () => {
  const urls = (process.env.ICAL_URLS || "").split(",").map(s => s.trim()).filter(Boolean);
  const all = [];
  const errors = [];
  await Promise.all(urls.map(async url => {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "ApeLisboa72-site" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      all.push(...parseIcs(await r.text(), sourceName(url)));
    } catch (e) { errors.push(sourceName(url) + ": " + e.message); }
  }));

  if (!urls.length || errors.length === urls.length) {
    // sem calendários válidos: deixa o site usar availability.json
    return new Response(JSON.stringify({ error: "no-calendars", errors }), {
      status: 503, headers: { "content-type": "application/json" }
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const busy = merge(all).filter(r => r.end > today);
  return new Response(JSON.stringify({ updatedAt: new Date().toISOString(), busy, errors }), {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=0, s-maxage=900" // cache de 15 min na CDN
    }
  });
};

export const config = { path: "/api/availability" };
