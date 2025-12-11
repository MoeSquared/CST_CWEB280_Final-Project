function LoadingSpinner({ message = 'Loading...', size = 'md', fullScreen = false }) {
    const sizeClasses = {
        sm: 'loading-sm',
        md: 'loading-md',
        lg: 'loading-lg'
    };

    if (fullScreen) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <span className={`loading loading-spinner loading-lg text-primary`}></span>
                {message && <p className="mt-4 text-base-content/70">{message}</p>}
            </div>
        );
    }

    return (
        <span className="inline-flex items-center gap-2">
            <span className={`loading loading-spinner ${sizeClasses[size]}`}></span>
            {message && <span>{message}</span>}
        </span>
    );
}

export default LoadingSpinner;
