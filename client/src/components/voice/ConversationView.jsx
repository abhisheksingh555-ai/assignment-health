import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";

const ConversationView = ({
  messages,
  processing,
}) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, processing]);

  return (
    <div className="flex h-[430px] flex-col overflow-y-auto px-5 py-6 sm:px-8">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
            🩺
          </div>

          <h3 className="text-base font-semibold text-slate-800">
            Your screening will appear here
          </h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Start the call and speak naturally.
            Our AI assistant will ask you a few
            questions about your health.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {messages.map((message, index) => (
            <MessageBubble
              key={`${index}-${message.role}`}
              role={message.role}
              text={message.text}
            />
          ))}

          {processing && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                AI
              </div>

              <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default ConversationView;