import {
  addCustomBlockDomain,
  normalizeDomain,
  removeCustomBlockDomain,
} from '../services/localDb';

jest.mock('expo-sqlite', () => {
  const rows = new Map();
  return {
    openDatabaseAsync: async () => ({
      execAsync: async () => {},
      runAsync: async (sql, ...params) => {
        if (sql.includes('INSERT INTO custom_block_domains')) {
          rows.set(params[0], { domain: params[0], label: params[1] });
        }
        if (sql.includes('DELETE FROM custom_block_domains')) {
          rows.delete(params[0]);
        }
      },
      getAllAsync: async () => Array.from(rows.values()),
      getFirstAsync: async () => null,
    }),
  };
});

describe('shield custom domains', () => {
  test('normalizes domains before storage', () => {
    expect(normalizeDomain('https://WWW.SportyBet.com/path')).toBe('sportybet.com');
  });

  test('rejects invalid domains', async () => {
    await expect(addCustomBlockDomain('notadomain')).rejects.toThrow(/valid domain/i);
  });

  test('stores and removes a custom domain', async () => {
    await addCustomBlockDomain('https://Betway.com.gh/foo', 'Betway');
    // list uses the mocked db; add should succeed without throw
    await removeCustomBlockDomain('betway.com.gh');
  });
});
