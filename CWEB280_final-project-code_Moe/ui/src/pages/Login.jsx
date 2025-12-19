import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { HiOutlineBookOpen } from 'react-icons/hi2';
import { useAuth } from '../hooks/useApi';
import FormInput from '../components/FormInput';

function Login({ onLogin }) {
    const navigate = useNavigate();
    const { login, loading } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const result = await login(formData.email, formData.password, formData.rememberMe);

        if (result.success) {
            if (onLogin) {
                onLogin(result.data.userInfo);
            }
            navigate('/');
        } else {
            toast.error(result.error || 'Login failed');
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await fetch('http://localhost:8080/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: credentialResponse.credential })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', data.userInfo.email);
                if (onLogin) {
                    onLogin(data.userInfo);
                }
                navigate('/');
            } else {
                toast.error(data.detail || 'Google login failed');
            }
        } catch (err) {
            toast.error('Failed to authenticate with Google');
        }
    };

    const handleGoogleError = () => {
        toast.error('Google login failed. Please try again.');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-4">
                            <HiOutlineBookOpen className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="card-title justify-center text-2xl">Course Tracker</h2>
                        <p className="text-base-content/60">Sign in to your account</p>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleSubmit} data-cy="login-form" noValidate>
                        <FormInput
                            id="email"
                            name="email"
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            required
                            error={validationErrors.email}
                        />

                        <FormInput
                            id="password"
                            name="password"
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                            error={validationErrors.password}
                        />

                        <div className="form-control">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="checkbox checkbox-primary checkbox-sm"
                                    data-cy="input-rememberMe"
                                />
                                <span className="label-text">Remember me</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-4"
                            disabled={loading}
                            data-cy="login-submit"
                        >
                            {loading && <span className="loading loading-spinner loading-sm"></span>}
                            Sign In
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="divider">OR</div>

                    {/* Google Login */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="outline"
                            size="large"
                            width="100%"
                        />
                    </div>

                    {/* Register link */}
                    <div className="text-center mt-6">
                        <p className="text-base-content/60">
                            Don't have an account?{' '}
                            <Link to="/register" className="link link-primary">
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;