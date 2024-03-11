import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import Layout from './components/Layout/Layout.js';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<Layout>
			<App />
		</Layout>
	</React.StrictMode>,
);
