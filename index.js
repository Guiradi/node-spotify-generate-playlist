const fs = require('fs');
const readline = require('readline');

const {google} = require('googleapis');
const youtubedl = require('youtube-dl');

const SCOPES = 'https://www.googleapis.com/auth/youtube';
const TOKEN_PATH = 'token.json';

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// Passos:

// Youtube Login
function youtubeLogin() {
  fs.readFile('client_secret.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content), fetchPlaylistVideos);
  });
}

// Escolher a lista de vídeos para ser transformada e pegar os vídeos (infos)
async function fetchPlaylistVideos(auth) {
  try {
    const youtube = google.youtube('v3');
    const { data: { items = [] } = {} } = await youtube.playlistItems.list({
      auth,
      part: 'id,snippet,contentDetails,status',
      playlistId: 'PLsEAJsDdJyviPM-Yj48UlYt6RiSpTw6LB',
      maxResults: 50
    });

    const youtubePlaylist = items.map(item => ({
        videoTitle: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`
      }));

    youtubedl.getInfo(youtubePlaylist.map(({url}) => url), (err, info) => {
      if (err) console.log(err);
      const allVideosInfo = info.map(({ track, artist }) => ({ track, artist }));
      const allSongsInfo = allVideosInfo.filter(song => !!song.track);

      saveSongsInfo(allSongsInfo);
    });

  } catch (error) {
    console.error(error);
  }
}

// Salva as infos
function saveSongsInfo(songsInfo) {
  console.log(songsInfo);
}

// Criar uma nova playlist no Spotify
// Procurar as músicas no Spotify
// Adicionar as músicas encontradas à playlist

youtubeLogin()