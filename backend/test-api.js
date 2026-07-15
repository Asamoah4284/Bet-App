// Temporary end-to-end test: starts an in-memory MongoDB, boots the server,
// and exercises the signup / buddy / check-in flows.
const { spawn } = require('child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongo = await MongoMemoryServer.create();
  console.log('In-memory MongoDB at', mongo.getUri());

  const server = spawn('node', ['server.js'], {
    env: { ...process.env, MONGODB_URI: mongo.getUri('betapp'), PORT: '3100' },
  });
  let serverOut = '';
  server.stdout.on('data', (d) => (serverOut += d));
  server.stderr.on('data', (d) => (serverOut += d));

  const base = 'http://localhost:3100';
  const post = async (path, body, token) =>
    (
      await fetch(base + path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify(body),
      })
    ).json();
  const get = async (path, token) =>
    (await fetch(base + path, { headers: { Authorization: 'Bearer ' + token } })).json();

  // Wait for the server to come up
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(base + '/health');
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  try {
    const a = await post('/api/auth/signup', {
      email: 'a@test.com',
      password: 'secret1',
      displayName: 'Alice',
    });
    console.log('SIGNUP A ok, buddyCode:', a.user.buddyCode);

    const b = await post('/api/auth/signup', {
      email: 'b@test.com',
      password: 'secret1',
      displayName: 'Bob',
    });
    console.log('SIGNUP B ok');

    const login = await post('/api/auth/login', { email: 'a@test.com', password: 'secret1' });
    if (!login.token) throw new Error('login failed: ' + JSON.stringify(login));
    console.log('LOGIN ok');

    const reqResult = await post('/api/buddies/request', { buddyCode: b.user.buddyCode }, a.token);
    console.log('REQUEST:', reqResult.message || JSON.stringify(reqResult));

    const bList = await get('/api/buddies', b.token);
    console.log('INCOMING for B:', bList.incomingRequests.length);

    const acc = await post('/api/buddies/' + bList.incomingRequests[0].linkId + '/accept', {}, b.token);
    console.log('ACCEPT:', acc.message || JSON.stringify(acc));

    const ci = await post(
      '/api/checkins',
      { mood: 'good', streakDays: 5, moneySaved: 120.5, note: 'doing well' },
      b.token
    );
    if (!ci.checkin || !ci.checkin.id) throw new Error('checkin failed: ' + JSON.stringify(ci));
    console.log('CHECKIN ok, fields:', Object.keys(ci.checkin).join(','));

    const bc = await get('/api/checkins/buddy/' + b.user.id, a.token);
    console.log('BUDDY CHECKINS:', bc.checkins.length, 'by', bc.buddy.displayName);

    const aList = await get('/api/buddies', a.token);
    console.log('A BUDDIES:', aList.buddies.length);

    console.log('ALL API TESTS PASSED');
  } catch (err) {
    console.log('TEST FAILED:', err.message);
    console.log('--- server output ---');
    console.log(serverOut);
    process.exitCode = 1;
  } finally {
    server.kill();
    await mongo.stop();
  }
}

main();
