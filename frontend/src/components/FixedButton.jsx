// src/components/FixedButton.js
// eslint-disable-next-line no-unused-vars
import React from 'react';
import { Link } from 'react-router-dom';  // Import Link from react-router-dom
import { FaUserDoctor } from 'react-icons/fa6';  // Import the icon from react-icons/fa
import './FixedButton.css'; // Your styles

const FixedButton = () => {
    return (
        <Link to="/doc-mate" className="fixed-button">
            <FaUserDoctor size={24} /> {/* The icon with a size of 24px */}
        </Link>
    );
};

export default FixedButton;
