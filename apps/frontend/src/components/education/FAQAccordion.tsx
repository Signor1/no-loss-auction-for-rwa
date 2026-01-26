'use client';

import React, { useState } from 'react';

export const FAQAccordion = ({ faqs }: { faqs: any[] }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="space-y-4">
            {faqs.map((faq, i) => (
                <div key={faq._id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border dark:border-gray-700 shadow-sm transition-all">
                    <button
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                        className="w-full text-left p-6 flex justify-between items-center group"
                    >
                        <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{faq.title}</span>
                        <div className={`h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center transition-transform duration-300 ${openIndex === i ? 'rotate-180 bg-indigo-600 text-white' : 'group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900 group-hover:text-indigo-600'}`}>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </button>
                    {openIndex === i && (
                        <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="pt-4 border-t dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                {faq.content}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
