'use client';

// ============================================================================
// File: frontend/src/app/interview/page.tsx
// Description: Tab 5 - Interview: Split Setup Form (Left) + Live Simulation (Right)
//              from Wireframe v1 with persistent bottom AI command bar.
// ============================================================================

import React, { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import { TopBar } from '@/components/app/TopBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import {
  Mic,
  MicOff,
  Sparkles,
  Send,
  UserCheck,
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  feedback?: string;
}

export default function InterviewTab() {
  const [interviewType, setInterviewType] = useState<'real' | 'ai'>('real');
  const [targetCompany, setTargetCompany] = useState('Stripe · Core Infrastructure');
  const [questionCount, setQuestionCount] = useState(6);
  const [isGenerated, setIsGenerated] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello Rohan, I'm Aura from the Stripe Core Infrastructure team. Let's start with your Kafka streaming experience: how do you manage consumer group rebalances during heavy traffic spikes without dropping event throughput?",
      feedback: 'Recruiter Signal: High-throughput Kafka architecture',
    },
    {
      id: '2',
      sender: 'user',
      text: 'We implemented cooperative sticky assigners to prevent stop-the-world partition revocations across 120 broker nodes, combined with static group membership to handle transient restarts.',
      feedback: '✓ Excellent STAR clarity (+94% precision rating)',
    },
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Great details on shadow writes. How do you monitor query degradation and rollback if p99 latency breaches 5ms?',
        },
      ]);
    }, 1200);
  };

  return (
    <AppShell>
      <TopBar
        title="Interview Practice"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Interview Practice' },
        ]}
      />

      {/* Split Layout from Wireframe v1 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[calc(100vh-64px)] pb-20">
        {/* ----------------------------------------------------------------- */}
        {/* LEFT PANEL: Setup Form (Type, Target, Question Count, Difficulty)  */}
        {/* ----------------------------------------------------------------- */}
        <aside className="w-full lg:w-[380px] p-6 space-y-6 overflow-y-auto bg-white/70 dark:bg-[#121217]/90 border-r border-black/[0.08] dark:border-white/[0.08] flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#1A1A1E] dark:text-white">
              Interview Setup
            </h2>
            <p className="text-xs text-[#5A5A63] dark:text-[#A1A1AA] mt-0.5">
              Configure recruiter persona and focus areas.
            </p>
          </div>

          {/* Type of Interview (Real Recruiter vs AI Practice Coach) */}
          <div className="space-y-2">
            <Label>Type of Interview</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInterviewType('real')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  interviewType === 'real'
                    ? 'border-[#FACC15] bg-[#FACC15]/20 text-[#0A0A0C] dark:text-[#FACC15] font-black shadow-md shadow-[#FACC15]/10 ring-1 ring-[#FACC15]'
                    : 'border-black/[0.1] dark:border-white/[0.1] text-[#4A4A52] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <UserCheck className="w-4 h-4 mb-1 text-[#FACC15]" />
                <div className="text-xs font-bold">Real Recruiter</div>
                <div className="text-[10px] text-[#7A7A85]">Strict tone & depth</div>
              </button>

              <button
                type="button"
                onClick={() => setInterviewType('ai')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  interviewType === 'ai'
                    ? 'border-[#FACC15] bg-[#FACC15]/20 text-[#0A0A0C] dark:text-[#FACC15] font-black shadow-md shadow-[#FACC15]/10 ring-1 ring-[#FACC15]'
                    : 'border-black/[0.1] dark:border-white/[0.1] text-[#4A4A52] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Bot className="w-4 h-4 mb-1 text-[#FACC15]" />
                <div className="text-xs font-bold">AI Practice</div>
                <div className="text-[10px] text-[#7A7A85]">Coaching mode</div>
              </button>
            </div>
          </div>

          <Separator />

          {/* Target Company / Specialization */}
          <div className="space-y-1.5">
            <Label>Company & Specialization</Label>
            <Input
              type="text"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
            />
          </div>

          {/* Number of Questions */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <Label className="mb-0">Questions Count</Label>
              <span className="font-mono font-black text-[#854D0E] dark:text-[#FACC15]">{questionCount} Probes</span>
            </div>
            <input
              type="range"
              min={3}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-[#FACC15]"
            />
          </div>

          <div className="pt-2">
            <Button
              variant="default"
              size="default"
              icon={<Sparkles className="w-4 h-4 text-[#0A0A0C]" />}
              className="w-full font-black text-[#0A0A0C]"
              onClick={() => setIsGenerated(true)}
            >
              Generate Questionnaire
            </Button>
          </div>
        </aside>

        {/* ----------------------------------------------------------------- */}
        {/* RIGHT PANEL: Live Interactive Chat & Speech Stage                 */}
        {/* ----------------------------------------------------------------- */}
        <main className="flex-1 p-6 flex flex-col justify-between overflow-hidden bg-black/[0.02] dark:bg-black/30">
          {/* Timeline */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#6C5CE7] text-white rounded-br-none shadow-md'
                      : 'bg-white dark:bg-[#141417] text-[#1A1A1E] dark:text-white border border-black/[0.08] dark:border-white/[0.08] rounded-bl-none shadow-sm'
                  }`}
                >
                  {m.sender === 'ai' && (
                    <div className="text-[10px] font-bold uppercase text-[#6C5CE7] dark:text-[#8F82FF] mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Aura &bull; Recruiter
                    </div>
                  )}
                  <p>{m.text}</p>
                </div>

                {m.feedback && (
                  <span className="text-[10px] text-[#16A34A] dark:text-[#22C55E] font-semibold mt-1 px-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {m.feedback}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Voice & Input Controls */}
          <div className="p-3 rounded-2xl bg-white/90 dark:bg-[#141417]/95 border border-black/[0.08] dark:border-white/[0.08] shadow-xl flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isRecording ? 'bg-[#EF4444] text-white' : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#8A8A92]'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <Input
              type="text"
              placeholder="Type your response or speak out loud..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />

            <Button variant="default" size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={handleSend}>
              Send
            </Button>
          </div>
        </main>
      </div>
    </AppShell>
  );
}
