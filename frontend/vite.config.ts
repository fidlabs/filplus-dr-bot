import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import wasm from 'vite-plugin-wasm';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		wasm(),
		topLevelAwait(),
		nodeResolve(),
		nodePolyfills({
			globals: {
				Buffer: true, // can also be 'build', 'dev', or false
				global: true,
				process: true,
			},
		}),
		commonjs(),
	],
	resolve: {
		alias: {
			'/src': path.resolve(__dirname, 'src'),
			'/': path.resolve(__dirname, './'),
		},
	},
	server: {
		host: true,
		port: 8000,
	},
});
