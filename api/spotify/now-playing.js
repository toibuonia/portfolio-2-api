export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

  try {
    const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: SPOTIFY_REFRESH_TOKEN
      })
    });

    const { access_token } = await tokenResponse.json();

    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (response.status === 204 || response.status > 400) {
      return res.status(200).json({ isPlaying: false });
    }

    const song = await response.json();
    
    if (!song.item) {
      return res.status(200).json({ isPlaying: false });
    }

    res.status(200).json({
      isPlaying: song.is_playing,
      name: song.item.name,
      artist: song.item.artists.map(a => a.name).join(', '),
      album: song.item.album.name,
      albumArt: song.item.album.images[0]?.url,
      songUrl: song.item.external_urls.spotify
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
