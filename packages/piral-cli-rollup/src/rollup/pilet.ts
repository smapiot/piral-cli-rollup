import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import codegen from 'rollup-plugin-codegen';
import pilet from 'rollup-plugin-pilet';
import postcss from 'rollup-plugin-postcss';
import replace from '@rollup/plugin-replace';
import type { PiletBuildHandler } from 'piral-cli';
import { resolve } from 'path';
import { runRollup } from './bundler-run';
import { getVariables } from '../utils';

function nameOf(path: string) {
  return path.replace(/\.js$/, '');
}

function getPackageName() {
  return process.env.BUILD_PCKG_NAME;
}

function getRequireRef() {
  const name = getPackageName();
  return `rolluppr_${name.replace(/\W/gi, '')}`;
}

const handler: PiletBuildHandler = {
  create(options) {
    const piletName = getPackageName();
    const requireRef = getRequireRef();
    const external: Array<string> = [];
    const id = nameOf(options.outFile);
    const input = {
      [id]: options.entryModule,
    };

    // first populate with global externals
    options.externals.forEach((name) => {
      external.push(name);
    });

    // then populate with distributed externals
    options.importmap.forEach((dep) => {
      external.push(dep.name);
    });

    // finally add the local importmap entries to the bundler entry points
    options.importmap.forEach((dep) => {
      if (dep.type === 'local') {
        input[nameOf(dep.ref)] = dep.entry;
      }
    });

    return runRollup({
      input,
      debug: options.watch,
      outFile: options.outFile,
      requireRef,
      output: {
        format: 'system',
        sourcemap: options.sourceMaps ?? true,
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
          minimize: !options.develop,
          extensions: ['.css', '.scss', '.sass', '.pcss', '.sss'],
        }),
        pilet({
          id,
          piletName,
          requireRef,
          importmap: options.importmap,
          debug: options.develop,
        }),
      ],
    });
  },
};

export const create = handler.create;
