// src/App.jsx
import React from 'react';
// import { BrowserRouter } from 'react-router-dom'; // Убрали, т.к. перенесли в main.jsx
import AppRouter from './routes/AppRouter.jsx';

function App() {
    return (
        // <BrowserRouter> // Убрали, т.к. перенесли в main.jsx
        <AppRouter />
        // </BrowserRouter>
    );
}

export default App;