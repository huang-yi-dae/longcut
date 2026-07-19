// Integration test: fetch transcript + video info, then call video-analysis API
// to persist data to the local SQLite database.
const BASE = 'http://localhost:8080';
const VIDEO_ID = 'bWR_3Sg-H-8';
const URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

async function post(path, body) {
  const resp = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  console.log(`${path} → HTTP ${resp.status}`);
  return data;
}

async function main() {
  // 1. Get transcript
  console.log('\n[1/3] Fetching transcript...');
  const transcriptData = await post('/api/transcript', { url: URL, language: 'auto' });
  if (!transcriptData.transcript) {
    console.error('No transcript:', transcriptData.error);
    process.exit(1);
  }
  console.log(`  Got ${transcriptData.transcript.length} merged segments`);

  // 2. Build and send video-analysis
  console.log('\n[2/3] Sending video-analysis...');
  const analysisPayload = {
    videoId: VIDEO_ID,
    videoInfo: {
      videoId: VIDEO_ID,
      title: 'Learn This Skill If You Want To Win In The Next 2-3 Years',
      author: 'Dan Koe',
      thumbnail: `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`,
      duration: transcriptData.transcriptDuration || 1481,
    },
    transcript: transcriptData.transcript,
    model: 'deepseek-v4-flash',
    mode: 'smart',
  };

  const analysisResult = await post('/api/video-analysis', analysisPayload);
  if (analysisResult.error) {
    console.error('Analysis error:', analysisResult.error);
  } else {
    console.log('  videoId:', analysisResult.videoId);
    console.log('  topicCount:', analysisResult.topics?.length);
    console.log('  summary length:', analysisResult.summary?.length);
  }

  // 3. Verify DB
  console.log('\n[3/3] Verifying SQLite...');
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync('../data/local.db');
  const videos = db.prepare('SELECT id, youtube_id, title, summary, created_at FROM video_analyses WHERE youtube_id = ?').all(VIDEO_ID);
  console.log('  video_analyses rows:', videos.length);
  if (videos.length) {
    const v = videos[0];
    console.log('  id:', v.id);
    console.log('  title:', v.title);
    console.log('  summary:', String(v.summary || '').slice(0, 80) + '...');
  }
  const userVids = db.prepare('SELECT COUNT(*) as c FROM user_videos WHERE video_id = ?').all(videos[0]?.id || '');
  console.log('  user_videos rows:', userVids[0]?.c || 0);
  db.close();
  console.log('\nDONE');
}

main().catch(err => { console.error(err); process.exit(1); });
