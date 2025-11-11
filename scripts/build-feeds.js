const fs = require('fs');
const path = require('path');

const feedsDir = path.resolve(__dirname, '..');
const distDir = path.resolve(__dirname, '..');

const files = fs
  .readdirSync(feedsDir)
  .filter((f) => f.toLowerCase().endsWith('.json'));

const aggregated = {};
for (const file of files) {
  const fullPath = path.join(feedsDir, file);
  let content;
  try {
    content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (err) {
    console.warn(`Skipping invalid JSON: ${fullPath}`);
    continue;
  }

  if (
    !content ||
    typeof content !== 'object' ||
    !content.addresses ||
    typeof content.addresses !== 'object'
  ) {
    continue;
  }

  const { addresses } = content;

  for (const [network, entries] of Object.entries(addresses)) {
    if (!Array.isArray(entries)) continue;

    if (!aggregated[network]) aggregated[network] = {};

    for (const e of entries) {
      if (!e || !e.address || !e.tokenAddress) continue;
      const key = String(e.tokenAddress).toLowerCase();
      if (!aggregated[network][key]) aggregated[network][key] = [];
      aggregated[network][key].push({ address: String(e.address).toLowerCase(), provider: e.provider });
    }
  }
}

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

for (const [network, data] of Object.entries(aggregated)) {
  const filePath = path.join(distDir, `${network}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Created ${filePath}`);
}
