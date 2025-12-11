import {
    HiOutlineCheckCircle,
    HiOutlineExclamationTriangle,
    HiOutlineXCircle,
    HiOutlineInformationCircle,
    HiOutlineXMark
} from 'react-icons/hi2';

function AlertMessage({ type = 'info', message, onDismiss }) {
    const alertConfig = {
        success: {
            className: 'alert-success',
            Icon: HiOutlineCheckCircle
        },
        error: {
            className: 'alert-error',
            Icon: HiOutlineXCircle
        },
        danger: {
            className: 'alert-error',
            Icon: HiOutlineXCircle
        },
        warning: {
            className: 'alert-warning',
            Icon: HiOutlineExclamationTriangle
        },
        info: {
            className: 'alert-info',
            Icon: HiOutlineInformationCircle
        }
    };

    const config = alertConfig[type] || alertConfig.info;
    const Icon = config.Icon;

    return (
        <div className={`alert ${config.className} mb-4`}>
            <Icon className="h-6 w-6 shrink-0" />
            <span>{message}</span>
            {onDismiss && (
                <button
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                >
                    <HiOutlineXMark className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}

export default AlertMessage;
