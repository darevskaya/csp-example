declare const demoMarkupBrand: unique symbol;

export type DemoMarkup = string & {
  readonly [demoMarkupBrand]: true;
};

export function defineDemoMarkup(markup: string): DemoMarkup {
  return markup as DemoMarkup;
}
