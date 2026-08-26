'use client';

// ============================================================================
// File: frontend/src/app/interview/[sessionId]/page.tsx
// Description: Live Interview Session with minimal chrome (no persistent sidebar),
//              token-by-token streaming AI probes, speech waveform visualizer, and progress pill.
// ============================================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  LogOut,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  feedback?: string;
}

export default function LiveInterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(2); // Question 3 of 6
  const [showEndModal, setShowEndModal] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello Rohan, I'm Aura from the Stripe Core Infrastructure team. Let's start with your Kafka streaming background: how do you manage consumer group rebalances during heavy traffic spikes without dropping event throughput?",
      timestamp: '10:02 AM',
      feedback: 'Good conversational opening',
    },
    {
      id: '2',
      sender: 'user',
      text: 'We implemented cooperative sticky assigners to prevent stop-the-world partition revocations across 120 broker nodes, combined with static group membership to handle transient restarts smoothly.',
      timestamp: '10:04 AM',
      feedback: 'Excellent STAR structure & precision metrics (+94% score)',
    },
    {
      id: '3',
      sender: 'ai',
      text: 'That makes sense. Now, describe a scenario where you had to perform live zero-downtime schema migrations on a PostgreSQL cluster handling 250M queries daily. What safeguards did you apply?',
      timestamp: '10:05 AM',
    },
  ]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulate next AI question streaming response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Great details on shadow writes. How do you monitor query degradation and rollback if p99 latency breaches 5ms?',
          timestamp: 'Just now',
        },
      ]);
      setCurrentQuestionIndex((prev) => Math.min(prev + 1, 6));
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F7EFE8] dark:bg-[#0A0A0C] text-[#1A1A1E] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors duration-300">
      {/* Minimal Top Header (Maximized immersion) */}
      <header className="h-14 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#121217]/90 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm text-[#1A1A1E] dark:text-white">
            Placemind Live Session
          </span>
          <div className="h-4 w-px bg-black/[0.1] dark:bg-white/[0.1]" />
          <span className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] hidden sm:inline">
            Staff Software Architect &bull; Stripe
          </span>
        </div>

        {/* Question Progress Indicator */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#6C5CE7]/12 text-[#6C5CE7] dark:text-[#8F82FF] border border-[#6C5CE7]/20">
            Question {currentQuestionIndex} of 6
          </span>

          <button
            onClick={() => setShowEndModal(true)}
            className="text-xs font-semibold text-[#EF4444] hover:text-[#DC2626] flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </header>

      {/* Centered Conversational Chat Column */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-4 sm:p-5 rounded-3xl max-w-[85%] text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#6C5CE7] text-white rounded-br-md shadow-md'
                    : 'bg-white dark:bg-[#141417] text-[#1A1A1E] dark:text-white border border-black/[0.08] dark:border-white/[0.08] rounded-bl-md shadow-sm'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-1.5 font-bold text-[#6C5CE7] dark:text-[#8F82FF] text-[10px] uppercase mb-1">
                    <Sparkles className="w-3 h-3" /> Aura &bull; AI Interviewer
                  </div>
                )}
                <p>{msg.text}</p>
              </div>

              {/* Turn-by-Turn Clarity Feedback Chip */}
              {msg.feedback && (
                <span className="text-[10px] text-[#16A34A] dark:text-[#22C55E] font-semibold mt-1 px-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {msg.feedback}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar with Voice Toggle */}
        <div className="p-3 rounded-2xl bg-white/90 dark:bg-[#141417]/95 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl backdrop-blur-2xl space-y-3">
          {isRecording && (
            <div className="p-2.5 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-between text-xs text-[#6C5CE7] font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                Listening to your microphone...
              </span>
              <button
                onClick={() => setIsRecording(false)}
                className="text-[10px] uppercase font-bold text-[#EF4444]"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                isRecording
                  ? 'bg-[#EF4444] text-white shadow-md'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#5A5A63] dark:text-[#A1A1AA] hover:text-[#6C5CE7]'
              }`}
              title="Toggle Voice Input"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              placeholder="Type your response here or speak..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 p-2.5 text-xs bg-transparent focus:outline-none text-[#1A1A1E] dark:text-white"
            />

            <Button
              variant="primary"
              size="sm"
              icon={<Send className="w-3.5 h-3.5" />}
              onClick={handleSendMessage}
            >
              Send
            </Button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal to End Session */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141417] border border-black/[0.1] dark:border-white/[0.1] shadow-2xl max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-[#1A1A1E] dark:text-white">
              End Interview Session?
            </h3>
            <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] leading-relaxed">
              We will synthesize your response transcript and generate your comprehensive communication report.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowEndModal(false)}>
                Continue Interview
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/interview/${sessionId}/report`)}
              >
                View Final Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
