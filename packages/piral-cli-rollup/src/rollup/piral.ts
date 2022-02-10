import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import html from '@rollup/plugin-html';
import codegen from 'rollup-plugin-codegen';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import type { PiralBuildHandler } from 'piral-cli';
import { resolve } from 'path';
import { runRollup } from './bundler-run';
import { inspectHtml, makeHtmlAttributes, getVariables } from '../utils';

const handler: PiralBuildHandler = {
  create(options) {
    const external: Array<string> = [];
    const { template, entries } = inspectHtml(options.root, options.entryFiles);

    return runRollup({
      input: entries,
      debug: options.watch,
      outFile: options.outFile,
      output: {
        format: 'amd',
        sourcemap: options.sourceMaps,
        dir: options.outDir,
      },
      external,
      plugins: [
        nodeResolve(),
        commonjs(),
        typescript(),
        codegen(),
        replace({
          values: getVariables(),
          preventAssignment: true,
        }),
        postcss({
          extract: resolve(options.outDir, 'style.css'),
          use: ['sass'],
          minimize: !options.emulator,
          sourceMap: options.sourceMaps,
          extensions: ['.css', '.scss', '.sass', '.pcss', '.sss'],
        }),
        html({
          publicPath: options.publicUrl,
          template({ files, attributes, meta, publicPath }) {
            const prefix = publicPath.endsWith('/') ? publicPath : `${publicPath}/`;
            const [script] = (files.js || []).map(({ fileName }) => fileName);

            if (script) {
              template('head').append(
                `<script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js" data-main="${prefix}${script}" async defer></script>`,
              );
            }

            (files.css || [{ fileName: 'style.css' }]).forEach(({ fileName }) => {
              const attrs = makeHtmlAttributes(attributes.link);
              template('head').append(`<link href="${prefix}${fileName}" rel="stylesheet"${attrs}>`);
            });

            meta.forEach((input) => {
              const attrs = makeHtmlAttributes(input);
              template('head').append(`<meta${attrs}>`);
            });

            return template.html({});
          },
        }),
      ],
    });
  },
};

export const create = handler.create;
