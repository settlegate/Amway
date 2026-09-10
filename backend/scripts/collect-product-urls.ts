import fs from 'node:fs';
import path from 'node:path';

const CATEGORIES: Record<string, string> = {
  'basic/vitamins-minerals/c/vitamins-minerals': '비타민/미네랄',
  'basic/proteins/c/proteins': '단백질',
  'basic/probiotic-fibers/c/probiotic-fibers': '유산균/식이섬유',
  'basic/mylab-microbiome/c/mylab-microbiome': '마이크로바이옴',
  'functional/c/functional': '기능성',
  'nutrikids/c/nutrikids': '어린이',
  'food-beverage/c/food-beverage': '식품/음료',
  'bodykey/c/bodykey': '바디키',
  'n-by-nutrilite/c/n-by-nutrilite': 'n by Nutrilite',
  'xs-energy-drink/c/xs-energy-drink': 'XS 에너지',
  'nutrition-gift-set/c/nutrition-gift-set': '선물세트',
};

const CONCERNS_BASE =
  'https://api.amway.co.kr/category/nutrilite/nutrilite-concerns/c/';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_PAGES = 8; // safety cap per category

function jinaUrl(url: string) {
  return `https://r.jina.ai/${url}`;
}

async function fetchText(url: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(jinaUrl(url), {
        signal: AbortSignal.timeout(60000),
      });
      if (res.ok) return await res.text();
      console.warn(`[collect] HTTP ${res.status} ${url} (try ${i + 1})`);
    } catch (e: any) {
      console.warn(`[collect] fetch err ${url}: ${e?.message} (try ${i + 1})`);
    }
    await sleep(3000);
  }
  return '';
}

function extractProductUrls(text: string): { sku: string; url: string }[] {
  const regex =
    /(?:https?:\/\/(?:www\.|api\.)?amway\.co\.kr)?(\/shop\/nutrition\/[^\s"'\)\]]*\/p\/)([A-Za-z0-9]+)/g;
  const out: { sku: string; url: string }[] = [];
  const seen = new Set<string>();
  let m;
  while ((m = regex.exec(text)) !== null) {
    if (seen.has(m[2])) continue;
    seen.add(m[2]);
    out.push({ sku: m[2], url: `https://www.amway.co.kr${m[1]}${m[2]}` });
  }
  return out;
}

async function collectPaginated(baseUrl: string, label: string) {
  const found = new Map<string, string>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = page === 0 ? baseUrl : `${baseUrl}?page=${page}`;
    const text = await fetchText(url);
    if (!text) break;
    const items = extractProductUrls(text);
    let added = 0;
    for (const it of items) {
      if (!found.has(it.sku)) {
        found.set(it.sku, it.url);
        added++;
      }
    }
    console.log(
      `[collect] ${label} page=${page}: ${items.length} items, +${added} new`
    );
    if (added === 0 && page > 0) break; // page repeats previous content
    await sleep(1200);
  }
  return found;
}

async function collectConcernCategories(): Promise<Map<string, string>> {
  // The concerns landing page may be blocked; each subcategory URL pattern is
  // stable so we try them directly as well.
  const concernKeys = [
    'nutrilite-concerns-vitamins-minerals',
    'nutrilite-concerns-gut-health',
    'nutrilite-concerns-protein-amino-acid',
    'nutrilite-concerns-cardiovascular',
    'nutrilite-concerns-bone-joint-health',
    'nutrilite-concerns-eye-health',
    'nutrilite-concerns-liver-health',
    'nutrilite-concerns-enzyme',
    'nutrilite-concerns-dietary-fiber',
    'nutrilite-concerns-immunity-boost',
    'nutrilite-concerns-antioxidant',
    'nutrilite-concerns-brain-health',
    'nutrilite-concerns-lecithin',
    'nutrilite-concerns-sleep-health',
    'nutrilite-concerns-stress-manage',
    'nutrilite-concerns-woman-health',
    'nutrilite-concerns-man-health',
    'nutrilite-concerns-skin-health',
    'nutrilite-concerns-collagen',
    'nutrilite-concerns-children',
    'nutrilite-concerns-health-drink',
    'nutrilite-concerns-health-snack',
  ];
  const found = new Map<string, string>();
  for (const key of concernKeys) {
    const map = await collectPaginated(CONCERNS_BASE + key, `concern:${key}`);
    for (const [k, v] of map) found.set(k, v);
  }
  return found;
}

async function main() {
  const skuMap = new Map<string, string>();

  for (const [cat, name] of Object.entries(CATEGORIES)) {
    const base = `https://api.amway.co.kr/shop/nutrition/${cat}`;
    const map = await collectPaginated(base, name);
    for (const [k, v] of map) skuMap.set(k, v);
    console.log(`[collect] ${name} total=${map.size}, all=${skuMap.size}`);
    await sleep(1500);
  }

  const concern = await collectConcernCategories();
  for (const [k, v] of concern) skuMap.set(k, v);
  console.log(`[collect] after concerns total=${skuMap.size}`);

  const unique = [...skuMap.values()];
  const out = path.join(__dirname, 'product-urls.txt');
  fs.writeFileSync(out, unique.join('\n'), 'utf8');
  console.log(`[collect] wrote ${unique.length} unique product URLs to ${out}`);
}

main().catch((err) => {
  console.error('[collect] fatal:', err);
  process.exitCode = 1;
});
