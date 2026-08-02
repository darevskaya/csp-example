import { describe, expect, it } from 'vitest';
import { examples, getExample } from '../../src/examples/registry';

describe('registry', () => {
  it('has 8 examples', () => {
    expect(examples).toHaveLength(8);
  });

  it('all example ids are unique', () => {
    const ids = examples.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all examples have required fields', () => {
    for (const example of examples) {
      expect(example.id).toBeTruthy();
      expect(example.title).toBeTruthy();
      expect(example.description).toBeTruthy();
      expect(example.defaultHref).toBeTruthy();
      expect(example.modes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('all mode ids are unique within each example', () => {
    for (const example of examples) {
      const modeIds = example.modes.map((m) => m.id);
      expect(new Set(modeIds).size).toBe(modeIds.length);
    }
  });

  it('defaultHref matches one of the mode hrefs', () => {
    for (const example of examples) {
      const hrefs = example.modes.map((m) => m.href);
      expect(hrefs).toContain(example.defaultHref);
    }
  });

  it('all mode states are safe or unsafe', () => {
    for (const example of examples) {
      for (const mode of example.modes) {
        expect(['safe', 'unsafe']).toContain(mode.state);
      }
    }
  });

  it('each non-reporting example has at least one safe mode and one unsafe mode', () => {
    for (const example of examples.filter((e) => e.topic === 'csp')) {
      const states = example.modes.map((m) => m.state);
      expect(states).toContain('safe');
      expect(states).toContain('unsafe');
    }
  });

  it('getExample returns the correct example by id', () => {
    const ex = getExample('nonce');
    expect(ex?.title).toBe('Per-request nonce');
  });

  it('getExample returns undefined for unknown id', () => {
    expect(getExample('not-real')).toBeUndefined();
  });

  it('all mode hrefs match /examples/... pattern', () => {
    for (const example of examples) {
      for (const mode of example.modes) {
        expect(mode.href).toMatch(/^\/examples\/[\w-]+(\/[\w-]+)+$/);
      }
    }
  });
});
