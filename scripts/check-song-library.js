const fs = require('fs');
const path = require('path');
const { normalizeSongIdentityKey, isSameSong } = require('../artist-match');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');

function isValidArtist(artist) {
  if (!artist || !String(artist).trim()) return false;
  return !String(artist).includes('来源处未提供标准格式歌手');
}

function getUniqueSongCount(data) {
  if (!Array.isArray(data) || data.length === 0) return 0;
  const titleGroup = new Map();
  data.forEach(song => {
    const titleKey = normalizeSongIdentityKey(song);
    if (!titleGroup.has(titleKey)) {
      titleGroup.set(titleKey, []);
    }
    titleGroup.get(titleKey).push(song);
  });

  let totalUnique = 0;
  titleGroup.forEach(group => {
    if (group.length === 1) {
      totalUnique += 1;
      return;
    }
    const uniqueSongs = [];
    group.forEach(currentSong => {
      const isDuplicate = uniqueSongs.some(savedSong => isSameSong(currentSong, savedSong, isValidArtist));
      if (!isDuplicate) uniqueSongs.push(currentSong);
    });
    totalUnique += uniqueSongs.length;
  });
  return totalUnique;
}

function loadSongs() {
  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const files = Array.isArray(indexData.files) ? indexData.files : [];
  const songs = [];

  files.forEach(fileName => {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) return;
    const jsContent = fs.readFileSync(filePath, 'utf8');
    const fakeWindow = { SONG_DATA: [] };
    try {
      const run = new Function('window', jsContent);
      run(fakeWindow);
      fakeWindow.SONG_DATA.forEach(song => {
        songs.push({
          ...song,
          source: fileName
        });
      });
    } catch (error) {
      console.warn(`[warn] 读取 ${fileName} 失败: ${error.message}`);
    }
  });

  return {
    files,
    songs
  };
}

function main() {
  const { files, songs } = loadSongs();
  const totalSongs = songs.length;
  const uniqueSongs = getUniqueSongCount(songs);
  const missingArtistSongs = songs.filter(song => !isValidArtist(song.artist)).length;
  const result = {
    files: files.length,
    totalSongs,
    uniqueSongs,
    missingArtistSongs,
    generatedAt: new Date().toISOString()
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('[Song Library Check]');
  console.log(`files=${result.files}`);
  console.log(`totalSongs=${result.totalSongs}`);
  console.log(`uniqueSongs=${result.uniqueSongs}`);
  console.log(`missingArtistSongs=${result.missingArtistSongs}`);
  console.log(`generatedAt=${result.generatedAt}`);
}

main();
