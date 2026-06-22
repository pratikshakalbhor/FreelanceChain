import { shortenAddress, formatAmount } from './soroban';

describe('Soroban Utilities', () => {
  test('shortenAddress formats Stellar address correctly', () => {
    const addr = 'GDUXWQNSPNM5GUMP3KWXSNOY62GRKPRHUD6IKDJORCRET7CWBKQ3TVR4';
    expect(shortenAddress(addr)).toBe('GDUXWQ...TVR4');
  });

  test('shortenAddress returns empty string for null', () => {
    expect(shortenAddress(null)).toBe('');
  });

  test('formatAmount converts stroops to XLM string', () => {
    expect(formatAmount(100000000)).toBe('10.00');
    expect(formatAmount(5000000)).toBe('0.50');
  });
});
