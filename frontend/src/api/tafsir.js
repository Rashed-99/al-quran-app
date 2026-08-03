import httpClient from './httpClient';

// Returns { ibnkathir, jalalayn, saadi } - the Maududi source is NOT
// included here; TafsirPopup.jsx fetches that one directly from the
// free alquran.cloud API via QuranAPI.getTafsir, unchanged from before.
export async function getTafsir(surahNumber, verseNumber) {
  const data = await httpClient.get(`/api/tafsir/${surahNumber}/${verseNumber}`);
  return data.tafsir;
}
