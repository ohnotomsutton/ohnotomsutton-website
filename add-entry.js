const https = require('https');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node add-entry.js <url> <tag1> <tag2> ...');
  process.exit(1);
}

const url = args[0];
const tags = args.slice(1);

function fetchTitle(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/<title[^>]*>([^<]+)<\/title>/i);
        resolve(match ? match[1].trim() : url);
      });
    }).on('error', () => resolve(url));
  });
}

async function main() {
  console.log('Fetching page title...');
  const title = await fetchTitle(url);
  console.log(`Title: ${title}`);

  const entries = JSON.parse(fs.readFileSync('entries.json', 'utf8'));
  entries.unshift({ title, url, tags, date: new Date().toISOString().split('T')[0] });
  fs.writeFileSync('entries.json', JSON.stringify(entries, null, 2));
  console.log('Updated entries.json');

  execSync('git add entries.json');
  execSync(`git commit -m "add entry: ${title}"`);
  execSync('git push');
  console.log('Pushed to GitHub!');
}

main();