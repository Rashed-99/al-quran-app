import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const QURAN_API_BASE = 'https://api.alquran.cloud/v1';

// Prompts ported verbatim from the original src/components/reading/TafsirPopup.jsx
// so precomputed output matches what the live LLM calls used to produce.
const PROMPTS = {
  ibnkathir: (surah, verse, name, ar, tr) =>
    `You are an expert in Quranic tafsir. Provide the explanation of the following Quranic verse based on Tafsir Ibn Kathir by Ismail ibn Kathir.\n\nSurah ${surah} (${name}), Verse ${verse}\nArabic: ${ar}\nTranslation: ${tr}\n\nProvide:\n1. **Context of Revelation** (Asbab al-Nuzul) if known\n2. **Meaning & Explanation** as found in Tafsir Ibn Kathir\n3. **Related Narrations** — any Hadith or reports Ibn Kathir cites\n4. **Key Lessons**\n\nBe faithful to traditional scholarship. Do not invent interpretations. Use clear, accessible English. Format with markdown headings.`,
  jalalayn: (surah, verse, name, ar, tr) =>
    `You are an expert in Quranic tafsir. Provide the explanation of the following Quranic verse based on Tafsir al-Jalalayn by Jalal al-Din al-Mahalli and Jalal al-Din al-Suyuti.\n\nSurah ${surah} (${name}), Verse ${verse}\nArabic: ${ar}\nTranslation: ${tr}\n\nProvide a concise explanation faithful to al-Jalalayn, focusing on:\n- **Word meanings** and linguistic analysis\n- **Contextual interpretation**\n- **Rhetorical points**\n\nThis tafsir is known for being brief. Do not add lengthy explanations beyond what al-Jalalayn covers. Use clear, accessible English. Format with markdown.`,
  saadi: (surah, verse, name, ar, tr) =>
    `You are an expert in Quranic tafsir. Provide the explanation of the following Quranic verse based on Taysir al-Karim al-Rahman by al-Sa'di.\n\nSurah ${surah} (${name}), Verse ${verse}\nArabic: ${ar}\nTranslation: ${tr}\n\nProvide:\n1. **Meaning & Explanation** as found in al-Sa'di's tafsir\n2. **Spiritual and practical lessons** al-Sa'di draws from the verse\n\nAl-Sa'di's tafsir is known for clarity and focus on spiritual benefits. Be faithful to his approach. Use clear, accessible English. Format with markdown.`,
};

const SOURCES = Object.keys(PROMPTS); // ['ibnkathir', 'jalalayn', 'saadi']

async function fetchSurahList() {
  const res = await fetch(`${QURAN_API_BASE}/surah`);
  const json = await res.json();
  if (json.code !== 200) throw new Error('Failed to fetch surah list from alquran.cloud');
  return json.data; // [{ number, name, englishName, numberOfAyahs, ... }]
}

async function fetchSurahText(surahNumber) {
  const res = await fetch(`${QURAN_API_BASE}/surah/${surahNumber}/editions/quran-simple,en.ahmedraza`);
  const json = await res.json();
  if (json.code !== 200) throw new Error(`Failed to fetch surah ${surahNumber} text`);
  const [arabic, translation] = json.data;
  return arabic.ayahs.map((ayah, i) => ({
    verseNumber: ayah.numberInSurah,
    arabic: ayah.text,
    translation: translation.ayahs[i]?.text || '',
  }));
}

async function callLLM(prompt) {
  const res = await fetch(process.env.TAFSIR_LLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TAFSIR_LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.TAFSIR_LLM_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
    }),
  });
  if (!res.ok) {
    throw new Error(`LLM call failed: ${res.status} ${await res.text().catch(() => '')}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('LLM returned empty tafsir text');
  return text;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Fetching surah list...');
  const surahs = await fetchSurahList();

  let generated = 0;
  let skipped = 0;

  for (const surah of surahs) {
    console.log(`Surah ${surah.number} (${surah.englishName}) - fetching verse text...`);
    const verses = await fetchSurahText(surah.number);

    for (const verse of verses) {
      for (const source of SOURCES) {
        const exists = await prisma.tafsir.findUnique({
          where: {
            unique_tafsir_entry: {
              surahNumber: surah.number,
              verseNumber: verse.verseNumber,
              source,
            },
          },
        });
        if (exists) {
          skipped += 1;
          continue;
        }

        const prompt = PROMPTS[source](
          surah.number,
          verse.verseNumber,
          surah.englishName,
          verse.arabic,
          verse.translation
        );

        try {
          const text = await callLLM(prompt);
          await prisma.tafsir.create({
            data: { surahNumber: surah.number, verseNumber: verse.verseNumber, source, text },
          });
          generated += 1;
          if (generated % 25 === 0) {
            console.log(`  ...${generated} generated so far (${skipped} skipped as already present)`);
          }
          // Basic pacing to stay under most providers' rate limits. Tune per your plan.
          await sleep(300);
        } catch (err) {
          console.error(`  FAILED surah ${surah.number} verse ${verse.verseNumber} [${source}]:`, err.message);
          // Continue - script is safe to re-run and will skip rows already written.
        }
      }
    }
  }

  console.log(`Done. Generated ${generated}, skipped ${skipped} already-existing rows.`);
}

run()
  .catch((err) => {
    console.error('Precompute job failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
