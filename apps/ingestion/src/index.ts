import { Scholarships360Scraper } from './sources/static-scrapers'; // adjust path to where your class lives
import { normalize } from './pipeline/normalize';
import { persist } from './pipeline/persist';

async function runPipeline() {
  const scraper = new Scholarships360Scraper();

  console.log('=== RUN 1 ===');
  const rawData1 = await scraper.fetch();
  console.log(`Fetched ${rawData1.length} raw opportunities.`);
  
  const normalized1 = rawData1.map(normalize);
  const result1 = await persist(normalized1);
  console.log('Persist result:', result1);

  console.log('\n=== RUN 2 (Deduplication Check) ===');
  const rawData2 = await scraper.fetch();
  const normalized2 = rawData2.map(normalize);
  const result2 = await persist(normalized2);
  console.log('Persist result:', result2);
}

runPipeline().catch(console.error);