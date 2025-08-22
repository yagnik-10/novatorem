export default function handler(req, res) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = `${process.env.BASE_URL}/api/callback`;
  const scopes = [
    "user-read-currently-playing",
    "user-read-playback-state",
  ].join("%20");

  const url =
    `https://accounts.spotify.com/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&scope=${scopes}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.redirect(url);
}
