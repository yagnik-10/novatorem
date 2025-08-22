// Minimal /api/spotify endpoint for Vercel (Node 18+)
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";

async function getAccessToken() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error("Missing env: SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REFRESH_TOKEN");
  }

  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Token error: ${res.status} ${JSON.stringify(data)}`);
  return data.access_token;
}

function svg({ title, artist, album, url }) {
  // simple, clean SVG card (dark by default)
  const T = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const line2 = artist ? `by ${artist}` : "Nothing playing";
  return `
<svg width="500" height="120" xmlns="http://www.w3.org/2000/svg" role="img">
  <rect width="100%" height="100%" fill="#0d1117" rx="12"></rect>
  <text x="24" y="42" fill="#c9d1d9" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="18" font-weight="700">
    ${T(title || "Not playing on Spotify")}
  </text>
  <text x="24" y="72" fill="#8b949e" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="14">
    ${T(line2)}
  </text>
  ${url ? `<a href="${T(url)}" target="_blank"><text x="24" y="98" fill="#58a6ff" font-size="13">Open in Spotify</text></a>` : ""}
</svg>`.trim();
}

export default async function handler(req, res) {
  try {
    const access_token = await getAccessToken();

    const r = await fetch(NOW_PLAYING_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // 204 = no content (nothing playing)
    if (r.status === 204) {
      res.setHeader("Content-Type", "image/svg+xml");
      return res.status(200).send(svg({}));
    }

    const data = await r.json();

    // if you want raw JSON for debugging: /api/spotify?raw=true
    if (req.query.raw === "true") {
      return res.status(r.ok ? 200 : r.status).json(data);
    }

    let title, artist, album, url;
    if (data && data.item) {
      title = data.item.name;
      album = data.item.album?.name;
      artist = (data.item.artists || []).map(a => a.name).join(", ");
      url = data.item.external_urls?.spotify;
    }

    res.setHeader("Content-Type", "image/svg+xml");
    return res.status(200).send(svg({ title, artist, album, url }));
  } catch (err) {
    // show a simple error SVG instead of 500 HTML
    res.setHeader("Content-Type", "image/svg+xml");
    return res
      .status(200)
      .send(
        `<svg width="500" height="120" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0d1117" rx="12"/><text x="24" y="64" fill="#ff7b72" font-size="14" font-family="ui-sans-serif, system-ui">Error: ${String(
          err.message || err
        ).replace(/</g, "&lt;")}</text></svg>`
      );
  }
}
