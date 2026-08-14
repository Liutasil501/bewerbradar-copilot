import http from 'node:http';
import assert from 'node:assert';
import { spawn } from 'node:child_process';

const PORT = 3155;
const BASE_URL = `http://localhost:${PORT}`;

function fetchHttp(path: string, options: { headers?: Record<string, string>; redirect?: boolean } = {}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: 'GET',
        headers: options.headers || {},
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf-8'),
          });
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('[SEO HTTP Verification] Starting next start on port', PORT);
  const server = spawn('node_modules\\.bin\\next.cmd', ['start', '-p', String(PORT)], {
    env: {
      ...process.env,
      AUTH_ENABLED: 'true',
      PORT: String(PORT),
    },
    shell: true,
  });

  server.stdout?.on('data', (d) => process.stdout.write(d.toString()));
  server.stderr?.on('data', (d) => process.stderr.write(d.toString()));

  // Wait for server to become ready
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetchHttp('/api/health');
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!ready) {
    server.kill();
    throw new Error('Server failed to start in 30s');
  }

  console.log('\n[1/7] Testing /opengraph-image and /twitter-image...');
  const ogRes = await fetchHttp('/opengraph-image');
  assert.strictEqual(ogRes.status, 200, `Expected 200 for /opengraph-image, got ${ogRes.status}`);
  assert.ok(ogRes.headers['content-type']?.includes('image/png'), `Expected image/png, got ${ogRes.headers['content-type']}`);
  console.log('✓ /opengraph-image returned HTTP 200 image/png');

  const twRes = await fetchHttp('/twitter-image');
  assert.strictEqual(twRes.status, 200, `Expected 200 for /twitter-image, got ${twRes.status}`);
  assert.ok(twRes.headers['content-type']?.includes('image/png'), `Expected image/png, got ${twRes.headers['content-type']}`);
  console.log('✓ /twitter-image returned HTTP 200 image/png');

  console.log('\n[2/7] Testing /robots.txt...');
  const robotsRes = await fetchHttp('/robots.txt');
  assert.strictEqual(robotsRes.status, 200);
  assert.ok(robotsRes.body.includes('Disallow: /de/interview'), 'robots.txt must disallow /de/interview');
  assert.ok(robotsRes.body.includes('Disallow: /en/interview'), 'robots.txt must disallow /en/interview');
  assert.ok(robotsRes.body.includes('Disallow: /de/dashboard'), 'robots.txt must disallow /de/dashboard');
  assert.ok(robotsRes.body.includes('sitemap.xml'), 'robots.txt must declare sitemap.xml');
  console.log('✓ /robots.txt verified with correct disallows and sitemap');

  console.log('\n[3/7] Testing /sitemap.xml...');
  const sitemapRes = await fetchHttp('/sitemap.xml');
  assert.strictEqual(sitemapRes.status, 200);
  assert.ok(sitemapRes.body.includes('/de/templates'), 'sitemap.xml must include /de/templates');
  assert.ok(sitemapRes.body.includes('/en/templates'), 'sitemap.xml must include /en/templates');
  assert.ok(!sitemapRes.body.includes('/interview'), 'sitemap.xml must NOT include /interview');
  assert.ok(!sitemapRes.body.includes('/dashboard'), 'sitemap.xml must NOT include /dashboard');
  console.log('✓ /sitemap.xml verified with only public indexable routes');

  console.log('\n[4/7] Testing /de rendered HTML (<html lang="de"> and single brand title)...');
  const deRes = await fetchHttp('/de');
  assert.strictEqual(deRes.status, 200);
  assert.ok(deRes.body.includes('<html lang="de"'), `Expected <html lang="de">, body snippet: ${deRes.body.slice(0, 200)}`);
  assert.ok(deRes.body.includes('<title>BewerbRadar Copilot - Professionelle Lebensl'), 'Expected German title on /de');
  assert.strictEqual((deRes.body.match(/BewerbRadar Copilot/g) || []).length > 0, true);
  console.log('✓ /de rendered <html lang="de"> and correct title');

  console.log('\n[5/7] Testing /en rendered HTML (<html lang="en"> and English title)...');
  const enRes = await fetchHttp('/en');
  assert.strictEqual(enRes.status, 200);
  assert.ok(enRes.body.includes('<html lang="en"'), `Expected <html lang="en">, body snippet: ${enRes.body.slice(0, 200)}`);
  assert.ok(enRes.body.includes('<title>BewerbRadar Copilot - Professional AI Resume'), 'Expected English title on /en');
  console.log('✓ /en rendered <html lang="en"> and correct English title');

  console.log('\n[6/7] Testing /de/templates title (single brand suffix)...');
  const tplRes = await fetchHttp('/de/templates');
  assert.strictEqual(tplRes.status, 200);
  assert.ok(tplRes.body.includes('<title>40+ Professionelle Lebenslauf-Vorlagen &amp; Muster | BewerbRadar Copilot</title>') || tplRes.body.includes('<title>40+ Professionelle Lebenslauf-Vorlagen & Muster | BewerbRadar Copilot</title>'), 'Expected un-duplicated brand suffix on templates page');
  assert.ok(!tplRes.body.includes('BewerbRadar Copilot | BewerbRadar Copilot'), 'No duplicate brand suffix');
  console.log('✓ /de/templates rendered clean title without duplicate brand name');

  console.log('\n[7/7] Testing signed-out auth protection on /de/interview...');
  const interviewRes = await fetchHttp('/de/interview');
  // With AUTH_ENABLED=true, signed-out user on /de/interview gets 307 redirect to /de/login?callbackUrl=...
  assert.strictEqual(interviewRes.status, 307, `Expected 307 redirect to login for signed-out /de/interview, got ${interviewRes.status}`);
  assert.ok(interviewRes.headers.location?.includes('/login'), 'Redirect destination must be login');
  console.log('✓ /de/interview correctly redirected signed-out visitor to login');

  console.log('\n=========================================');
  console.log('ALL 7/7 LIVE HTTP SEO VERIFICATIONS PASSED!');
  console.log('=========================================\n');

  server.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
