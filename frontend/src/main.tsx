import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import Layout from './components/Layout';
import {DeviceProvider} from './components/Context/DeviceContext';
import {LoadingProvider} from './components/Context/LoaderContext';
import Loader from './components/Loader';
import {PopupProvider} from './components/Context/PopupContext';

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
