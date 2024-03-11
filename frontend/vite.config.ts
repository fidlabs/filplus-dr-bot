import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {NodeGlobalsPolyfillPlugin} from '@esbuild-plugins/node-globals-polyfill';
import wasm from 'vite-plugin-wasm';
import {nodePolyfills} from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		wasm(),
		nodePolyfills({
			globals: {
				Buffer: true, // can also be 'build', 'dev', or false
				global: true,
				process: true,
			},
		}),
	],
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
			plugins: [],
		},
	},
	server: {
		host: true,
		port: 8000,
	},
});
