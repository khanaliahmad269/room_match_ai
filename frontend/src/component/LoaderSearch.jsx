import React, { useState, useEffect } from "react";

const LoaderSearch = () => {
  const messages = [
    "Processing...",
    "Almost there...",
    "Finalizing...",
    "Hang tight..."
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 5000); // changes every 2 seconds

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="position-fixed inset-0 bg-black bg-opacity-50 d-flex flex-column align-items-center justify-content-center z-3 min-vh-100 w-100">
      {/* Spinner */}
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>

      {/* Cycling messages */}
      <p className="text-white fs-5">{messages[index]}</p>
    </div>
  );
};

export default LoaderSearch;
