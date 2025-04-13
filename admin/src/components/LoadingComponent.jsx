// eslint-disable-next-line no-unused-vars
import React from 'react';

const LoadingComponent = ({ message, icon }) => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center bg-white px-8 py-6 rounded-xl shadow-lg animate-pulse">
                {icon}
                <p className="text-gray-700 text-lg font-medium text-center">
                    {message}
                </p>
                <p className="text-gray-500 text-sm mt-2 text-center">
                    Please wait while we process your request
                </p>
            </div>
        </div>
    );
};

export default LoadingComponent;
