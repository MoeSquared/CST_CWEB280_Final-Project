// components/Login.jsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import GoogleLoginButton from "../components/GoogleLoginButton.jsx";
import { fetchCallToAPI } from "../api/apiService.js";

const URL_OAUTH_API = `${import.meta.env.VITE_OAUTH_BASE}`;

export default function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/";

    // Handle email/password login
    async function handleSubmit(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        try {
            const data = await fetchCallToAPI(`${URL_OAUTH_API}/login`, "POST", {
                email,
                password,
                remember_me: rememberMe
            });

            if (data.error || data.detail) {
                setErr(data.detail || data.error || "Invalid email or password.");
            } else {
                // Store token in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', data.userInfo.email);

                // Call the onLogin callback
                if (onLogin) {
                    onLogin(data.userInfo);
                }

                navigate(from, { replace: true });
            }
        } catch (error) {
            console.error('Login error:', error);
            setErr("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function handleGoogleLogin(userInfo) {
        if (onLogin) {
            onLogin(userInfo);
        }
        navigate(from, { replace: true });
    }

    return (
        <div className="container py-5" style={{ maxWidth: 420 }}>
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <h2 className="mb-4 text-center">Sign In</h2>

                    {err && (
                        <div className="alert alert-danger" role="alert">
                            {err}
                        </div>
                    )}

                    {/* Email/Password Form */}
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-3">
                            <label className="form-label align-content-start" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Remember Me Checkbox */}
                        <div className="mb-3 form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                disabled={loading}
                            />
                            <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
                        </div>

                        <button
                            className="btn btn-primary w-100 mb-3"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Google Sign-In Button Component */}
                    <div className="mb-3">
                        <GoogleLoginButton onLogin={handleGoogleLogin} />
                    </div>

                    {/* Register Link */}
                    <div className="text-start mt-3">
                        <p className="mb-0">
                            Don't have an account?&nbsp;
                            <Link to="/register" className="text-decoration-none">Create one</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}