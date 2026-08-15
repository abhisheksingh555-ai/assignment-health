const MessageBubble = ({ role, text }) => {
  const isAssistant = role === "assistant";

  return (
    <div
      className={`flex w-full ${
        isAssistant
          ? "justify-start"
          : "justify-end"
      }`}
    >
      <div
        className={`flex max-w-[85%] gap-3 ${
          isAssistant
            ? "flex-row"
            : "flex-row-reverse"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            isAssistant
              ? "bg-slate-900 text-white"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isAssistant ? "AI" : "You"}
        </div>

        {/* Message */}
        <div>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
              isAssistant
                ? "rounded-tl-md bg-slate-100 text-slate-800"
                : "rounded-tr-md bg-emerald-600 text-white"
            }`}
          >
            {text}
          </div>

          <p
            className={`mt-1 text-[11px] text-slate-400 ${
              isAssistant
                ? "text-left"
                : "text-right"
            }`}
          >
            {isAssistant
              ? "Health Assistant"
              : "You"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;