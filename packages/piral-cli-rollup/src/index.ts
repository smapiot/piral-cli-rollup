import * as actions from './actions';
import { CliPlugin } from 'piral-cli';

const plugin: CliPlugin = (cli) => {
  cli.withBundler('rollup', actions);
};

module.exports = plugin;
