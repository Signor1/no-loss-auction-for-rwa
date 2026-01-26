'use client';

import React from 'react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    alt: string; // Enforce alt as required string
    fallbackText?: string;
}

export const AccessibleImage: React.FC<Props> = ({ alt, fallbackText, ...props }) => {
    // If no alt is provided in a real app, it would be a lint error. 
    // Here we ensure it's at least passed to the DOM for screen readers.
    return (
        <div className="relative group">
            <img
                {...props}
                alt={alt}
                className={`max-w-full h-auto ${props.className || ''}`}
            />
            {fallbackText && (
                <span className="sr-only">{fallbackText}</span>
            )}
        </div>
    );
};
