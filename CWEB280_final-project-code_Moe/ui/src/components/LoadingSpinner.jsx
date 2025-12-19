import { MoonLoader } from 'react-spinners';

function LoadingSpinner({ message = 'Loading...', size = 'md', fullScreen = false }) {
    const sizeMap = {
        sm: 20,
        md: 35,
        lg: 50
    };

    const spinnerSize = sizeMap[size] || sizeMap.md;

    if (fullScreen) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <MoonLoader color="#570df8" size={50} />
                {message && <p className="mt-4 text-base-content/70">{message}</p>}
            </div>
        );
    }

    return (
        <span className="inline-flex items-center gap-2">
            <MoonLoader color="#570df8" size={spinnerSize} />
            {message && <span>{message}</span>}
        </span>
    );
}

export default LoadingSpinner;