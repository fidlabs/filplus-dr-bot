const webpack = require('webpack');
// const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const stdLibBrowser = require('node-stdlib-browser');
const {
    NodeProtocolUrlPlugin
} = require('node-stdlib-browser/helpers/webpack/plugin');

module.exports = function override(config, env) {
    // New config, e.g. config.plugins.push...
    return {
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: stdLibBrowser,
            fallback: {
                "assert": require.resolve("assert"),
                "stream": require.resolve("stream"),
                "buffer": require.resolve('buffer/'),
            },
            ...config.resolve
        },
        plugins: [
            new NodeProtocolUrlPlugin(),
            new webpack.ProvidePlugin({
                process: stdLibBrowser.process,
                Buffer: [stdLibBrowser.buffer, 'Buffer']
            }),
            ...config.plugins
        ],
        ...config
    }
}
