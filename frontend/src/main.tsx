import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import Layout from './components/Layout/Layout.js';
import {DeviceProvider} from './components/Context/DeviceContext.js';
import {LoadingProvider} from './components/Context/LoaderContext.js';
import Loader from './components/Loader/index.js';
import {PopupProvider} from './components/Context/PopupContext.js';

document.body.innerHTML = '<div id="root"></div>';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<LoadingProvider>
			<PopupProvider>
				<DeviceProvider>
					<Loader />
					<Layout>
						<App />
					</Layout>
				</DeviceProvider>
			</PopupProvider>
		</LoadingProvider>
	</React.StrictMode>,
);
