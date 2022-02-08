import type { SharedDependency } from 'piral-cli';
import { Plugin } from 'rollup';
import { insertStylesheet, modifyImports, prependBanner } from './banner';

export interface PiletPluginOptions {
  id: string;
  debug: boolean;
  importmap: Array<SharedDependency>;
  requireRef: string;
  piletName: string;
}

export default function pilet({ id, debug, piletName, importmap, requireRef }: PiletPluginOptions): Plugin {
  return {
    name: 'pilet',
    renderChunk(content, { map, isEntry, name }) {
      const modifiedContent = modifyImports(content, importmap);

      if (isEntry && name === id) {
        const body = insertStylesheet(modifiedContent, piletName, debug);
        const code = prependBanner(body, requireRef, importmap);
        return { code, map };
      } else {
        const code = modifiedContent;
        return { code, map };
      }
    },
  };
}
