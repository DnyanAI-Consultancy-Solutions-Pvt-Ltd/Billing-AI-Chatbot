import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  Copy,
  Check,
  User,
  Sparkles,
  Mic,
  Square,
  Volume2,
  Loader2,
  Paperclip,
  GitCompare,
  FileText,
  X,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlignLeft,
  Layers,
} from 'lucide-react';
import type { ChatMessage, ResponseCard } from '@/lib/types';
import { sendMessage, speak, uploadDocument } from '@/lib/api';
import ResponseCardView from '@/components/ResponseCardView';
import { useVoice } from '@/hooks/useVoice';
import { useVoiceSettings } from '@/context/VoiceSettings';

// =====================================================
// PDF GENERATION TEMPLATES
// =====================================================
interface GenerationTemplate {
  id: string;
  label: string;
  description: string;
  needsName: boolean;
  buildCommand: (name?: string) => string;
}

const GENERATION_TEMPLATES: GenerationTemplate[] = [
  {
    id: 'patient_report',
    label: 'Patient Report',
    description: "A patient's full record: details, medicines, latest bill.",
    needsName: true,
    buildCommand: (name) => 'generate pdf for ' + name,
  },
  {
    id: 'invoice',
    label: 'Invoice / Bill',
    description: "A patient's most recent bill, formatted as an invoice.",
    needsName: true,
    buildCommand: (name) => 'download invoice for ' + name,
  },
  {
    id: 'prescription',
    label: 'Prescription Slip',
    description: 'Medicines dispensed to a patient, on one slip.',
    needsName: true,
    buildCommand: (name) => 'download prescription for ' + name,
  },
  {
    id: 'patients',
    label: 'Full Patient List',
    description: 'Every registered patient, in one table.',
    needsName: false,
    buildCommand: () => 'download patient list pdf',
  },
  {
    id: 'sales',
    label: 'Medicine Sales Report',
    description: 'Every medicine sale on record, most recent first.',
    needsName: false,
    buildCommand: () => 'download medicine sales report pdf',
  },
  {
    id: 'comparison',
    label: 'Monthly Comparison',
    description: 'This month vs. last month - revenue, bills, medicines sold.',
    needsName: false,
    buildCommand: () => 'compare this month vs last month as pdf',
  },
];

type UploadResult = {
  successes: { filename: string; pages: number; truncated: boolean }[];
  failures: { filename: string; error: string }[];
};

