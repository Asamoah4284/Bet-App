// Temporary end-to-end test: starts an in-memory MongoDB, boots the server,
// and exercises the signup / buddy / check-in flows.
const { spawn } = require('child_process');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongo = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 },
  });
  console.log('In-memory MongoDB at', mongo.getUri());

  const server = spawn(process.execPath, ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, MONGODB_URI: mongo.getUri('betapp'), PORT: '3100' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverOut = '';
  server.stdout.on('data', (d) => (serverOut += d));
  server.stderr.on('data', (d) => (serverOut += d));
  server.on('error', (err) => {
    serverOut += `\nspawn error: ${err.message}`;
  });

  const base = 'http://127.0.0.1:3100';
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
  let healthy = false;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(base + '/health');
      if (res.ok) {
        healthy = true;
        break;
      }
    } catch {
      // still starting
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!healthy) {
    console.log('TEST FAILED: server never became healthy');
    console.log('--- server output ---');
    console.log(serverOut);
    server.kill();
    await mongo.stop();
    process.exitCode = 1;
    return;
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

    const c = await post('/api/auth/signup', {
      email: 'c@test.com',
      password: 'secret1',
      displayName: 'Charlie',
      username: 'charlie_1',
    });
    if (!c.token || c.user.username !== 'charlie_1') {
      throw new Error('signup with username failed: ' + JSON.stringify(c));
    }
    const byUsername = await post('/api/auth/login', {
      identifier: 'Charlie_1',
      password: 'secret1',
    });
    if (!byUsername.token) {
      throw new Error('login by username failed: ' + JSON.stringify(byUsername));
    }
    console.log('LOGIN BY USERNAME ok');

    const forgot = await post('/api/auth/forgot-password', { email: 'a@test.com' });
    if (!forgot.message) throw new Error('forgot-password failed: ' + JSON.stringify(forgot));
    await new Promise((r) => setTimeout(r, 300)); // let the log line flush
    const codeMatch = serverOut.match(/\[password-reset\] code for a@test\.com: (\d{6})/);
    if (!codeMatch) throw new Error('reset code not found in server logs');
    const reset = await post('/api/auth/reset-password', {
      email: 'a@test.com',
      code: codeMatch[1],
      newPassword: 'newsecret2',
    });
    if (!reset.token) throw new Error('reset-password failed: ' + JSON.stringify(reset));
    const reLogin = await post('/api/auth/login', {
      identifier: 'a@test.com',
      password: 'newsecret2',
    });
    if (!reLogin.token) throw new Error('login after reset failed: ' + JSON.stringify(reLogin));
    console.log('FORGOT/RESET PASSWORD ok');

    const updatedProfile = await (
      await fetch(base + '/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + a.token,
        },
        body: JSON.stringify({
          displayName: 'Alice Updated',
          username: 'alice.recovery',
          bio: 'One day at a time.',
          leaderboardOptIn: true,
          searchDiscoverable: true,
        }),
      })
    ).json();
    if (
      updatedProfile.user.displayName !== 'Alice Updated' ||
      !updatedProfile.user.leaderboardOptIn ||
      !updatedProfile.user.searchDiscoverable
    ) {
      throw new Error('profile update failed: ' + JSON.stringify(updatedProfile));
    }
    const searchAlice = await get('/api/buddies/search?q=alice', b.token);
    if (
      searchAlice.results.length !== 1 ||
      searchAlice.results[0].username !== 'alice.recovery' ||
      searchAlice.results[0].email
    ) {
      throw new Error('discoverable buddy search failed: ' + JSON.stringify(searchAlice));
    }
    const hiddenCharlie = await get('/api/buddies/search?q=charlie', b.token);
    if (hiddenCharlie.results.length !== 0) {
      throw new Error('private user appeared in search: ' + JSON.stringify(hiddenCharlie));
    }
    console.log('PRIVATE BUDDY SEARCH ok');

    await post(
      '/api/profile/sync-stats',
      { streakDays: 12, moneyKept: 240, urgesLogged: 4, journalEntries: 8 },
      a.token
    );
    const globalBoard = await get('/api/profile/leaderboard?scope=global', a.token);
    if (globalBoard.entries[0]?.streakDays !== 12) {
      throw new Error('global leaderboard failed: ' + JSON.stringify(globalBoard));
    }
    const sharedProfile = await get('/api/profile/share/' + a.user.buddyCode);
    if (sharedProfile.profile?.buddyCode !== a.user.buddyCode) {
      throw new Error('shared profile failed: ' + JSON.stringify(sharedProfile));
    }
    console.log('PROFILE, SHARE LINK & LEADERBOARD ok');

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
