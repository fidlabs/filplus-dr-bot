import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import Layout from './components/Layout/Layout.js';
import {DeviceProvider} from './components/Context/DeviceContext.js';
import {LoadingProvider} from './components/Context/LoaderContext.js';
import Loader from './components/Loader/index.js';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<LoadingProvider>
			<DeviceProvider>
				<Loader/>
				<Layout>
					<App />
				</Layout>
			</DeviceProvider>
		</LoadingProvider>
	</React.StrictMode>,
);
