import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Text, Arrow, Transformer } from 'react-konva';
import useImage from 'use-image';
import { 
  Type, 
  Square, 
  Circle as CircleIcon, 
  ArrowUpRight, 
  MousePointer2,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';

type ToolType = 'select' | 'text' | 'rect' | 'circle' | 'arrow';

interface Element {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  fill?: string;
  stroke?: string;
  fontSize?: number;
}

interface ImageAnnotatorProps {
  imageUrl?: string;
  initialElements?: Element[];
  onChange: (imageUrl: string, elements: Element[]) => void;
  readOnly?: boolean;
}

export function ImageAnnotator({ imageUrl, initialElements = [], onChange, readOnly = false }: ImageAnnotatorProps) {
  const [image] = useImage(imageUrl || '');
  const [elements, setElements] = useState<Element[]>(initialElements);
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textInput, setTextInput] = useState<{ visible: boolean, x: number, y: number, value: string, id: string | null }>({ visible: false, x: 0, y: 0, value: '', id: null });
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textInput.visible && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    }
  }, [textInput.visible]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setStageSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight || 400
      });
    }
  }, [imageUrl]);

  useEffect(() => {
    setElements(initialElements);
  }, [initialElements]);

  useEffect(() => {
    if (selectedId && !readOnly && trRef.current && stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId, elements, readOnly]);

  const handleMouseDown = (e: any) => {
    if (readOnly) return;

    if (textInput.visible) {
      return;
    }

    if (selectedTool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage() || e.target.attrs.image;
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
      return;
    }

    const pos = e.target.getStage().getPointerPosition();
    const id = Math.random().toString(36).substr(2, 9);
    setIsDrawing(true);

    if (selectedTool === 'text') {
      setTextInput({
        visible: true,
        x: pos.x,
        y: pos.y,
        value: '',
        id
      });
      return;
    }

    let newEl: Element;
    if (selectedTool === 'rect') {
      newEl = { id, type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0, stroke: '#ef4444' };
    } else if (selectedTool === 'circle') {
      newEl = { id, type: 'circle', x: pos.x, y: pos.y, radius: 0, stroke: '#3b82f6' };
    } else if (selectedTool === 'arrow') {
      newEl = { id, type: 'arrow', x: pos.x, y: pos.y, points: [0, 0, 0, 0], stroke: '#10b981' };
    } else {
      return;
    }

    setElements([...elements, newEl]);
    setSelectedId(id);
  };

  const handleMouseMove = (e: any) => {
    if (readOnly || !isDrawing || selectedTool === 'select' || selectedTool === 'text') return;

    const pos = e.target.getStage().getPointerPosition();
    const lastEl = { ...elements[elements.length - 1] };

    if (selectedTool === 'rect') {
      lastEl.width = pos.x - lastEl.x;
      lastEl.height = pos.y - lastEl.y;
    } else if (selectedTool === 'circle') {
      const dx = pos.x - lastEl.x;
      const dy = pos.y - lastEl.y;
      lastEl.radius = Math.sqrt(dx * dx + dy * dy);
    } else if (selectedTool === 'arrow') {
      lastEl.points = [0, 0, pos.x - lastEl.x, pos.y - lastEl.y];
    }

    const newElements = elements.slice(0, -1).concat(lastEl);
    setElements(newElements);
  };

  const handleMouseUp = () => {
    if (readOnly) return;
    setIsDrawing(false);
    if (selectedTool !== 'select' && selectedTool !== 'text') {
      setSelectedTool('select');
      onChange(imageUrl || '', elements);
    }
  };

  const handleDragEnd = (e: any, id: string) => {
    if (readOnly) return;
    const node = e.target;
    const newElements = elements.map(el => {
      if (el.id === id) {
        return {
          ...el,
          x: node.x(),
          y: node.y()
        };
      }
      return el;
    });
    setElements(newElements);
    onChange(imageUrl || '', newElements);
  };

  const handleTransformEnd = (e: any, id: string) => {
    if (readOnly) return;
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    const newElements = elements.map(el => {
      if (el.id === id) {
        if (el.type === 'rect') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            width: Math.max(5, (el.width || 0) * scaleX),
            height: Math.max(5, (el.height || 0) * scaleY)
          };
        }
        if (el.type === 'circle') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            radius: Math.max(5, (el.radius || 0) * Math.max(scaleX, scaleY))
          };
        }
        if (el.type === 'arrow') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            points: (el.points || []).map((p, i) => i % 2 === 0 ? p * scaleX : p * scaleY)
          };
        }
        if (el.type === 'text') {
           return {
             ...el,
             x: node.x(),
             y: node.y(),
             fontSize: Math.max(10, (el.fontSize || 20) * Math.max(scaleX, scaleY))
           };
        }
      }
      return el;
    });
    setElements(newElements);
    onChange(imageUrl || '', newElements);
  };

  const handleDelete = () => {
    if (selectedId) {
      const newElements = elements.filter(el => el.id !== selectedId);
      setElements(newElements);
      setSelectedId(null);
      onChange(imageUrl || '', newElements);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !readOnly) {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, elements, readOnly]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        onChange(url, []);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (readOnly) return;
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const url = event.target?.result as string;
              onChange(url, []);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    }
  }, [onChange, readOnly]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  let imageScale = 1;
  let imagePos = { x: 0, y: 0 };
  if (image && stageSize.width > 0) {
    const scaleX = stageSize.width / image.width;
    const scaleY = stageSize.height / image.height;
    imageScale = Math.min(scaleX, scaleY);
    if (imageScale > 1) imageScale = 1;
    imagePos = {
      x: (stageSize.width - image.width * imageScale) / 2,
      y: (stageSize.height - image.height * imageScale) / 2
    };
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden relative" ref={containerRef}>
      {!readOnly && (
        <div className="bg-white border-b border-slate-200 p-2 flex items-center gap-2 flex-wrap">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            id="image-upload" 
            onChange={handleImageUpload}
          />
          <label 
            htmlFor="image-upload" 
            className="cursor-pointer px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
          >
            {imageUrl ? 'Trocar Imagem' : 'Carregar Imagem / Colar'}
          </label>

          {imageUrl && (
            <>
              <div className="w-px h-6 bg-slate-300 mx-1"></div>
              <ToolButton icon={<MousePointer2 size={18} />} active={selectedTool === 'select'} onClick={() => setSelectedTool('select')} title="Selecionar" />
              <ToolButton icon={<Square size={18} />} active={selectedTool === 'rect'} onClick={() => setSelectedTool('rect')} title="Retângulo (Resistência)" />
              <ToolButton icon={<CircleIcon size={18} />} active={selectedTool === 'circle'} onClick={() => setSelectedTool('circle')} title="Círculo (Ponto chave)" />
              <ToolButton icon={<ArrowUpRight size={18} />} active={selectedTool === 'arrow'} onClick={() => setSelectedTool('arrow')} title="Seta" />
              <ToolButton icon={<Type size={18} />} active={selectedTool === 'text'} onClick={() => setSelectedTool('text')} title="Texto" />
              
              {selectedId && (
                <button 
                  onClick={handleDelete}
                  className="ml-auto p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Deletar Selecionado"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex-1 w-full bg-slate-100 min-h-[400px] relative">
        {textInput.visible && !readOnly && (
          <input
            ref={textInputRef}
            className="absolute z-10 px-1 border-2 border-blue-500 rounded text-red-500 text-xl bg-transparent outline-none"
            style={{ top: textInput.y, left: textInput.x, minWidth: '150px' }}
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (textInput.value) {
                  const newEl: Element = { id: textInput.id!, type: 'text', x: textInput.x, y: textInput.y, text: textInput.value, fill: '#ef4444', fontSize: 20 };
                  const newElements = [...elements, newEl];
                  setElements(newElements);
                  onChange(imageUrl || '', newElements);
                }
                setTextInput({ visible: false, x: 0, y: 0, value: '', id: null });
                setSelectedTool('select');
                setIsDrawing(false);
              }
              if (e.key === 'Escape') {
                setTextInput({ visible: false, x: 0, y: 0, value: '', id: null });
                setSelectedTool('select');
                setIsDrawing(false);
              }
            }}
            onBlur={() => {
              if (textInput.value) {
                  const newEl: Element = { id: textInput.id!, type: 'text', x: textInput.x, y: textInput.y, text: textInput.value, fill: '#ef4444', fontSize: 20 };
                  const newElements = [...elements, newEl];
                  setElements(newElements);
                  onChange(imageUrl || '', newElements);
              }
              setTextInput({ visible: false, x: 0, y: 0, value: '', id: null });
              setSelectedTool('select');
              setIsDrawing(false);
            }}
          />
        )}
        {imageUrl ? (
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={stageRef}
          >
            <Layer>
              <KonvaImage
                image={image}
                x={imagePos.x}
                y={imagePos.y}
                scaleX={imageScale}
                scaleY={imageScale}
              />
              {elements.map((el, i) => {
                const isSelected = el.id === selectedId;
                const commonProps = {
                  id: el.id,
                  x: el.x,
                  y: el.y,
                  draggable: !readOnly && isSelected,
                  onClick: () => !readOnly && setSelectedId(el.id),
                  onTap: () => !readOnly && setSelectedId(el.id),
                  onDragEnd: (e: any) => handleDragEnd(e, el.id),
                  onTransformEnd: (e: any) => handleTransformEnd(e, el.id),
                  strokeWidth: isSelected ? 3 : 2,
                };

                if (el.type === 'rect') {
                  return <Rect key={el.id} {...commonProps} width={el.width} height={el.height} stroke={el.stroke} />;
                }
                if (el.type === 'circle') {
                  return <Circle key={el.id} {...commonProps} radius={el.radius} stroke={el.stroke} />;
                }
                if (el.type === 'arrow') {
                  return <Arrow key={el.id} {...commonProps} points={el.points || []} stroke={el.stroke} fill={el.stroke} />;
                }
                if (el.type === 'text') {
                  return <Text key={el.id} {...commonProps} text={el.text} fill={el.fill} fontSize={el.fontSize} />;
                }
                return null;
              })}
              {selectedId && !readOnly && (
                <Transformer
                  ref={trRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                />
              )}
            </Layer>
          </Stage>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 p-8 text-center">
            {readOnly ? 'Nenhuma imagem associada a esta operação.' : 'Carregue uma imagem ou use Ctrl+V / Cmd+V para colar um printscreen.'}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolButton({ icon, active, onClick, title }: { icon: React.ReactNode, active: boolean, onClick: () => void, title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        active ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-100"
      )}
    >
      {icon}
    </button>
  );
}