export default function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingSpeechId, setLoadingSpeechId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [dismissedLanding, setDismissedLanding] = useState(false);

  // Staged attachments - shown as removable chips above the input
  // box. Nothing is ever uploaded the moment a file is picked, no
  // matter which entry point opened the file dialog (paperclip
  // button, PDF Comparison tile, or the browse button inside the
  // template picker below). Upload only happens when the user
  // presses Send (see handleSend), by which point they've had a
  // chance to type exactly what they want done with the file(s).
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [showGenerationMenu, setShowGenerationMenu] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<GenerationTemplate | null>(null);
  const [templateNameInput, setTemplateNameInput] = useState('');

  const { recording, transcribing, startRecording, stopRecording } = useVoice();
  const { muted } = useVoiceSettings();

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const stopSpeaking = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      URL.revokeObjectURL(currentAudioRef.current.src);
      currentAudioRef.current = null;
    }
    setSpeakingId(null);
    setLoadingSpeechId(null);
  }, []);

  const handleSpeakClick = useCallback(async (id: string, card: ResponseCard) => {
    if (speakingId === id || loadingSpeechId === id) {
      stopSpeaking();
      return;
    }

    if (speakingId || loadingSpeechId) {
      stopSpeaking();
    }

    setLoadingSpeechId(id);

    const textToSpeak = card.fullText || card.message || card.title;
    const audio = await speak(textToSpeak, card.language);

    setLoadingSpeechId(null);

    if (!audio) return;

    currentAudioRef.current = audio;
    setSpeakingId(id);

    audio.addEventListener('ended', () => {
      if (currentAudioRef.current === audio) {
        currentAudioRef.current = null;
        setSpeakingId(null);
      }
    });
  }, [speakingId, loadingSpeechId, stopSpeaking]);

  // Shared upload loop - the only place that talks to
  // /api/upload-document and builds the successes/failures shape
  // the card needs. Always called from handleSend now, right before
  // the typed question (if any) goes to the AI.
  const performUpload = async (files: File[]): Promise<UploadResult> => {
    const successes: UploadResult['successes'] = [];
    const failures: UploadResult['failures'] = [];

    for (const file of files) {
      try {
        const result = await uploadDocument(file);
        successes.push({ filename: result.filename, pages: result.pages, truncated: result.truncated });
      } catch (err) {
        failures.push({
          filename: file.name,
          error: err instanceof Error ? err.message : 'Upload failed.',
        });
      }
    }

    return { successes, failures };
  };

  const buildUploadCard = (result: UploadResult, note?: string): ResponseCard => {
    if (result.failures.length > 0 && result.successes.length === 0) {
      return {
        kind: 'error',
        title: 'Upload Failed',
        message: result.failures.map((f) => f.filename + ' - ' + f.error).join('\n'),
      };
    }
    return {
      kind: 'documents_uploaded',
      title: 'Documents Uploaded',
      documentsUploaded: { successes: result.successes, failures: result.failures, note },
    };
  };

  // Single send path for everything: typed text alone, files alone,
  // or both together. If there are staged files, they upload first
  // (one combined card), THEN whatever the user typed goes to the
  // AI, which can already see the file(s) just uploaded.
  const handleSend = async (text?: string, language?: string) => {
    const content = (text ?? input).trim();
    const filesToSend = pendingFiles;

    if (!content && filesToSend.length === 0) return;
    if (loading || uploading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content || undefined,
      attachments: filesToSend.length > 0 ? filesToSend.map((f) => f.name) : undefined,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setPendingFiles([]);

    if (filesToSend.length > 0) {
      setUploading(true);
      const result = await performUpload(filesToSend);
      setUploading(false);

      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: 'assistant', card: buildUploadCard(result), timestamp: Date.now() },
      ]);

      // If every file failed to upload, don't also fire the typed
      // question against a possibly-missing document - let the
      // user see the error and decide whether to retry or ask
      // anyway.
      if (result.successes.length === 0) {
        inputRef.current?.focus();
        return;
      }
    }

    if (!content) {
      inputRef.current?.focus();
      return;
    }

    setLoading(true);

    try {
      const card: ResponseCard = await sendMessage(content, language);
      const aiMsgId = crypto.randomUUID();
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        role: 'assistant',
        card,
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, aiMsg]);

      if (!muted) {
        handleSpeakClick(aiMsgId, card);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          card: { kind: 'error', title: 'Request Failed', message: 'Could not reach the AI backend. Please try again.' },
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleMicClick = async () => {
    if (recording) {
      const result = await stopRecording();
      if (result?.text) {
        handleSend(result.text, result.language);
      }
    } else {
      stopSpeaking();
      startRecording();
    }
  };

  // Paperclip button in the chat bar - just opens the picker.
  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  // "PDF Comparison" landing tile - opens the SAME picker as the
  // paperclip and does nothing else (see handleFileSelected for why
  // it must not switch views itself).
  const handleCompareTileClick = () => {
    fileInputRef.current?.click();
  };

  // Browse button inside the "Choose a PDF template" screen
  // (GenerationMenu). Lets the user pick a file straight from that
  // screen instead of first closing the menu and hunting for the
  // paperclip - useful both for generation ("build a report from
  // this uploaded document") and for jumping into comparison
  // without leaving the template picker. Goes through the exact
  // same staging path as every other entry point.
  const handleBrowseFromTemplateMenu = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateTileClick = () => {
    setShowGenerationMenu(true);
  };

  const handleChatTileClick = () => {
    setDismissedLanding(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleBackToMenu = () => {
    setDismissedLanding(false);
    setMessages([]);
    setShowGenerationMenu(false);
    setPendingTemplate(null);
    setTemplateNameInput('');
    setInput('');
    setPendingFiles([]);
  };

  const handlePickTemplate = (template: GenerationTemplate) => {
    if (template.needsName) {
      setPendingTemplate(template);
      setTemplateNameInput('');
    } else {
      setShowGenerationMenu(false);
      handleSend(template.buildCommand());
    }
  };

  const handleSubmitTemplateName = () => {
    if (!pendingTemplate) return;
    const name = templateNameInput.trim();
    if (!name) return;

    const command = pendingTemplate.buildCommand(name);
    setShowGenerationMenu(false);
    setPendingTemplate(null);
    setTemplateNameInput('');
    handleSend(command);
  };

  const closeGenerationMenu = () => {
    setShowGenerationMenu(false);
    setPendingTemplate(null);
    setTemplateNameInput('');
  };

  // ONE path for every file selection, however the dialog was
  // opened (paperclip, PDF Comparison tile, or the browse button in
  // the template picker). It only ever stages files into
  // pendingFiles as removable chips - it never uploads. Upload only
  // happens inside handleSend, once the user presses Send. This is
  // also the only place that flips dismissedLanding to true for any
  // file-attach flow, so a cancelled dialog leaves whatever screen
  // the user was on untouched.
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    e.target.value = '';

    const validPdfs = files.filter((f) => f.name.toLowerCase().endsWith('.pdf'));
    const rejected = files.filter((f) => !f.name.toLowerCase().endsWith('.pdf'));

    if (rejected.length > 0) {
      setDismissedLanding(true);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          card: {
            kind: 'error',
            title: 'Unsupported File',
            message: 'Only PDF files are supported right now: ' + rejected.map((f) => f.name).join(', '),
          },
          timestamp: Date.now(),
        },
      ]);
    }

    if (validPdfs.length === 0) return;

    // Selecting a file always exits the template picker (if it was
    // open) and switches into the chat view, since the chips + input
    // + comparison-mode buttons all live in the chat screen.
    setShowGenerationMenu(false);
    setPendingTemplate(null);
    setTemplateNameInput('');
    setDismissedLanding(true);

    setPendingFiles((prev) => {
      const next = [...prev, ...validPdfs];

      // Only prefill a suggested question when nothing is already
      // typed, and only when there's exactly one file (2+ files get
      // the dedicated Content/Context comparison buttons instead of
      // a prefilled guess - see the pendingFiles chip row below).
      setInput((prevInput) => {
        if (prevInput.trim().length > 0) return prevInput;
        return next.length === 1 ? '' : prevInput;
      });

      return next;
    });

    inputRef.current?.focus();
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick-action shortcuts shown once 2+ files are staged. Content
  // comparison asks for a detailed, line-by-line factual diff;
  // Context comparison asks for the broader picture - purpose, tone,
  // what each document is trying to convey. Both just fill the input
  // with a specific instruction the user can still edit before
  // sending, same as typing it themselves.
  const handlePickComparisonMode = (mode: 'content' | 'context') => {
    const command =
      mode === 'content'
        ? 'Compare these documents in detail - go through them section by section and point out every factual difference in the content (numbers, dates, names, terms).'
        : 'Compare these documents at a high level - what is each one about, what is its overall purpose or context, and how do they differ in that bigger picture.';
    setInput(command);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const cardToText = (card: ResponseCard): string => {
    if (card.fullText) return card.fullText;
    if (card.message) return card.title + ': ' + card.message;
    return card.title;
  };

  const hasMessages = messages.length > 0;
  const showLanding = !hasMessages && !dismissedLanding;
  const canSend = (input.trim().length > 0 || pendingFiles.length > 0) && !loading && !uploading;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {!showLanding && (
          <div className="sticky top-0 z-10 border-b border-ink-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:px-8">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <button
                onClick={handleBackToMenu}
                className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-600 shadow-sm transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to menu
              </button>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-400">
                <Bot className="h-3.5 w-3.5" /> Billing AI Assistant
              </span>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
          {showLanding && (
            <div className="space-y-6">
              <FeatureShowcase
                onCompare={handleCompareTileClick}
                onGenerate={handleGenerateTileClick}
                onChat={handleChatTileClick}
              />

              {showGenerationMenu && (
                <GenerationMenu
                  templates={GENERATION_TEMPLATES}
                  pendingTemplate={pendingTemplate}
                  templateNameInput={templateNameInput}
                  onTemplateNameChange={setTemplateNameInput}
                  onPickTemplate={handlePickTemplate}
                  onSubmitName={handleSubmitTemplateName}
                  onClose={closeGenerationMenu}
                  onBrowseFile={handleBrowseFromTemplateMenu}
                />
              )}
            </div>
          )}

          {!showLanding && (
            <div className="space-y-6">
              {messages.length === 0 ? (
                <ChatEmptyState onPick={(s) => handleSend(s)} />
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={'flex gap-3' + (m.role === 'user' ? ' flex-row-reverse' : '')}
                    >
                      <div
                        className={
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ' +
                          (m.role === 'user'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gradient-to-br from-primary-500 to-accent-500 text-white')
                        }
                      >
                        {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>

                      <div className={'group flex max-w-[85%] flex-col' + (m.role === 'user' ? ' items-end' : ' items-start')}>
                        {m.role === 'user' ? (
                          <div className="flex flex-col items-end gap-1.5">
                            {m.attachments && m.attachments.length > 0 ? (
                              <div className="flex flex-wrap justify-end gap-1.5">
                                {m.attachments.map((name, i) => (
                                  <span
                                    key={i}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-2.5 py-1.5 text-[11px] font-medium text-white"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {name}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                            {m.content ? (
                              <div className="whitespace-pre-line rounded-2xl rounded-tr-sm bg-primary-600 px-4 py-2.5 text-sm text-white shadow-sm">
                                {m.content}
                              </div>
                            ) : null}
                          </div>
                        ) : m.card ? (
                          <div className="w-full min-w-[280px]">
                            <ResponseCardView card={m.card} />
                          </div>
                        ) : null}

                        <div className={'mt-1.5 flex items-center gap-2' + (m.role === 'user' ? ' flex-row-reverse' : '')}>
                          <span className="text-[10px] text-ink-400">{fmtTime(m.timestamp)}</span>
                          {m.role === 'assistant' && m.card && (
                            <>
                              <button
                                onClick={() => copyText(m.id, cardToText(m.card!))}
                                className="flex items-center gap-1 text-[10px] text-ink-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary-600"
                              >
                                {copiedId === m.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                {copiedId === m.id ? 'Copied' : 'Copy'}
                              </button>
                              <button
                                onClick={() => handleSpeakClick(m.id, m.card!)}
                                disabled={
                                  (loadingSpeechId !== null && loadingSpeechId !== m.id) ||
                                  (speakingId !== null && speakingId !== m.id)
                                }
                                title={speakingId === m.id ? 'Stop' : 'Play as voice'}
                                className="flex items-center gap-1 text-[10px] text-ink-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary-600 disabled:opacity-40"
                              >
                                {loadingSpeechId === m.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : speakingId === m.id ? (
                                  <Square className="h-3 w-3" />
                                ) : (
                                  <Volume2 className="h-3 w-3" />
                                )}
                                {loadingSpeechId === m.id ? 'Loading' : speakingId === m.id ? 'Stop' : 'Listen'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {(loading || uploading) && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-ink-200 bg-white px-4 py-3.5 shadow-sm">
                    <span className="typing-dot h-2 w-2 rounded-full bg-primary-400" style={{ animationDelay: '0ms' }} />
                    <span className="typing-dot h-2 w-2 rounded-full bg-primary-400" style={{ animationDelay: '150ms' }} />
                    <span className="typing-dot h-2 w-2 rounded-full bg-primary-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-ink-200 bg-white/80 px-4 py-4 backdrop-blur-md lg:px-8">
        <div className="mx-auto max-w-4xl">
          {pendingFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingFiles.map((file, i) => (
                <div
                  key={file.name + i}
                  className="flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary-700"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  <button
                    onClick={() => removePendingFile(i)}
                    disabled={uploading}
                    title="Remove"
                    className="ml-0.5 text-primary-400 transition-colors hover:text-error-500 disabled:opacity-40"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingFiles.length >= 2 && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-ink-400">Comparison type:</span>
              <button
                onClick={() => handlePickComparisonMode('content')}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-40"
              >
                <AlignLeft className="h-3.5 w-3.5" /> Content comparison
              </button>
              <button
                onClick={() => handlePickComparisonMode('context')}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-40"
              >
                <Layers className="h-3.5 w-3.5" /> Context comparison
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-ink-200 bg-ink-50 px-3 py-2 transition-colors focus-within:border-primary-400 focus-within:bg-white">
            <Sparkles className="mt-2.5 h-5 w-5 shrink-0 text-primary-400" />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              placeholder={
                transcribing
                  ? 'Transcribing...'
                  : pendingFiles.length > 0
                  ? 'Type what you need from this document, then press send...'
                  : 'Ask anything about patients, billing, inventory...'
              }
              className="flex-1 resize-none bg-transparent py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none max-h-32 disabled:opacity-50"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileSelected}
              className="hidden"
            />
            <button
              onClick={handleAttachClick}
              disabled={loading || uploading}
              title="Attach one or more PDFs to ask questions about or compare"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-all hover:bg-ink-50 disabled:opacity-40"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </button>

            <button
              onClick={handleMicClick}
              disabled={loading || transcribing}
              title={recording ? 'Stop recording' : 'Record a voice message'}
              className={
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all disabled:opacity-40 ' +
                (recording
                  ? 'border-error-500 bg-error-50 text-error-600 animate-pulse'
                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50')
              }
            >
              {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <button
              onClick={() => handleSend()}
              disabled={!canSend}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/30 transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-ink-400">
            Press Enter to send &middot; Shift + Enter for new line &middot; Powered by Agentic AI
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatEmptyState({ onPick }: { onPick: (s: string) => void }) {
  const suggestions = [
    'Register Patient',
    'Generate Bill',
    'Hospital Dashboard',
    'Show Inventory',
    'Latest Bill',
    'Medicine Stock',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center pt-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-success-500 text-white shadow-lg shadow-accent-500/20">
        <Bot className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-ink-900">Billing AI Assistant</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-500">
        Ask me to register a patient, generate a bill, check inventory, or pull a report - just type in plain English.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-semibold text-ink-600 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function FeatureShowcase(props: {
  onCompare: () => void;
  onGenerate: () => void;
  onChat: () => void;
}) {
  const tiles = [
    {
      icon: GitCompare,
      title: 'PDF Comparison',
      description: 'Pick two or more PDFs and see exactly how they differ.',
      gradient: 'from-purple-500 to-primary-500',
      onClick: props.onCompare,
    },
    {
      icon: FileText,
      title: 'PDF Generation',
      description: 'Choose a ready-made template - invoice, report, and more.',
      gradient: 'from-primary-500 to-accent-500',
      onClick: props.onGenerate,
    },
    {
      icon: Bot,
      title: 'Billing AI Assistant',
      description: 'Register patients, create bills, check stock - just ask.',
      gradient: 'from-accent-500 to-success-500',
      onClick: props.onChat,
    },
  ];

  return (
    <div className="pt-6">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-ink-900">What would you like to do?</h2>
        <p className="mt-1 text-sm text-ink-500">Pick one to get started.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <motion.button
              key={tile.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={tile.onClick}
              className="group flex flex-col items-start rounded-2xl border border-ink-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <div className={'flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ' + tile.gradient + ' text-white shadow-sm'}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-ink-900">{tile.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{tile.description}</p>
              <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
                Get started <ArrowRight className="h-3 w-3" />
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function GenerationMenu(props: {
  templates: GenerationTemplate[];
  pendingTemplate: GenerationTemplate | null;
  templateNameInput: string;
  onTemplateNameChange: (value: string) => void;
  onPickTemplate: (template: GenerationTemplate) => void;
  onSubmitName: () => void;
  onClose: () => void;
  onBrowseFile: () => void;
}) {
  const pendingTemplate = props.pendingTemplate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-900">
          {pendingTemplate ? 'Generate: ' + pendingTemplate.label : 'Choose a PDF template'}
        </h3>
        <button onClick={props.onClose} className="rounded-lg p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {pendingTemplate ? (
        <div className="space-y-3">
          <p className="text-xs text-ink-500">Which patient is this for?</p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={props.templateNameInput}
              onChange={(e) => props.onTemplateNameChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && props.onSubmitName()}
              placeholder="Patient name"
              className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary-400 focus:bg-white focus:outline-none"
            />
            <button
              onClick={props.onSubmitName}
              disabled={!props.templateNameInput.trim()}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-40"
            >
              Generate
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {props.templates.map((t) => (
              <button
                key={t.id}
                onClick={() => props.onPickTemplate(t)}
                className="flex flex-col items-start rounded-xl border border-ink-100 p-3.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
              >
                <p className="text-sm font-semibold text-ink-900">{t.label}</p>
                <p className="mt-0.5 text-xs text-ink-500">{t.description}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="h-px flex-1 bg-ink-100" />
            <span className="text-[11px] font-medium text-ink-400">or</span>
            <div className="h-px flex-1 bg-ink-100" />
          </div>

          <button
            onClick={props.onBrowseFile}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink-200 p-3.5 text-sm font-semibold text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          >
            <Upload className="h-4 w-4" />
            Browse a file from your system
          </button>
          <p className="text-center text-[11px] text-ink-400">
            Upload a PDF to generate from it or compare it against another document.
          </p>
        </div>
      )}
    </motion.div>
  );
}