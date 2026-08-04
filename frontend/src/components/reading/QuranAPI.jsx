// Quran API Service - Using alquran.cloud API with Kanz-ul-Iman translation
const BASE_URL = 'https://api.alquran.cloud/v1';

// Ahmed Raza Khan's Kanz-ul-Iman English translation
const TRANSLATION_EDITION = 'en.ahmedraza';
const ARABIC_EDITION = 'quran-simple';
const AUDIO_EDITION = 'ar.alafasy';
const TAFSIR_EDITION = 'en.maududi';
// NOTE: this is the commonly-documented alquran.cloud transliteration
// edition identifier, but I could not get a live confirmation of the
// exact string against the API's /edition endpoint in the environment
// this was built in (tooling limitation, not a guess made carelessly -
// see fetchTransliteration below for how this is guarded). If
// transliteration doesn't appear after deploying, open browser DevTools
// -> Network, find the failing request, and check whether it's a 404 -
// that would confirm the identifier needs adjusting.
const TRANSLITERATION_EDITION = 'en.transliteration';

// The `quran-simple` Arabic edition bakes the Bismillah into the START of
// ayah 1's text for every surah except At-Tawbah (9) - Al-Fatiha (1) is the
// one exception where the Bismillah genuinely IS verse 1 itself. Every
// reading page renders its own separate, correctly-styled Bismillah line
// above the verse text, so we strip it out of the raw ayah text here at the
// data layer - otherwise it shows up twice, or merged into the verse as one
// run-on line with no visual distinction from the verse that follows it.
//
// Matched via a diacritic-agnostic regex (allows any Arabic harakat/tatweel
// between each base letter) rather than a literal string, since APIs don't
// always encode the same diacritics on their Bismillah text as elsewhere in
// the codebase - a literal match risks silently failing to strip anything.
const ARABIC_DIACRITICS = '[\\u064B-\\u0652\\u0670\\u0640]*';
const buildLetterPattern = (word) => word.split('').map((ch) => `${ch}${ARABIC_DIACRITICS}`).join('');
const BISMILLAH_PATTERN = new RegExp(
  '^\\s*' +
    buildLetterPattern('بسم') + '\\s+' +
    buildLetterPattern('الله') + '\\s+' +
    buildLetterPattern('الرحمن') + '\\s+' +
    buildLetterPattern('الرحيم') +
    '\\s*'
);

function stripLeadingBismillah(text, surahNumber, ayahNumberInSurah) {
  if (ayahNumberInSurah !== 1 || surahNumber === 1 || surahNumber === 9) {
    return text;
  }
  return text.replace(BISMILLAH_PATTERN, '');
}

// Fetched as a completely separate, independently-failing request from the
// Arabic + translation call - deliberately, so that if TRANSLITERATION_EDITION
// turns out to be wrong or unavailable, the app's core reading experience
// (Arabic text + translation, both already verified working) is entirely
// unaffected. Returns an array of transliteration strings indexed by ayah
// position, or null if the fetch fails for any reason.
async function fetchTransliteration(surahNumber) {
  try {
    const response = await fetch(`${BASE_URL}/surah/${surahNumber}/${TRANSLITERATION_EDITION}`);
    const data = await response.json();
    if (data.code === 200 && Array.isArray(data.data?.ayahs)) {
      return data.data.ayahs.map((ayah) => ayah.text || '');
    }
    return null;
  } catch (error) {
    console.warn('Transliteration unavailable for surah', surahNumber, error);
    return null;
  }
}

