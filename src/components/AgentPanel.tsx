import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ImagePlus, X, Sparkles } from 'lucide-react';
import type { AgentMessage, AgentEvent } from '../services/agent-service';
import { createAgentService } from '../services/agent-service';
import type { EditorAction } from '../state';
import { saveChatMessage } from '../api';
import { uploadImage, analyzeImage } from '../services/image-analysis-api';
import type { Boundary } from '../services/image-analysis-api';

interface AgentPanelProps {
  onClose: () => void;
  dispatch: React.Dispatch<EditorAction>;
  messages: AgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  onProcessingChange: (processing: boolean) => void;
  onStatusChange: (status: string | null, phaseIndex: number) => void;
  domain: string;
  configId: string | null;
  onBoundaryReview: (sessionId: string, boundaries: Boundary[], imageWidth: number, imageHeight: number) => void;
}

export function AgentPanel({
  onClose,
  dispatch,
  messages,
  setMessages,
  onProcessingChange,
  onStatusChange,
  domain,
  configId,
  onBoundaryReview,
}: AgentPanelProps) {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const persistMessage = useCallback((msg: AgentMessage, seq: number) => {
    if (!configId) return;
    saveChatMessage(domain, configId, seq, msg).catch(() => {});
  }, [domain, configId]);

  const handleImageAnalysisFlow = useCallback(async (file: File, text: string) => {
    let phaseIdx = 0;

    onStatusChange('Uploading image...', phaseIdx++);
    const { session_id } = await uploadImage(file);

    const uploadMsg: AgentMessage = {
      role: 'agent',
      text: `Image uploaded (session: ${session_id}). Analyzing components — this may take up to a minute...`,
      timestamp: Date.now(),
    };
    setMessages((prev) => {
      const seq = prev.length + 1;
      persistMessage(uploadMsg, seq);
      return [...prev, uploadMsg];
    });

    onStatusChange('Analyzing components in your design...', phaseIdx++);
    const analysis = await analyzeImage(session_id);

    if (analysis.boundaries.length === 0) {
      const noResultMsg: AgentMessage = {
        role: 'agent',
        text: 'No components were detected in the uploaded image. Try a different screenshot with clearer UI elements.',
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const seq = prev.length + 1;
        persistMessage(noResultMsg, seq);
        return [...prev, noResultMsg];
      });
      return;
    }

    const detectedMsg: AgentMessage = {
      role: 'agent',
      text: `Detected ${analysis.boundaries.length} component${analysis.boundaries.length !== 1 ? 's' : ''}. Opening the review panel — select the correct type and variant for each, then submit.`,
      timestamp: Date.now(),
    };
    setMessages((prev) => {
      const seq = prev.length + 1;
      persistMessage(detectedMsg, seq);
      return [...prev, detectedMsg];
    });

    onBoundaryReview(session_id, analysis.boundaries, analysis.image_width, analysis.image_height);
  }, [onStatusChange, onBoundaryReview, setMessages, persistMessage]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !image) return;

    const userMsg: AgentMessage = { role: 'user', text, image: image ?? undefined, timestamp: Date.now() };
    const nextSeq = messages.length + 1;
    setMessages((prev) => [...prev, userMsg]);
    persistMessage(userMsg, nextSeq);

    const currentFile = imageFile;
    setInput('');
    setImage(null);
    setImageFile(null);
    setProcessing(true);
    onProcessingChange(true);

    try {
      if (currentFile) {
        await handleImageAnalysisFlow(currentFile, text);
      } else {
        const service = createAgentService('demo');
        let phaseIdx = 0;

        for await (const event of service.sendPrompt(text, image ?? undefined)) {
          switch (event.type) {
            case 'status':
              onStatusChange(event.text, phaseIdx++);
              break;

            case 'question': {
              const qMsg: AgentMessage = { role: 'agent', text: event.text, timestamp: Date.now() };
              setMessages((prev) => {
                const seq = prev.length + 1;
                persistMessage(qMsg, seq);
                return [...prev, qMsg];
              });
              break;
            }

            case 'result': {
              dispatch({ type: 'LOAD_FULL', payload: { sections: event.config.sections, containerWidth: event.config.containerWidth } });
              const successMsg: AgentMessage = {
                role: 'agent',
                text: 'Your portal has been generated successfully! I\'ve set up the layout with subscription management, payment methods, and billing history. Feel free to customize further using the inspector.',
                timestamp: Date.now(),
              };
              setMessages((prev) => {
                const seq = prev.length + 1;
                persistMessage(successMsg, seq);
                return [...prev, successMsg];
              });
              break;
            }
          }
        }
      }
    } catch (err) {
      const errMsg: AgentMessage = { role: 'agent', text: `Something went wrong: ${err}`, timestamp: Date.now() };
      setMessages((prev) => {
        const seq = prev.length + 1;
        persistMessage(errMsg, seq);
        return [...prev, errMsg];
      });
    } finally {
      setProcessing(false);
      onProcessingChange(false);
      onStatusChange(null, 0);
    }
  }, [input, image, imageFile, messages.length, dispatch, onProcessingChange, onStatusChange, persistMessage, setMessages, handleImageAnalysisFlow]);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  return (
    <div className="agent-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="floating-panel-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={16} style={{ color: '#a3e635' }} />
        <h3 style={{ flex: 1 }}>AI Agent</h3>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1, padding: 2 }}
        >
          {'\u00D7'}
        </button>
      </div>

      {/* Chat messages */}
      <div
        className="agent-chat-messages"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {messages.length === 0 && (
          <div className="agent-empty-state">
            <Sparkles size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              How can I help you?
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, textAlign: 'center', lineHeight: 1.5 }}>
              Describe the portal you want to build, or upload a screenshot of a design you'd like to replicate.
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={`${msg.timestamp}-${i}`}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className={`agent-msg agent-msg-${msg.role}`}
            >
              {msg.image && (
                <div className="agent-msg-image">
                  <img src={msg.image} alt="Uploaded" />
                </div>
              )}
              {msg.text && <div className="agent-msg-text">{msg.text}</div>}
              <div className="agent-msg-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="agent-typing-indicator"
          >
            <span /><span /><span />
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Image preview */}
      <AnimatePresence>
        {image && (
          <motion.div
            className="agent-image-preview"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <img src={image} alt="Preview" />
            <button onClick={() => { setImage(null); setImageFile(null); }} className="agent-image-remove">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="agent-input-area">
        <button
          className="agent-input-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          title="Upload image"
        >
          <ImagePlus size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImageSelect(f);
            e.target.value = '';
          }}
        />
        <textarea
          ref={textareaRef}
          className="agent-input-textarea"
          placeholder={processing ? 'Agent is working...' : 'Describe your portal...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={processing}
          rows={1}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 96) + 'px';
          }}
        />
        <motion.button
          className="agent-send-btn"
          onClick={handleSend}
          disabled={processing || (!input.trim() && !image)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Send size={16} />
        </motion.button>
      </div>
    </div>
  );
}
