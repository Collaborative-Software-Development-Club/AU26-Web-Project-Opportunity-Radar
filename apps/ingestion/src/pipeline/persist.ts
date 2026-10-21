import { NormalizedOpportunity } from './normalize';

// In-memory store (replace with your DB client like Prisma/Kysely if your app uses one)
const store = new Map<string, NormalizedOpportunity>();

export async function persist(items: NormalizedOpportunity[]) {
  let inserted = 0;
  let updated = 0;

  for (const item of items) {
    if (store.has(item.externalId)) {
      store.set(item.externalId, item);
      updated++;
    } else {
      store.set(item.externalId, item);
      inserted++;
    }
  }

  return {
    totalInStore: store.size,
    inserted,
    updated,
  };
}