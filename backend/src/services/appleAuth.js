const { createRemoteJWKSet, jwtVerify } = require('jose');

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

/**
 * Audience for native Sign in with Apple is the iOS bundle identifier.
 * Override with APPLE_CLIENT_ID if you ever use a Services ID instead.
 */
function appleAudience() {
  return process.env.APPLE_CLIENT_ID || 'com.betapp.recovery';
}

/**
 * Verifies an Apple identityToken and returns the JWT payload
 * ({ sub, email?, email_verified? }).
 */
async function verifyAppleIdentityToken(identityToken) {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience: appleAudience(),
  });
  return payload;
}

module.exports = {
  verifyAppleIdentityToken,
  appleAudience,
};
