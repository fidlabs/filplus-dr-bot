import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import Layout from './components/Layout';
import {DeviceProvider} from './components/Context/DeviceContext.tsx';
import {LoadingProvider} from './components/Context/LoaderContext.tsx';
import Loader from './components/Loader/index.tsx';
import {PopupProvider} from './components/Context/PopupContext.tsx';

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
