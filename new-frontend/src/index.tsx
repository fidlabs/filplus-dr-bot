import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {LoadingProvider} from "./components/Context/LoaderContext";
import {DeviceProvider} from "./components/Context/DeviceContext";
import Loader from "./components/Loader";
import Layout from "./components/Layout/Layout";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// window.buffer = window.buffer

root.render(
    <React.StrictMode>
        <LoadingProvider>
            <DeviceProvider>
                <Loader/>
                <Layout>
                    <App />
                </Layout>
            </DeviceProvider>
        </LoadingProvider>
    </React.StrictMode>
);
