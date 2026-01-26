'use client';

import React from 'react';

export const GlossaryEntry = ({ item }: { item: any }) => {
    return (
        <div className="group p-6 bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-300">
            <h4 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-tight group-hover:scale-105 origin-left transition-transform italic">{item.title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-4">
                {item.content}
            </p>
            <div className="flex flex-wrap gap-2">
                {item.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded-full font-bold text-gray-400 uppercase tracking-widest">{tag}</span>
                ))}
            </div>
        </div>
    );
};
