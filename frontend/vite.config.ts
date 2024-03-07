import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {NodeGlobalsPolyfillPlugin} from '@esbuild-plugins/node-globals-polyfill';
import wasm from 'vite-plugin-wasm';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), wasm()],
	resolve: {
		alias: {
			'/src': path.resolve(__dirname, 'src'),
			'/': path.resolve(__dirname, './'),
		},
	},
	optimizeDeps: {
		esbuildOptions: {
			define: {
				global: 'globalThis',
			},
			plugins: [
				NodeGlobalsPolyfillPlugin({
					buffer: true,
					process: true,
				}),
			],
		},
	},
	server: {
		host: true,
		port: 8000,
	},
});
