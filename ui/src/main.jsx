import React, {StrictMode} from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import {GoogleOAuthProvider} from "@react-oauth/google";
import './index.css';


const root = document.getElementById('root');

ReactDOM.createRoot(root).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </GoogleOAuthProvider>
    </StrictMode>

);