import path from 'path';
import stdLibBrowser from 'node-stdlib-browser';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import DotenvPlugin from 'dotenv-webpack';

const config: webpack.Configuration = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "DataCap Monitoring",
    }),
    new DotenvPlugin(),
    new webpack.ProvidePlugin({
      process: stdLibBrowser.process,
      Buffer: [stdLibBrowser.buffer, 'Buffer']
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: stdLibBrowser,
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  experiments: {
    syncWebAssembly: true,
  },
  optimization: {
    // this setting incorrectly orphans wasm :(
    // FIXME: maybe some simple import + console.log is able to force webpack to bundle wasm?
    sideEffects: false,
  },
};

export default config;