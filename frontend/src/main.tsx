import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';
import Layout from './components/Layout/Layout.js';
import { DeviceProvider } from './context/DeviceContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DeviceProvider>
      <Layout>
        <App />
      </Layout>
    </DeviceProvider>
  </React.StrictMode>
);
