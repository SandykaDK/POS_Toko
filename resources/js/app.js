import './styles.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('app')).render(React.createElement(App));
