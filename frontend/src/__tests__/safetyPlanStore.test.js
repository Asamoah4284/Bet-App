import {
  DEFAULT_ACTIONS,
  DEFAULT_REASONS,
  parsePlanList,
} from '../store/safetyPlanStore';

jest.mock('../services/localDb', () => ({
  getSetting: jest.fn(),
  setSetting: jest.fn(),
}));

describe('parsePlanList', () => {
  it('normalizes saved plan items', () => {
    const value = JSON.stringify(['  My family  ', '', 12, 'My health']);

    expect(parsePlanList(value, DEFAULT_REASONS)).toEqual(['My family', 'My health']);
  });

  it('falls back for missing or malformed values', () => {
    expect(parsePlanList(null, DEFAULT_REASONS)).toBe(DEFAULT_REASONS);
    expect(parsePlanList('{bad json', DEFAULT_ACTIONS)).toBe(DEFAULT_ACTIONS);
    expect(parsePlanList(JSON.stringify([]), DEFAULT_ACTIONS)).toBe(DEFAULT_ACTIONS);
  });

  it('limits a plan to eight concise items', () => {
    const items = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

    expect(parsePlanList(JSON.stringify(items), DEFAULT_REASONS)).toHaveLength(8);
  });
});
