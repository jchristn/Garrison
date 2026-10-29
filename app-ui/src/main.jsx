import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n'; // initialize i18next before first paint
import { applyTheme, resolveTheme } from './utils/theme.js';
import App from './App.jsx';
import './index.css';

applyTheme(resolveTheme());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
