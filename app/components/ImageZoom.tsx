'use client';

import { useState } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
}

export default function ImageZoom({ src, alt }: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [coord, setCoord] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startCoord, setStartCoord] = useState({ x: 0, y: 0 });

  // Manejo de Zoom con la rueda del ratón
  const handleWheel = (e: React.WheelEvent) => {
    if (!isOpen) return;
    e.preventDefault();
    const zoomFactor = 0.1;
    const newScale = e.deltaY < 0 ? scale + zoomFactor : scale - zoomFactor;
    setScale(Math.max(1, Math.min(newScale, 4))); // Limita el zoom entre 1x y 4x
  };

  // Inicio de arrastre (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return;
    setIsDragging(true);
    setStartCoord({ x: e.clientX - coord.x, y: e.clientY - coord.y });
  };

  // Movimiento del arrastre
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCoord({
      x: e.clientX - startCoord.x,
      y: e.clientY - startCoord.y,
    });
  };

  const closeReset = () => {
    setIsOpen(false);
    setScale(1);
    setCoord({ x: 0, y: 0 });
  };

  return (
    <>
      {/* Miniatura en la vista del detalle */}
      <div className="group relative cursor-zoom-in overflow-hidden rounded-xl border border-gray-800 bg-[#0B0F19]" onClick={() => setIsOpen(true)}>
        <img src={src} alt={alt} className="max-h-72 w-full object-contain hover:opacity-90 transition-opacity" />
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-[10px] text-gray-300 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          🔍 Click para ampliar
        </div>
      </div>

      {/* Modal de Pantalla Completa con Zoom Avanzado */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm select-none"
          onWheel={handleWheel}
        >
          {/* Botón Cerrar */}
          <button onClick={closeReset} className="absolute top-4 right-4 z-50 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full p-2.5 transition-colors">
            ❌
          </button>

          {/* Controles de Zoom Visuales */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900/80 border border-gray-800 px-4 py-2 rounded-full backdrop-blur-md">
            <button onClick={() => setScale(prev => Math.max(1, prev - 0.2))} className="text-gray-400 hover:text-white px-2 font-bold">-</button>
            <span className="text-xs text-gray-200 font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(prev => Math.min(4, prev + 0.2))} className="text-gray-400 hover:text-white px-2 font-bold">+</button>
            {scale > 1 && (
              <button onClick={() => { setScale(1); setCoord({ x: 0, y: 0 }); }} className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded text-white ml-2">Reset</button>
            )}
          </div>

          {/* Contenedor de la Imagen */}
          <div 
            className={`w-full h-full flex items-center justify-center ${scale > 1 ? 'cursor-move' : 'cursor-default'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              style={{
                transform: `translate(${coord.x}px, ${coord.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
