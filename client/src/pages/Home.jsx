import ConversationView from "../components/voice/ConversationView";
import CallControls from "../components/voice/CallControls";
import VoiceStatus from "../components/voice/VoiceStatus";

import { useVoiceCall } from "../hooks/useVoiceCall";
import { useRecorder } from "../hooks/useRecorder";

const Home = () => {
  const voice = useVoiceCall();
  const recorder = useRecorder();

  const startSpeak = async () => {
    try {
      await recorder.startRecording();
    } catch (error) {
      console.error(
        "Microphone permission error:",
        error
      );
    }
  };

  const stopSpeak = async () => {
    try {
      const buffer =
        await recorder.stopRecording();

      voice.sendAudio(buffer);
    } catch (error) {
      console.error(
        "Recording error:",
        error
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">

        {/* Intro */}
        <div className="mb-8 text-center">

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Let's talk about how you're feeling.
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Have a short conversation with our AI
            health assistant. It will ask about your
            symptoms and summarize the information
            at the end.
          </p>

        </div>

        {/* TTS Warning */}
        {voice.ttsAvailable === false && (
          <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex gap-3">

              <div className="mt-0.5 text-amber-600">
                ⚠️
              </div>

              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Voice playback unavailable
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  The AI conversation can continue,
                  but audio playback is temporarily
                  unavailable.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Screening conversation
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                AI health assistant
              </p>
            </div>

            <VoiceStatus
              connected={voice.connected}
              recording={recorder.recording}
              processing={voice.processing}
            />

          </div>

          {/* Conversation */}
          <ConversationView
            messages={voice.messages}
            processing={voice.processing}
          />

          {/* Controls */}
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-8 sm:px-7">

            <CallControls
              onStart={voice.startCall}
              onSpeak={startSpeak}
              onStop={stopSpeak}
              onEnd={voice.endCall}
              connected={voice.connected}
              recording={recorder.recording}
              processing={voice.processing}
            />

          </div>

        </div>

      </main>

    </div>
  );
};

export default Home;