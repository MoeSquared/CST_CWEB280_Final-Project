import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { HiOutlineBookOpen } from 'react-icons/hi2';
import { useAuth } from '../hooks/useApi';
import FormInput from '../components/FormInput';
import AlertMessage from '../components/AlertMessage';

function Register({ onRegister }) {
    const navigate = useNavigate();
    const { register, loading } = useAuth();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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

        if (!formData.firstName.trim()) {
            errors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            errors.lastName = 'Last name is required';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        } else if (!/[A-Z]/.test(formData.password)) {
            errors.password = 'Password must contain at least one uppercase letter';
        } else if (!/[0-9]/.test(formData.password)) {
            errors.password = 'Password must contain at least one number';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        const result = await register(
            formData.firstName,
            formData.lastName,
            formData.email,
            formData.password
        );

        if (result.success) {
            if (onRegister) {
                onRegister(result.data.userInfo);
            }
            navigate('/');
        } else {
            setError(result.error);
        }
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
                        <p className="text-base-content/60">Create your account</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <AlertMessage
                            type="error"
                            message={error}
                            onDismiss={() => setError('')}
                        />
                    )}

                    {/* Registration form */}
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                id="firstName"
                                name="firstName"
                                label="First Name"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="John"
                                required
                                error={validationErrors.firstName}
                            />
                            <FormInput
                                id="lastName"
                                name="lastName"
                                label="Last Name"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Doe"
                                required
                                error={validationErrors.lastName}
                            />
                        </div>

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
                            placeholder="Min. 6 characters"
                            required
                            error={validationErrors.password}
                            helpText="Must include uppercase letter and number"
                        />

                        <FormInput
                            id="confirmPassword"
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            required
                            error={validationErrors.confirmPassword}
                        />

                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-4"
                            disabled={loading}
                        >
                            {loading && <span className="loading loading-spinner loading-sm"></span>}
                            Create Account
                        </button>
                    </form>

                    {/* Login link */}
                    <div className="text-center mt-6">
                        <p className="text-base-content/60">
                            Already have an account?{' '}
                            <Link to="/login" className="link link-primary">
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
