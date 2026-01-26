'use client';

import React from 'react';

export const TutorialCard = ({ tutorial }: { tutorial: any }) => {
    return (
        <div className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border dark:border-gray-700 flex flex-col h-full">
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
                {tutorial.metadata?.thumbnail ? (
                    <img src={tutorial.metadata.thumbnail} alt={tutorial.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                        <svg className="h-12 w-12 text-indigo-600/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                )}
                {tutorial.metadata?.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-2xl">
                            <svg className="h-6 w-6 text-indigo-600 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                    </div>
                )}
                <div className="absolute top-4 left-4">
                    <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                        {tutorial.metadata?.difficulty || 'General'}
                    </span>
                </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{tutorial.category}</span>
                </div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter leading-tight uppercase italic">{tutorial.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-8 flex-1">
                    {tutorial.summary || tutorial.content.substring(0, 100) + '...'}
                </p>

                <button className="w-full py-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-indigo-500/20">
                    Watch Tutorial
                </button>
            </div>
        </div>
    );
};
