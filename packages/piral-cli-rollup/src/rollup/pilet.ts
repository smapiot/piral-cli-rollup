import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import codegen from 'rollup-plugin-codegen';
import pilet from 'rollup-plugin-pilet';
import scss from 'rollup-plugin-scss';
import type { PiletBuildHandler } from 'piral-cli';
import { join } from 'path';
import { runRollup } from './bundler-run';

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
    const outputStyle: any = 'outputStyle';
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
        sourcemap: options.sourceMaps,
        dir: options.outDir,
      },
      external,
      plugins: [
        nodeResolve(),
        commonjs(),
        typescript(),
        codegen(),
        pilet({
          id,
          piletName,
          requireRef,
          importmap: options.importmap,
          debug: options.develop,
        }),
        scss({
          output: join(options.outDir, 'style.css'),
          [outputStyle]: 'compressed',
          sourceMap: true,
        }),
      ],
    });
  },
};

export const create = handler.create;
