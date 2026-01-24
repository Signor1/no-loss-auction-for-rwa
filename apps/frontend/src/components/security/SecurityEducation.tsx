'use client';

import React, { useState } from 'react';

const TIPS = [
    {
        title: 'Transaction Signing Safety',
        content: 'Always double-check the contract address and function name in your wallet before clicking "Confirm". Malicious sites can swap addresses at the last second.',
        category: 'wallet'
    },
    {
        title: 'Private Key Ownership',
        content: 'Your seed phrase is the master key to your funds. Never enter it into any website or share it with anyone claiming to be "support".',
        category: 'basics'
    },
    {
        title: 'Browser Extension hygiene',
        content: 'Only install trusted wallet extensions. Disable or remove extensions you no longer use, as they may have broad permissions to read your web data.',
        category: 'security'
    }
];

export const SecurityEducation = () => {
    const [currentTip, setCurrentTip] = useState(0);

    return (
        <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center space-x-2 mb-6">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Education Series</span>
                </div>

                <h3 className="text-3xl font-black italic tracking-tighter mb-4">{TIPS[currentTip].title}</h3>
                <p className="text-indigo-100 text-sm leading-relaxed mb-8 min-h-[80px]">
                    {TIPS[currentTip].content}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                        {TIPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${i === currentTip ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                            ></div>
                        ))}
                    </div>
                    <button
                        onClick={() => setCurrentTip((currentTip + 1) % TIPS.length)}
                        className="bg-white text-indigo-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition shadow-lg"
                    >
                        Next Lesson
                    </button>
                </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-indigo-500 rounded-full blur-[100px] opacity-50"></div>
            <div className="absolute top-4 right-8 text-white/5 font-black text-9xl pointer-events-none select-none">
                SAFE
            </div>
        </div>
    );
};
