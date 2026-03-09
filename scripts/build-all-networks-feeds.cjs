const fs = require('fs');
const path = require('path');

const CHAIN_IDS = {
  arbitrum: 42161,
  base: 8453,
  bsc: 56,
  ethereum: 1,
  plasma: 9745,
  polygon: 137,
};

const feedsDir = path.resolve(__dirname, '..');
const outputPath = path.resolve(__dirname, '..', 'all-networks.json');

const files = fs
  .readdirSync(feedsDir)
  .filter((file) => file.toLowerCase().endsWith('.json') && file !== 'all-networks.json');

const aggregated = {};

for (const file of files) {
  const symbol = path.basename(file, '.json');
  const fullPath = path.join(feedsDir, file);

  let content;
  try {
    content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
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

  for (const [network, entries] of Object.entries(content.addresses)) {
    if (!Array.isArray(entries)) continue;

    const chainId = CHAIN_IDS[network];
    if (!chainId) {
      console.warn(`Skipping unsupported network "${network}" in ${fullPath}`);
      continue;
    }

    for (const entry of entries) {
      if (!entry || !entry.address || !entry.tokenAddress) continue;

      const tokenAddress = String(entry.tokenAddress).toLowerCase();
      if (!aggregated[tokenAddress]) aggregated[tokenAddress] = [];

      aggregated[tokenAddress].push({
        address: String(entry.address).toLowerCase(),
        chainId,
        provider: entry.provider,
        symbol,
        tokenAddress,
      });
    }
  }
}

fs.writeFileSync(outputPath, JSON.stringify(aggregated, null, 2));
console.log(`Created ${outputPath}`);
