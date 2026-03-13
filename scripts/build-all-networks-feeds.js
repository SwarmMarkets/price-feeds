import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CHAIN_IDS = {
  arbitrum: 42161,
  base: 8453,
  bsc: 56,
  ethereum: 1,
  plasma: 9745,
  polygon: 137,
};

function createFeedId(address, chainId) {
  return `${String(address).toLowerCase()}-${chainId}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

      const address = String(entry.address).toLowerCase();
      const feedId = createFeedId(address, chainId);
      const tokenAddress = String(entry.tokenAddress).toLowerCase();
      if (!aggregated[feedId]) aggregated[feedId] = [];

      aggregated[feedId].push({
        address,
        chainId,
        id: feedId,
        provider: entry.provider,
        symbol,
        tokenAddress,
      });
    }
  }
}

fs.writeFileSync(outputPath, JSON.stringify(aggregated, null, 2));
console.log(`Created ${outputPath}`);
