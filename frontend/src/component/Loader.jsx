import React from 'react';

const LoaderDemo = () => {
  return (
    <div className="position-fixed inset-0 bg-black bg-opacity-50 d-flex flex-column align-items-center justify-content-center z-3 min-vh-100 w-100">
      {/* Spinner */}
      <div class="spinner-border text-primary" role="status">
  <span class="visually-hidden">Loading...</span>
</div>
      
      {/* Processing message */}
      <p className="text-white font-medium text-gray-700">
        Processing...
      </p>
    </div>
  );
};

export default LoaderDemo;