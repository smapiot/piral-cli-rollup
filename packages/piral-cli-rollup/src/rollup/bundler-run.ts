import { rollup, watch, InputOptions, OutputOptions } from 'rollup';
import { EventEmitter } from 'events';

interface RollupOptions extends InputOptions {
  debug: boolean;
  output: OutputOptions;
  outFile: string;
  requireRef?: string;
}

export function runRollup(options: RollupOptions) {
  const { debug, output, outFile, requireRef, ...input } = options;
  const eventEmitter = new EventEmitter();
  const bundle = {
    outFile: `/${outFile}`,
    outDir: output.dir,
    name: outFile,
    requireRef,
  };

  return Promise.resolve({
    async bundle() {
      if (debug) {
        const watcher = watch({ ...input, output });
        watcher.on('event', (event) => {
          if (event.code === 'ERROR') {
            console.log(event);
          } else if (event.code === 'BUNDLE_START') {
          } else if (event.code === 'BUNDLE_END') {
            event.result.close();
          } else if (event.code === 'END') {
            eventEmitter.emit('end', bundle);
          }
        });
        eventEmitter.emit('start', bundle);
      } else {
        const b = await rollup(input);
        await b.write(output);
      }

      return bundle;
    },
    onStart(cb) {
      eventEmitter.on('start', cb);
    },
    onEnd(cb) {
      eventEmitter.on('end', cb);
    },
  });
}