export const QuranAPI = {
  // Get all surahs list
  async getSurahList() {
    const response = await fetch(`${BASE_URL}/surah`);
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    throw new Error('Failed to fetch surah list');
  },

  // Get a specific surah with Arabic and translation
  async getSurah(surahNumber) {
    const [response, transliterations] = await Promise.all([
      fetch(`${BASE_URL}/surah/${surahNumber}/editions/${ARABIC_EDITION},${TRANSLATION_EDITION}`),
      fetchTransliteration(surahNumber),
    ]);
    const data = await response.json();
    if (data.code === 200) {
      const [arabic, translation] = data.data;
      return {
        number: arabic.number,
        name: arabic.name,
        englishName: arabic.englishName,
        englishNameTranslation: arabic.englishNameTranslation,
        revelationType: arabic.revelationType,
        numberOfAyahs: arabic.numberOfAyahs,
        verses: arabic.ayahs.map((ayah, index) => ({
          number: ayah.numberInSurah,
          globalNumber: ayah.number,
          arabic: stripLeadingBismillah(ayah.text, arabic.number, ayah.numberInSurah),
          translation: translation.ayahs[index]?.text || '',
          transliteration: transliterations?.[index] || '',
          juz: ayah.juz,
          page: ayah.page,
          audio: `https://cdn.islamic.network/quran/audio/128/${AUDIO_EDITION}/${ayah.number}.mp3`
        }))
      };
    }
    throw new Error('Failed to fetch surah');
  },

  // Get a specific ayah with Arabic and translation
  async getAyah(surahNumber, ayahNumber) {
    const reference = `${surahNumber}:${ayahNumber}`;
    const response = await fetch(
      `${BASE_URL}/ayah/${reference}/editions/${ARABIC_EDITION},${TRANSLATION_EDITION}`
    );
    const data = await response.json();
    if (data.code === 200) {
      const [arabic, translation] = data.data;
      return {
        surahNumber: arabic.surah.number,
        surahName: arabic.surah.englishName,
        surahNameArabic: arabic.surah.name,
        verseNumber: arabic.numberInSurah,
        globalNumber: arabic.number,
        arabic: stripLeadingBismillah(arabic.text, arabic.surah.number, arabic.numberInSurah),
        translation: translation.text,
        juz: arabic.juz,
        page: arabic.page,
        audio: `https://cdn.islamic.network/quran/audio/128/${AUDIO_EDITION}/${arabic.number}.mp3`
      };
    }
    throw new Error('Failed to fetch ayah');
  },

  // Get multiple ayahs from a surah (with pagination)
  async getAyahRange(surahNumber, startAyah, count = 10) {
    const surah = await this.getSurah(surahNumber);
    const startIndex = startAyah - 1;
    const endIndex = Math.min(startIndex + count, surah.verses.length);
    return {
      ...surah,
      verses: surah.verses.slice(startIndex, endIndex),
      hasMore: endIndex < surah.verses.length
    };
  },

  // Get Juz
  async getJuz(juzNumber) {
    const response = await fetch(
      `${BASE_URL}/juz/${juzNumber}/editions/${ARABIC_EDITION},${TRANSLATION_EDITION}`
    );
    const data = await response.json();
    if (data.code === 200) {
      const [arabic, translation] = data.data;
      return {
        number: arabic.number,
        verses: arabic.ayahs.map((ayah, index) => ({
          surahNumber: ayah.surah.number,
          surahName: ayah.surah.englishName,
          surahNameArabic: ayah.surah.name,
          verseNumber: ayah.numberInSurah,
          globalNumber: ayah.number,
          arabic: stripLeadingBismillah(ayah.text, ayah.surah.number, ayah.numberInSurah),
          translation: translation.ayahs[index]?.text || '',
          juz: ayah.juz,
          page: ayah.page,
          audio: `https://cdn.islamic.network/quran/audio/128/${AUDIO_EDITION}/${ayah.number}.mp3`
        }))
      };
    }
    throw new Error('Failed to fetch juz');
  },

  // Search in Quran
  async search(keyword, surah = 'all') {
    const response = await fetch(
      `${BASE_URL}/search/${encodeURIComponent(keyword)}/${surah}/${TRANSLATION_EDITION}`
    );
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    throw new Error('Failed to search');
  },

  // Get tafsir for a specific ayah (Maududi's Tafheem-ul-Quran)
  async getTafsir(surahNumber, ayahNumber) {
    const reference = `${surahNumber}:${ayahNumber}`;
    const response = await fetch(
      `${BASE_URL}/ayah/${reference}/editions/${TAFSIR_EDITION}`
    );
    const data = await response.json();
    if (data.code === 200) {
      return data.data[0];
    }
    throw new Error('Failed to fetch tafsir');
  },

  // Get audio URL for a verse
  getAudioUrl(globalVerseNumber) {
    return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalVerseNumber}.mp3`;
  }
};

export default QuranAPI;