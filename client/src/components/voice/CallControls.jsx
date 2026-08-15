const CallControls = ({
  onStart,
  onSpeak,
  onStop,
  onEnd,
  connected,
  recording,
  processing,
}) => {
  return (
    <div className="flex flex-col items-center gap-5">

      {!connected ? (
        <button
          type="button"
          onClick={onStart}
          className="group flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 transition hover:scale-105 hover:bg-emerald-700 active:scale-95"
        >
          <div className="flex flex-col items-center">
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18.5a6.5 6.5 0 006.5-6.5V6a6.5 6.5 0 00-13 0v6a6.5 6.5 0 006.5 6.5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11.5a7 7 0 01-14 0M12 18.5V22m-4 0h8"
              />
            </svg>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-4">

          <button
            type="button"
            disabled={processing}
            onClick={
              recording
                ? onStop
                : onSpeak
            }
            className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              recording
                ? "bg-red-500 shadow-red-500/20 hover:bg-red-600"
                : "bg-slate-900 shadow-slate-900/20 hover:bg-slate-800"
            }`}
          >
            {recording ? (
              <div className="h-6 w-6 rounded-md bg-white" />
            ) : (
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18.5a6.5 6.5 0 006.5-6.5V6a6.5 6.5 0 00-13 0v6a6.5 6.5 0 006.5 6.5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11.5a7 7 0 01-14 0M12 18.5V22m-4 0h8"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={onEnd}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200 active:scale-95"
            title="End call"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </div>
      )}

      {!connected ? (
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            Start your health screening
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Click the microphone to begin
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            {recording
              ? "Listening to you..."
              : processing
              ? "Processing your response..."
              : "Tap the microphone and speak"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            End the call whenever you're finished
          </p>
        </div>
      )}
    </div>
  );
};

export default CallControls;