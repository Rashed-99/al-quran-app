import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { icon: Loader2, spin: true, text: 'Preparing…', color: 'text-slate-400' },
  running: { icon: Loader2, spin: true, text: 'Working…', color: 'text-violet-500' },
  in_progress: { icon: Loader2, spin: true, text: 'Working…', color: 'text-violet-500' },
  completed: { icon: CheckCircle2, spin: false, text: 'Done', color: 'text-emerald-500' },
  success: { icon: CheckCircle2, spin: false, text: 'Done', color: 'text-emerald-500' },
  failed: { icon: AlertCircle, spin: false, text: 'Failed', color: 'text-rose-500' },
  error: { icon: AlertCircle, spin: false, text: 'Error', color: 'text-rose-500' },
};

function formatToolName(name) {
  return (name || '')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const rawStatus = toolCall.status || 'pending';
  const status = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.pending;
  const Icon = status.icon;

  let parsedResults = toolCall.results;
  if (typeof parsedResults === 'string') {
    try { parsedResults = JSON.parse(parsedResults); } catch { /* keep raw */ }
  }

  const isFailed = ['failed', 'error'].includes(rawStatus) ||
    (typeof parsedResults === 'string' && /error|failed/i.test(parsedResults)) ||
    (parsedResults && typeof parsedResults === 'object' && parsedResults.success === false);

  const display = isFailed ? STATUS_CONFIG.failed : status;

  return (
    <div className="mt-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 touch-manipulation"
      >
        <Icon className={`w-3.5 h-3.5 ${display.color} ${display.spin ? 'animate-spin' : ''}`} />
        <span className={`font-medium ${display.color}`}>{formatToolName(toolCall.name)}</span>
        <span className="text-slate-400 dark:text-slate-500">— {display.text}</span>
        <span className="ml-auto text-slate-400">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>
      {expanded && parsedResults !== undefined && (
        <div className="px-3 pb-3">
          <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">Result</p>
          <pre className="bg-white dark:bg-slate-900 rounded p-2 text-[10px] overflow-x-auto text-slate-600 dark:text-slate-300 max-h-40 overflow-y-auto">
            {typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {message.content && (
          isUser ? (
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl rounded-tr-md px-4 py-2.5 shadow-sm">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-700">
              <ReactMarkdown
                components={{
                  h1: ({node, ...p}) => <h3 className="text-base font-bold mt-3 mb-1" {...p} />,
                  h2: ({node, ...p}) => <h3 className="text-base font-bold mt-3 mb-1" {...p} />,
                  h3: ({node, ...p}) => <h3 className="text-sm font-bold mt-2 mb-1" {...p} />,
                  p: ({node, ...p}) => <p className="text-sm my-1 leading-relaxed" {...p} />,
                  ul: ({node, ...p}) => <ul className="text-sm my-1 ml-4 list-disc space-y-0.5" {...p} />,
                  ol: ({node, ...p}) => <ol className="text-sm my-1 ml-4 list-decimal space-y-0.5" {...p} />,
                  li: ({node, ...p}) => <li className="text-sm" {...p} />,
                  strong: ({node, ...p}) => <strong className="font-semibold" {...p} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )
        )}
        {message.tool_calls?.map((toolCall, idx) => (
          <ToolCallDisplay key={idx} toolCall={toolCall} />
        ))}
      </div>
    </div>
  );
}