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

  const symbol = path.basename(file, '.json');
  const { addresses } = content;

  for (const [network, entries] of Object.entries(addresses)) {
    if (!Array.isArray(entries)) continue;

    if (!aggregated[network]) aggregated[network] = {};
    if (!aggregated[network][symbol]) aggregated[network][symbol] = [];

    aggregated[network][symbol].push(
      ...entries
        .filter((e) => e && e.address)
        .map((e) => ({ address: e.address, provider: e.provider }))
    );
  }
}

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

for (const [network, data] of Object.entries(aggregated)) {
  const filePath = path.join(distDir, `${network}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Created ${filePath}`);
}
