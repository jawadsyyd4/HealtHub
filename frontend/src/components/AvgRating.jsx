// eslint-disable-next-line no-unused-vars
import React from "react";

const AvgRating = ({ rating, showNumber = true }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const totalStars = 5;

    return (
        <div className="flex items-center gap-1">
            {[...Array(fullStars)].map((_, i) => (
                <span key={`full-${i}`} className="text-yellow-400">★</span>
            ))}

            {halfStar && <span className="text-yellow-400">☆</span>}

            {[...Array(totalStars - fullStars - (halfStar ? 1 : 0))].map((_, i) => (
                <span key={`empty-${i}`} className="text-gray-300">★</span>
            ))}

            {showNumber && (
                <span className="text-sm text-gray-600 ml-2">({rating.toFixed(1)})</span>
            )}
        </div>
    );
};

export default AvgRating;
