export default async function handler(req, res) {
  const code = req.query.code;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = `${process.env.BASE_URL}/api/callback`;

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok) {
    return res
      .status(400)
      .send(`<pre>Token exchange failed:\n${JSON.stringify(data, null, 2)}</pre>`);
  }

  // Show the refresh token in the browser so you can copy it into Vercel
  res
    .status(200)
    .send(`<pre>SPOTIFY_REFRESH_TOKEN = ${data.refresh_token || "NOT RETURNED"}\n\nCopy this value into Vercel → Project Settings → Environment Variables → Add → SPOTIFY_REFRESH_TOKEN, then redeploy.</pre>`);
}
