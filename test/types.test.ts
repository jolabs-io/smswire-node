import { readFileSync, writeFileSync } from 'node:fs';
import openapiTS, { astToString } from 'openapi-typescript';
import { expect, it } from 'vitest';

/* src/types.gen.ts is generated from ../openapi.json. Regenerate with `pnpm --filter smswire generate`. */
it('src/types.gen.ts is up to date with sdks/openapi.json', async () => {
  const spec = JSON.parse(readFileSync(new URL('../../openapi.json', import.meta.url), 'utf8'));
  const ast = await openapiTS(spec, { alphabetize: true, defaultNonNullable: false });
  const text = `// Generated from sdks/openapi.json by test/types.test.ts. Do not edit.\n/* eslint-disable */\n${astToString(ast)}`;
  const file = new URL('../src/types.gen.ts', import.meta.url);
  if (process.env.UPDATE_TYPES) writeFileSync(file, text);
  expect(readFileSync(file, 'utf8')).toBe(text);
});
