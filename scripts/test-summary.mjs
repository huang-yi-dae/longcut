// Quick test of /api/generate-summary
const BASE = 'http://localhost:8080';

async function main() {
  const payload = {
    transcript: [
      { text: "Nobody knows what skill to learn right now.", start: 0, duration: 2 },
      { text: "Do you learn AI? Do you learn coding?", start: 2, duration: 3 },
    ],
    videoInfo: { title: "Test Video", author: "Test Author" },
    videoId: "test-123",
    targetLanguage: "en",
  };

  console.log('POST /api/generate-summary ...');
  const resp = await fetch(`${BASE}/api/generate-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log(`Status: ${resp.status}`);
  const text = await resp.text();
  console.log(`Body (first 500 chars): ${text.slice(0, 500)}`);
  console.log(`Body (last 300 chars): ${text.slice(-300)}`);
}

main().catch(err => { console.error(err); process.exit(1); });
