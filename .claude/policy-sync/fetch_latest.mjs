/**
 * fetch_latest.mjs
 *
 * Uses Playwright to scrape the current RHAM policy list from the website,
 * saving the result as RawData/Policies_YYYY-MM-DD.json.
 *
 * Usage:  node .claude/policy-sync/fetch_latest.mjs
 * Output: RawData/Policies_YYYY-MM-DD.json (path printed to stdout on last line)
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const BASE = 'https://www.rhamschools.org';

console.log('Loading main page to establish session...');
await page.goto(`${BASE}/b_o_e/board_of_education_policies`, {
  waitUntil: 'networkidle',
  timeout: 60000
});
await page.waitForTimeout(3000);

const folders = [
  { id: '109748236', name: 'Region 8 1000 - Community' },
  { id: '96092394',  name: 'Region 8 2000 - Administration' },
  { id: '109748237', name: 'Region 8 3000 - Business' },
  { id: '96092398',  name: 'Region 8 4000 - Personnel' },
  { id: '96092404',  name: 'Region 8 5000 - Students' },
  { id: '96092409',  name: 'Region 8 6000 - Instruction' },
  { id: '105489338', name: 'Region 8 9000 - Internal Board Operations and By-Laws' },
];

const params = JSON.stringify({
  ContextId: 96092383,
  OneLink: '/cms/One.aspx',
  RawUrl: '/b_o_e/board_of_education_policies',
  Extension: '609219',
  ClientId: 'ctl00_ContentPlaceHolder1_ctl12',
  Place: 'cms',
  ThisRequest: `${BASE}:443/cms/One.aspx?portalId=290952&pageId=96092381`,
  Link: '/b_o_e/board_of_education_policies/?portalId=290952&pageId=96092381',
  PortalId: '290952',
  PageId: '96092381',
  HideDescription: true,
  ShowDispSettings: false,
  ShowSecurity: false,
  ShowActivity: false,
  ShowSubscription: true,
  id: 5,
  searchVal: '',
  Segment: `${BASE}/b_o_e/board_of_education_policies/`,
  InstanceId: '609219'
});

function parsePolicyName(text) {
  // Pattern 1: "1000 - School District Goals" (number dash name)
  let match = text.match(/^([\d.,/_\s]+[a-z]?)\s*[-–—±]\s*(.+?)(?:\.pdf)?$/i);
  if (match) {
    const numPart = match[1].trim();
    const firstNum = numPart.split(/[,/]/)[0].trim().replace(/_/g, '');
    return { number: firstNum, name: match[2].trim() };
  }

  // Pattern 2: "5141.1 Administration of Medications" (number space name, no dash)
  match = text.match(/^(\d{4}(?:\.\d+)?[a-z]?)\s+(.+?)(?:\.pdf)?$/i);
  if (match) {
    return { number: match[1], name: match[2].trim() };
  }

  // Pattern 3: "5129_5130 - Connecticut..." (underscore-joined numbers)
  match = text.match(/^(\d{4})[_](\d{4})\s*[-–—]\s*(.+?)(?:\.pdf)?$/i);
  if (match) {
    return { number: match[1], name: match[3].trim() };
  }

  return null;
}

const allPolicies = [];

for (const folder of folders) {
  console.log(`Fetching: ${folder.name}`);

  const response = await page.evaluate(async ({ parentId, params, base }) => {
    const resp = await fetch(`${base}/portal/svc/ContentItemSvc.asmx/GetItemList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: parentId, Params: params })
    });
    return resp.json();
  }, { parentId: folder.id, params, base: BASE });

  const items = response.d.DataObject;
  console.log(`  Got ${items.length} items`);

  for (const item of items) {
    if (item.Type === 'content_item') {
      const text = item.Name || item.Title || '';
      const fileUrl = item.Link || '';
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${BASE}${fileUrl}`;

      const parsed = parsePolicyName(text);
      if (parsed) {
        allPolicies.push({ number: parsed.number, name: parsed.name, url: fullUrl });
      } else {
        console.log(`  WARNING: Could not parse: "${text}"`);
        allPolicies.push({ number: '', name: text.replace(/\.pdf$/i, '').trim(), url: fullUrl });
      }
    }
  }
}

await browser.close();

allPolicies.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));

const today = new Date().toISOString().slice(0, 10);
const outFile = `RawData/Policies_${today}.json`;
writeFileSync(outFile, JSON.stringify(allPolicies, null, 2));

console.log(`\nTotal policies found: ${allPolicies.length}`);
console.log(`OUTPUT_FILE:${outFile}`);
