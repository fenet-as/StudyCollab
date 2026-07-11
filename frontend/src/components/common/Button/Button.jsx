import React from 'react';
import PropTypes from 'prop-types';
import styles from './Button.module.css';

export default function Button({
  children,
  onClick,
  variant = 'primary', // 'primary', 'secondary', 'outline', or 'text'
  size = 'medium',     // 'small', 'medium', or 'large'
  type = 'button',
  disabled = false,
  className = '',      // Allow passing custom classes for one-off overrides
  ...rest              // Catch-all for other native attributes (e.g., aria-labels)
}) {
  // Dynamically compile the class names based on the passed props
  const buttonClass = `
    ${styles.baseButton}
    ${styles[variant]}
    ${styles[size]}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}

// PropTypes help ensure other developers (or you) use the component correctly
Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'text']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  type: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};