const VoiceStatus = ({
  connected,
  recording,
  processing,
}) => {
  let label = "Ready to start";
  let dotClass = "bg-slate-400";

  if (processing) {
    label = "AI is thinking...";
    dotClass = "bg-amber-500";
  } else if (recording) {
    label = "Listening...";
    dotClass = "bg-red-500";
  } else if (connected) {
    label = "Call in progress";
    dotClass = "bg-emerald-500";
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
      <span
        className={`h-2 w-2 rounded-full ${dotClass} ${
          connected || recording
            ? "animate-pulse"
            : ""
        }`}
      />

      <span className="text-xs font-medium text-slate-600">
        {label}
      </span>
    </div>
  );
};

export default VoiceStatus;