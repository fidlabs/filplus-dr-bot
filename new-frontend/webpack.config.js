const webpack = require('webpack');
// const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const stdLibBrowser = require('node-stdlib-browser');
const {
    NodeProtocolUrlPlugin
} = require('node-stdlib-browser/helpers/webpack/plugin');

module.exports = function (webpackEnv) {
    return {
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: stdLibBrowser,
            fallback: {
                "assert": require.resolve("assert"),
                "stream": require.resolve("stream"),
                "buffer": require.resolve('buffer/'),
            }
        },
        plugins: [
            new NodeProtocolUrlPlugin(),
            new webpack.ProvidePlugin({
                process: stdLibBrowser.process,
                Buffer: [stdLibBrowser.buffer, 'Buffer']
            })
        ],
    }
}