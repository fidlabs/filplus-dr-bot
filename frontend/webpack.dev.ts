import { merge } from 'webpack-merge';
import common from './webpack.common';
import 'webpack-dev-server';

export default merge(common, {
  devtool: 'inline-source-map',
  mode: 'development',
  devServer: {
    client: {
      overlay: false,
    },
  },
});