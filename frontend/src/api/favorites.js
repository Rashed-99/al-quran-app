import httpClient from './httpClient';

function toSnakeFavorite(f) {
  return {
    id: f.id,
    surah_number: f.surahNumber,
    surah_name: f.surahName,
    verse_number: f.verseNumber,
    arabic_text: f.arabicText,
    translation: f.translation,
    notes: f.notes,
  };
}

export async function listFavorites() {
  const data = await httpClient.get('/api/favorites');
  return data.favorites.map(toSnakeFavorite);
}

export async function addFavorite({ surah_number, surah_name, verse_number, arabic_text, translation, notes }) {
  const data = await httpClient.post('/api/favorites', {
    surahNumber: surah_number,
    surahName: surah_name,
    verseNumber: verse_number,
    arabicText: arabic_text,
    translation,
    notes,
  });
  return toSnakeFavorite(data.favorite);
}

export async function removeFavorite(id) {
  await httpClient.delete(`/api/favorites/${id}`);
}
