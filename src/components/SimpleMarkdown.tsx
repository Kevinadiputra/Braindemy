// src/components/SimpleMarkdown.tsx
'use client';

import React from 'react';

interface SimpleMarkdownProps {
  content: string;
  isKidMode: boolean;
}

export default function SimpleMarkdown({ content, isKidMode }: SimpleMarkdownProps) {
  const parseMarkdown = (text: string) => {
    let html = text;
    
    // Code blocks extraction
    const codeBlocks: string[] = [];
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
      codeBlocks.push(code.trim());
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // Replace basic tags
    html = html
      .replace(/### (.*)/g, '<h3 class="text-xl font-bold mt-5 mb-3 text-indigo-400 font-space-grotesk">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="text-2xl font-bold mt-7 mb-4 text-violet-400 font-space-grotesk border-b border-slate-800 pb-2">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-100">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-300">$1</em>')
      .replace(/^-\s(.*)/gm, '<li class="list-disc ml-6 mb-2 text-slate-300">$1</li>')
      .replace(/^\s*\n/gm, '<br/>')
      .replace(/> (.*)/g, '<blockquote class="border-l-4 border-violet-500 pl-4 py-1.5 my-4 italic bg-slate-900/60 rounded-r-md text-slate-400">$1</blockquote>');

    // Restore code blocks
    codeBlocks.forEach((code, index) => {
      const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html = html.replace(`__CODE_BLOCK_${index}__`, 
        `<pre class="bg-slate-950 border border-slate-800 p-4 rounded-xl my-4 overflow-x-auto text-sm font-mono text-cyan-400"><code>${escaped}</code></pre>`
      );
    });

    // Kid mode custom styling overlays
    if (isKidMode) {
      html = html
        .replace(/class="text-indigo-400 font-space-grotesk"/g, 'class="text-xl font-bold mt-5 mb-2.5 text-pink-500 font-fredoka"')
        .replace(/class="text-violet-400 font-space-grotesk border-b border-slate-800 pb-2"/g, 'class="text-2xl font-black mt-6 mb-3 text-sky-600 font-fredoka bg-sky-50 p-3.5 rounded-2xl border-4 border-slate-800"')
        .replace(/class="font-bold text-slate-100"/g, 'class="font-extrabold text-amber-500 bg-amber-50 px-1 rounded"')
        .replace(/class="list-disc ml-6 mb-2 text-slate-300"/g, 'class="list-none pl-6 relative mb-3 text-slate-700 before:content-[\'⭐\'] before:absolute before:-left-1.5 before:top-0.5"')
        .replace(/class="border-l-4 border-violet-500 pl-4 py-1.5 my-4 italic bg-slate-900\/60 rounded-r-md text-slate-400"/g, 'class="border-4 border-slate-800 pl-4 py-3 my-4 italic bg-indigo-50 rounded-2xl text-slate-700 font-semibold"')
        .replace(/class="bg-slate-950 border border-slate-800 p-4 rounded-xl my-4 overflow-x-auto text-sm font-mono text-cyan-400"/g, 'class="bg-zinc-800 border-4 border-slate-800 p-4 rounded-2xl my-4 text-amber-300 overflow-x-auto"');
    }

    return html;
  };

  return (
    <div 
      className={`leading-relaxed space-y-4 ${isKidMode ? 'text-slate-800 font-fredoka text-lg' : 'text-slate-300 font-outfit text-base'}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
