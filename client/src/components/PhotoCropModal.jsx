import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move, Undo2 } from 'lucide-react';

export default function PhotoCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isProcessing = false
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Load image when src changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
      // Reset controls
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Draw interactive preview canvas
  useEffect(() => {
    if (!imgLoaded || !imgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Center of canvas
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    const img = imgRef.current;
    // Calculate aspect fit scale base
    const scale = Math.max(width / img.width, height / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Draw circular mask overlay (dark outside, transparent inside circle)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    // Outer rect
    ctx.rect(0, 0, width, height);
    // Inner cut circle
    const radius = Math.min(width, height) * 0.42;
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2, true);
    ctx.fill();

    // Circle border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [imgLoaded, zoom, rotation, pan]);

  // Drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile/trackpad
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  // Generate final cropped output
  const handleApplyCrop = () => {
    if (!imgRef.current) return;

    // High resolution output canvas (400x400)
    const outputSize = 400;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outputSize;
    outCanvas.height = outputSize;
    const ctx = outCanvas.getContext('2d');

    const previewCanvas = canvasRef.current;
    const radius = Math.min(previewCanvas.width, previewCanvas.height) * 0.42;
    const scaleFactor = outputSize / (radius * 2);

    ctx.save();
    // Center in output canvas
    ctx.translate(outputSize / 2, outputSize / 2);
    // Apply pan scaled up
    ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    const img = imgRef.current;
    const baseScale = Math.max(previewCanvas.width / img.width, previewCanvas.height / img.height);
    const drawW = img.width * baseScale;
    const drawH = img.height * baseScale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    outCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
        }
      },
      'image/png',
      0.95
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ajustar Corte da Foto</h3>
            <p className="text-[11px] text-slate-500">
              Arraste para posicionar e use o zoom para enquadrar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CANVAS AREA */}
        <div className="p-4 flex flex-col items-center bg-slate-900/5">
          <div
            className="relative cursor-move rounded-xl overflow-hidden shadow-inner border border-slate-300 bg-slate-800"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="block"
            />
            {/* Guide hint */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
              <Move className="w-3 h-3" />
              <span>Arraste para mover</span>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="w-full mt-4 space-y-3 px-2">
            {/* ZOOM SLIDER */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                title="Reduzir zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.6"
                max="2.8"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.8, z + 0.15))}
                className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-600 w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* ACTION BUTTONS (ROTATE / RESET) */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Girar 90°</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPan({ x: 0, y: 0 });
                  setZoom(1);
                  setRotation(0);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Centralizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'Salvando...' : 'Aplicar Corte'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

