import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import Layout from './components/Layout/Layout';
import {DeviceProvider} from './components/Context/DeviceContext';
import {LoadingProvider} from './components/Context/LoaderContext';
import Loader from './components/Loader/index';

document.body.innerHTML = '<div id="root"></div>';

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
