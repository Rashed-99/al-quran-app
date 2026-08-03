import asyncHandler from '../utils/asyncHandler.js';
import * as tafsirService from '../services/tafsir.service.js';

export const getForVerse = asyncHandler(async (req, res) => {
  const surahNumber = Number(req.params.surah);
  const verseNumber = Number(req.params.verse);
  const tafsir = await tafsirService.getTafsirForVerse(surahNumber, verseNumber);
  res.json({ tafsir });
});
