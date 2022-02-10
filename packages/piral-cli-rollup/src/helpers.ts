import { existsSync } from 'fs';
import { RollupOptions } from 'rollup';
import { resolve } from 'path';
import { defaultRollupConfig } from './constants';

export function extendConfig(rollupConfig: RollupOptions, root: string): RollupOptions {
  const otherConfigPath = resolve(root, defaultRollupConfig);

  if (existsSync(otherConfigPath)) {
    const otherConfig = require(otherConfigPath);

    if (typeof otherConfig === 'function') {
      rollupConfig = otherConfig(rollupConfig);
    } else if (typeof otherConfig === 'object') {
      return {
        ...rollupConfig,
        ...otherConfig,
      };
    } else {
      console.warn(`Did not recognize the export from "${otherConfigPath}". Skipping.`);
    }
  }

  return rollupConfig;
}
