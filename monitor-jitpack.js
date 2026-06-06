const https = require('https');

const JITPACK_TEST_URL = 'https://www.jitpack.io/com/stripe/financial-connections/maven-metadata.xml';
const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

function checkJitPack() {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const req = https.get(JITPACK_TEST_URL, { timeout: 5000 }, (res) => {
      const elapsed = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] JitPack responded with status ${res.statusCode} in ${elapsed}ms`);

      if (res.statusCode === 200) {
        console.log('✅ JITPACK IS BACK UP! You can build now!');
        resolve(true);
      } else {
        console.log(`❌ JitPack still down (status: ${res.statusCode})`);
        resolve(false);
      }

      req.abort();
    });

    req.on('timeout', () => {
      console.log(`[${new Date().toISOString()}] ⏱️  JitPack timeout - still down`);
      req.destroy();
      resolve(false);
    });

    req.on('error', (err) => {
      console.log(`[${new Date().toISOString()}] ❌ JitPack error: ${err.message}`);
      resolve(false);
    });
  });
}

async function monitor() {
  console.log('🔍 Starting JitPack monitor...');
  console.log(`Checking every ${CHECK_INTERVAL / 1000 / 60} minutes\n`);

  while (true) {
    const isUp = await checkJitPack();

    if (isUp) {
      console.log('\n🎉 JITPACK IS BACK! GO BUILD YOUR APP NOW!');
      process.exit(0);
    }

    console.log(`Next check in ${CHECK_INTERVAL / 1000 / 60} minutes...\n`);
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
}

monitor();
