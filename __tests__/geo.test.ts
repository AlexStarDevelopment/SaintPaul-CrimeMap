import { calculateDistanceMiles } from '../lib/geo';

describe('calculateDistanceMiles', () => {
  it('computes ~8.6 miles between downtown Minneapolis and downtown St Paul', () => {
    // Minneapolis City Hall: 44.9778, -93.2650
    // Saint Paul Landmark Center: 44.9442, -93.0936
    const d = calculateDistanceMiles(44.9778, -93.265, 44.9442, -93.0936);
    expect(d).toBeGreaterThan(8);
    expect(d).toBeLessThan(10);
  });

  it('returns 0 for identical coordinates', () => {
    const d = calculateDistanceMiles(44.95, -93.09, 44.95, -93.09);
    expect(d).toBeCloseTo(0, 6);
  });
});
