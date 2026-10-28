import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Send, Sparkles, Volume2, HelpCircle } from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

interface VoiceQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitQuestion: (question: string) => Promise<string>;
}

export const VoiceQueryModal: React.FC<VoiceQueryModalProps> = ({
  isOpen,
  onClose,
  onSubmitQuestion,
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  const sampleQuestions = [
    'Is it safe to cross the street right now?',
    "What's directly in front of my feet?",
    'Is there any empty seat nearby?',
    'What does the sign above me say?',
    'Who is standing in front of me and what are they doing?',
    'Where is the elevator button or door handle?',
  ];

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setAnswer(null);
      setIsLoading(false);
      setIsListening(false);
    }
  }, [isOpen]);

  const handleAsk = async (textToAsk: string) => {
    const q = textToAsk.trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setAnswer(null);
    setQuery(q);

    try {
      const response = await onSubmitQuestion(q);
      setAnswer(response);
      soundEngine.speak(response, true);
    } catch (err: unknown) {
      const errText = 'Could not get an answer right now. Please try again.';
      setAnswer(errText);
      soundEngine.speak(errText);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'en-US';

      recognizer.onstart = () => {
        setIsListening(true);
        soundEngine.playTactileTick();
      };

      recognizer.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        handleAsk(transcript);
      };

      recognizer.onerror = () => {
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognizer.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-neutral-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Have a look: Ask AI Vision</h3>
              <p className="text-xs text-zinc-400">Ask any environmental or safety question</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk(query);
            }}
            placeholder='e.g., "Is the crosswalk light green?"'
            className="flex-1 bg-neutral-950 border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
          />

          <button
            onClick={toggleVoiceInput}
            className={`p-3 rounded-xl border transition-all ${
              isListening
                ? 'bg-red-600 text-white border-red-400 animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border-white/10'
            }`}
            title="Speech input"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={() => handleAsk(query)}
            disabled={!query.trim() || isLoading}
            className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold transition-all"
            title="Send question"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Sample Voice Quick Buttons */}
        <div className="mb-4">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
            Suggested Quick Queries
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(sq)}
                disabled={isLoading}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/5 text-zinc-300 hover:text-white transition-all text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Answer Output Card */}
        {(isLoading || answer) && (
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 mt-4">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice Assistant Response</span>
            </div>
            <p className="text-sm font-medium text-zinc-100 leading-relaxed">
              {isLoading ? (
                <span className="flex items-center gap-2 text-cyan-300">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Examining scene with Gemini...
                </span>
              ) : (
                answer
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
