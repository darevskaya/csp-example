const BASE: Record<string, string> = {
  'frame-ancestors': "'none'",
};

export function csp(overrides: Record<string, string> = {}): string {
  const directives = { ...BASE, ...overrides };
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v}`)
    .join('; ');
}
