'use client';

import { useEffect, useRef, useState } from 'react';

type SignaturePadProps = {
  onChange: (dataUrl: string | null) => void;
};

export default function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#0f172a';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }, []);

  const drawPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (!isDrawingRef.current) {
      context.beginPath();
      context.moveTo(x, y);
      isDrawingRef.current = true;
      return;
    }

    context.lineTo(x, y);
    context.stroke();
    setIsEmpty(false);
    onChange(canvas.toDataURL('image/png'));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawPoint(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    drawPoint(event.clientX, event.clientY);
  };

  const finishStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = false;
    onChange(isEmpty ? null : canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <canvas
          ref={canvasRef}
          width={720}
          height={220}
          className="h-56 w-full touch-none bg-white"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Draw your signature inside the box.</span>
        <button
          type="button"
          onClick={clear}
          className="rounded-full border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
