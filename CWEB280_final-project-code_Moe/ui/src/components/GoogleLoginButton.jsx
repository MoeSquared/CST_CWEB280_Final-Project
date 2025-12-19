// GoogleLoginButton.jsx intended to authenticate with google and then authenticate and authorize through movie-api
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authenticateWithAPIGoogleCallback } from "../api/oauthService.js";

export default function GoogleLoginButton({ onLogin }) {

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSuccess = async (googleResponse) => {
        setError(null);
        setLoading(true);

        try
        {
            const dataFromAPI = await authenticateWithAPIGoogleCallback(googleResponse);
            console.log('DEBUG AUTH Data from API', dataFromAPI);

            // Check for errors from backend
            if (dataFromAPI.error || dataFromAPI.detail) {

                setError(dataFromAPI.detail || dataFromAPI.error);
                console.error(dataFromAPI.detail || dataFromAPI.error);
            }
            else {
                // Store JWT from api into localStorage
                localStorage.setItem('token', dataFromAPI.token);
                localStorage.setItem('userEmail',dataFromAPI.userInfo.email);

                // Call onLogin callback if provided
                if (onLogin) {
                    onLogin(dataFromAPI.userInfo);
                }
                else {
                    // refresh windows
                    window.location.reload();
                }
            }
        }
        catch (err) {
            console.error('Google login error:', err);
            setError('Network error. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };

    const handleError = () => {
        setError('Google sign-in failed');
        console.error('Login Failed')
    };

    return (
        <div>
            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError(null)}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            {/* Loading state or Google Button */}
            {loading ? (
                <button className="btn btn-outline-secondary" disabled>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                </button>
            ) : (
                <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
            )}
        </div>
    );
}