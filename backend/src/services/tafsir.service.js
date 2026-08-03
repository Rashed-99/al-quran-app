import prisma from '../db/prismaClient.js';

// Serves the 3 LLM-precomputed tafsir sources (ibnkathir, jalalayn, saadi).
// The 4th source shown in the UI (Maududi) is fetched by the frontend
// directly from the free alquran.cloud API and never touches this backend.
export async function getTafsirForVerse(surahNumber, verseNumber) {
  const rows = await prisma.tafsir.findMany({
    where: { surahNumber, verseNumber },
  });

  const bySource = { ibnkathir: null, jalalayn: null, saadi: null };
  for (const row of rows) {
    bySource[row.source] = row.text;
  }
  return bySource;
}
