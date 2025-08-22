module.exports = async (req, res) => {
  const missing = [];
  ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN", "BASE_URL"].forEach(k => {
    if (!process.env[k]) missing.push(k);
  });

  const info = { missingEnv: missing, baseUrl: process.env.BASE_URL };

  // Try to exchange the refresh token to catch auth issues clearly
  if (!missing.length) {
    try {
      const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
      const r = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basic}`
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: process.env.SPOTIFY_REFRESH_TOKEN
        })
      });
      const data = await r.json();
      info.tokenStatus = r.status;
      info.tokenBody = data;
    } catch (e) {
      info.tokenError = String(e);
    }
  }

  res.status(200).json(info);
};
