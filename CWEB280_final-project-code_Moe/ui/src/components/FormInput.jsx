function FormInput({
                       id,
                       name,
                       label,
                       type = 'text',
                       value,
                       onChange,
                       placeholder,
                       required = false,
                       error,
                       helpText,
                       options = [],
                       rows = 3,
                       accept,
                       min,
                       max,
                       step,
                       disabled = false,
                       className = ''
                   }) {
    const inputClasses = `w-full ${error ? 'input-error' : ''}`;

    // Render different input types
    const renderInput = () => {
        switch (type) {
            case 'select':
                return (
                    <select
                        id={id}
                        name={name}
                        value={value}
                        onChange={onChange}
                        className={`select select-bordered ${inputClasses} ${className}`}
                        required={required}
                        disabled={disabled}
                        data-cy={`input-${name}`}
                    >
                        <option value="">{placeholder || 'Select an option'}</option>
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case 'textarea':
                return (
                    <textarea
                        id={id}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`textarea textarea-bordered ${inputClasses} ${className}`}
                        rows={rows}
                        required={required}
                        disabled={disabled}
                        data-cy={`input-${name}`}
                    />
                );

            case 'checkbox':
                return (
                    <input
                        type="checkbox"
                        id={id}
                        name={name}
                        checked={value}
                        onChange={onChange}
                        className={`checkbox checkbox-primary ${className}`}
                        required={required}
                        disabled={disabled}
                        data-cy={`input-${name}`}
                    />
                );

            case 'file':
                return (
                    <input
                        type="file"
                        id={id}
                        name={name}
                        onChange={onChange}
                        className={`file-input file-input-bordered ${inputClasses} ${className}`}
                        accept={accept}
                        required={required}
                        disabled={disabled}
                        data-cy={`input-${name}`}
                    />
                );

            default:
                return (
                    <input
                        type={type}
                        id={id}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`input input-bordered ${inputClasses} ${className}`}
                        required={required}
                        min={min}
                        max={max}
                        step={step}
                        disabled={disabled}
                        data-cy={`input-${name}`}
                    />
                );
        }
    };

    // Checkbox has different layout
    if (type === 'checkbox') {
        return (
            <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                    {renderInput()}
                    <span className="label-text">{label}</span>
                </label>
                {error && <span className="text-error text-sm mt-1" data-cy={`error-${name}`}>{error}</span>}
            </div>
        );
    }

    return (
        <div className="form-control w-full mb-4">
            {label && (
                <label className="label" htmlFor={id}>
                    <span className="label-text">
                        {label}
                        {required && <span className="text-error ml-1">*</span>}
                    </span>
                </label>
            )}
            {renderInput()}
            {helpText && !error && (
                <label className="label">
                    <span className="label-text-alt text-base-content/60">{helpText}</span>
                </label>
            )}
            {error && (
                <label className="label">
                    <span className="label-text-alt text-error" data-cy={`error-${name}`}>{error}</span>
                </label>
            )}
        </div>
    );
}

export default FormInput;