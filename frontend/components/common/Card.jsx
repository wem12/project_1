import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  title, 
  subtitle,
  footer,
  className = '',
  padding = true,
  shadow = true,
  border = false,
  ...props 
}) => {
  const baseStyles = 'bg-white rounded-lg overflow-hidden';
  const shadowStyles = shadow ? 'shadow-md' : '';
  const borderStyles = border ? 'border border-gray-200' : '';
  const paddingStyles = padding ? 'p-4' : '';
  
  return (
    <div 
      className={`${baseStyles} ${shadowStyles} ${borderStyles} ${className}`}
      {...props}
    >
      {title && (
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      
      <div className={paddingStyles}>
        {children}
      </div>
      
      {footer && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.node,
  subtitle: PropTypes.node,
  footer: PropTypes.node,
  className: PropTypes.string,
  padding: PropTypes.bool,
  shadow: PropTypes.bool,
  border: PropTypes.bool
};

export default Card; 