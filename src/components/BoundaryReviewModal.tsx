import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Trash2, Loader2 } from 'lucide-react';
import type { Boundary, Bbox, Selection } from '../services/image-analysis-api';
import { getSessionImageUrl, submitSelections } from '../services/image-analysis-api';
import type { SavedEditorConfig } from '../state';

interface BoundaryReviewModalProps {
  sessionId: string;
  boundaries: Boundary[];
  imageWidth: number;
  imageHeight: number;
  onSubmit: (layoutConfig: SavedEditorConfig) => void;
  onClose: () => void;
}

const BOUNDARY_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#6366f1', '#14b8a6', '#e11d48', '#84cc16',
];

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  n: 'ns-resize', s: 'ns-resize',
  e: 'ew-resize', w: 'ew-resize',
  ne: 'nesw-resize', sw: 'nesw-resize',
  nw: 'nwse-resize', se: 'nwse-resize',
};

const MIN_SIZE_PX = 20;

interface BoundaryState {
  selectedCandidateIdx: number;
  discarded: boolean;
}

interface DragState {
  boundaryId: string;
  handle: ResizeHandle;
  startMouseX: number;
  startMouseY: number;
  startBbox: Bbox;
}

export function BoundaryReviewModal({
  sessionId,
  boundaries,
  imageWidth,
  imageHeight,
  onSubmit,
  onClose,
}: BoundaryReviewModalProps) {
  const [boundaryStates, setBoundaryStates] = useState<Record<string, BoundaryState>>(() => {
    const initial: Record<string, BoundaryState> = {};
    for (const b of boundaries) {
      initial[b.id] = { selectedCandidateIdx: 0, discarded: false };
    }
    return initial;
  });

  const [bboxOverrides, setBboxOverrides] = useState<Record<string, Bbox>>(() => {
    const initial: Record<string, Bbox> = {};
    for (const b of boundaries) {
      initial[b.id] = { ...b.bbox };
    }
    return initial;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBoundary, setHoveredBoundary] = useState<string | null>(null);
  const [displayWidth, setDisplayWidth] = useState(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (imageContainerRef.current) {
        setDisplayWidth(imageContainerRef.current.clientWidth);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const scaleFactor = displayWidth > 0 ? displayWidth / imageWidth : 1;
  const displayHeight = imageHeight * scaleFactor;

  const toggleDiscard = useCallback((id: string) => {
    setBoundaryStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], discarded: !prev[id].discarded },
    }));
  }, []);

  const selectCandidate = useCallback((boundaryId: string, candidateIdx: number) => {
    setBoundaryStates((prev) => ({
      ...prev,
      [boundaryId]: { ...prev[boundaryId], selectedCandidateIdx: candidateIdx },
    }));
  }, []);

  const handleResizeStart = useCallback((
    e: React.MouseEvent,
    boundaryId: string,
    handle: ResizeHandle,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const bbox = bboxOverrides[boundaryId];
    if (!bbox) return;
    dragRef.current = {
      boundaryId,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startBbox: { ...bbox },
    };
    document.body.style.cursor = HANDLE_CURSORS[handle];
    document.body.style.userSelect = 'none';
  }, [bboxOverrides]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = (e.clientX - drag.startMouseX) / scaleFactor;
      const dy = (e.clientY - drag.startMouseY) / scaleFactor;
      const { startBbox, handle } = drag;

      let { x1, y1, x2, y2 } = startBbox;
      const minImg = MIN_SIZE_PX / scaleFactor;

      if (handle.includes('w')) x1 = Math.min(startBbox.x1 + dx, x2 - minImg);
      if (handle.includes('e')) x2 = Math.max(startBbox.x2 + dx, x1 + minImg);
      if (handle.includes('n')) y1 = Math.min(startBbox.y1 + dy, y2 - minImg);
      if (handle.includes('s')) y2 = Math.max(startBbox.y2 + dy, y1 + minImg);

      x1 = Math.max(0, x1);
      y1 = Math.max(0, y1);
      x2 = Math.min(imageWidth, x2);
      y2 = Math.min(imageHeight, y2);

      setBboxOverrides((prev) => ({
        ...prev,
        [drag.boundaryId]: { x1: Math.round(x1), y1: Math.round(y1), x2: Math.round(x2), y2: Math.round(y2) },
      }));
    };

    const onMouseUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [scaleFactor, imageWidth, imageHeight]);

  const activeCount = boundaries.filter((b) => !boundaryStates[b.id]?.discarded).length;

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const selections: Selection[] = boundaries
        .filter((b) => !boundaryStates[b.id]?.discarded)
        .map((b) => {
          const state = boundaryStates[b.id];
          const candidate = b.candidates[state.selectedCandidateIdx];
          return {
            id: b.id,
            type: candidate.type,
            variant: candidate.variant,
            bbox: bboxOverrides[b.id] ?? b.bbox,
          };
        });

      const result = await submitSelections(sessionId, selections);
      onSubmit({
        sections: result.layout_config.sections,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate config');
    } finally {
      setSubmitting(false);
    }
  }, [boundaries, boundaryStates, bboxOverrides, sessionId, onSubmit]);

  const renderResizeHandles = (boundaryId: string, color: string) => {
    const handles: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
    return handles.map((h) => (
      <div
        key={h}
        className={`boundary-resize-handle boundary-resize-${h}`}
        style={{ '--handle-color': color } as React.CSSProperties}
        onMouseDown={(e) => handleResizeStart(e, boundaryId, h)}
      />
    ));
  };

  return (
    <motion.div
      className="boundary-review-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="boundary-review-content"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Header */}
        <div className="boundary-review-header">
          <div>
            <h2 className="boundary-review-title">Review Detected Components</h2>
            <p className="boundary-review-subtitle">
              {boundaries.length} component{boundaries.length !== 1 ? 's' : ''} detected
              {activeCount < boundaries.length && ` (${activeCount} selected)`}
              {' \u2014 drag handles to resize boundaries'}
            </p>
          </div>
          <button className="boundary-review-close" onClick={onClose} disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="boundary-review-body">
          {/* Image with overlays */}
          <div className="boundary-review-image-section">
            <div
              className="boundary-review-image-container"
              ref={imageContainerRef}
              style={{ height: displayHeight || 'auto' }}
            >
              <img
                src={getSessionImageUrl(sessionId)}
                alt="Uploaded design"
                className="boundary-review-image"
                draggable={false}
                onLoad={() => {
                  if (imageContainerRef.current) {
                    setDisplayWidth(imageContainerRef.current.clientWidth);
                  }
                }}
              />
              {displayWidth > 0 &&
                boundaries.map((b, i) => {
                  const state = boundaryStates[b.id];
                  const bbox = bboxOverrides[b.id] ?? b.bbox;
                  const color = BOUNDARY_COLORS[i % BOUNDARY_COLORS.length];
                  const isHovered = hoveredBoundary === b.id;
                  const candidate = b.candidates[state.selectedCandidateIdx];
                  return (
                    <div
                      key={b.id}
                      className={`boundary-overlay-rect ${state.discarded ? 'discarded' : ''} ${isHovered ? 'hovered' : ''}`}
                      style={{
                        left: bbox.x1 * scaleFactor,
                        top: bbox.y1 * scaleFactor,
                        width: (bbox.x2 - bbox.x1) * scaleFactor,
                        height: (bbox.y2 - bbox.y1) * scaleFactor,
                        borderColor: state.discarded ? '#9ca3af' : color,
                        backgroundColor: state.discarded
                          ? 'rgba(156,163,175,0.08)'
                          : isHovered
                            ? `${color}22`
                            : `${color}11`,
                      }}
                      onMouseEnter={() => setHoveredBoundary(b.id)}
                      onMouseLeave={() => setHoveredBoundary(null)}
                    >
                      <span
                        className="boundary-overlay-label"
                        style={{ backgroundColor: state.discarded ? '#9ca3af' : color }}
                      >
                        {state.discarded ? 'Discarded' : `${candidate.type} (${candidate.variant})`}
                      </span>
                      {!state.discarded && renderResizeHandles(b.id, color)}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Boundary cards */}
          <div className="boundary-review-cards">
            {boundaries.map((b, i) => {
              const state = boundaryStates[b.id];
              const bbox = bboxOverrides[b.id] ?? b.bbox;
              const color = BOUNDARY_COLORS[i % BOUNDARY_COLORS.length];
              const bboxChanged =
                bbox.x1 !== b.bbox.x1 || bbox.y1 !== b.bbox.y1 ||
                bbox.x2 !== b.bbox.x2 || bbox.y2 !== b.bbox.y2;
              return (
                <div
                  key={b.id}
                  className={`boundary-card ${state.discarded ? 'discarded' : ''} ${hoveredBoundary === b.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredBoundary(b.id)}
                  onMouseLeave={() => setHoveredBoundary(null)}
                >
                  <div className="boundary-card-header">
                    <div
                      className="boundary-card-color"
                      style={{ backgroundColor: state.discarded ? '#9ca3af' : color }}
                    />
                    <span className="boundary-card-id">{b.id}</span>
                    {bboxChanged && !state.discarded && (
                      <button
                        className="boundary-reset-btn"
                        onClick={() => setBboxOverrides((prev) => ({ ...prev, [b.id]: { ...b.bbox } }))}
                        title="Reset to original size"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      className={`boundary-discard-btn ${state.discarded ? 'restore' : ''}`}
                      onClick={() => toggleDiscard(b.id)}
                      title={state.discarded ? 'Restore' : 'Discard'}
                    >
                      {state.discarded ? <Check size={14} /> : <Trash2 size={14} />}
                      {state.discarded ? 'Restore' : 'Discard'}
                    </button>
                  </div>

                  {!state.discarded && (
                    <>
                      <div className="boundary-candidates">
                        {b.candidates.map((c, ci) => (
                          <label
                            key={`${c.type}-${c.variant}`}
                            className={`boundary-candidate ${state.selectedCandidateIdx === ci ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`boundary-${b.id}`}
                              checked={state.selectedCandidateIdx === ci}
                              onChange={() => selectCandidate(b.id, ci)}
                            />
                            <span className="boundary-candidate-type">{c.type}</span>
                            <span className="boundary-candidate-variant">{c.variant}</span>
                            <span className="boundary-candidate-confidence">{c.confidence}%</span>
                          </label>
                        ))}
                      </div>
                      {bboxChanged && (
                        <div className="boundary-bbox-info">
                          Resized: {bbox.x2 - bbox.x1}x{bbox.y2 - bbox.y1}px
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="boundary-review-footer">
          {error && <div className="boundary-review-error">{error}</div>}
          <div className="boundary-review-actions">
            <button
              className="boundary-cancel-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="boundary-submit-btn"
              onClick={handleSubmit}
              disabled={submitting || activeCount === 0}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="spin" />
                  Generating Config...
                </>
              ) : (
                `Generate Config (${activeCount} component${activeCount !== 1 ? 's' : ''})`
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
