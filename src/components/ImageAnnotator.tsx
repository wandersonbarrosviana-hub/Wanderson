import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Text, Arrow, Transformer, Group } from 'react-konva';
import useImage from 'use-image';
import { 
  Type, 
  Square, 
  Circle as CircleIcon, 
  ArrowUpRight, 
  MousePointer2,
  Trash2,
  Maximize2,
  Minimize2,
  Palette,
  Minus,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

type ToolType = 'select' | 'text' | 'rect' | 'circle' | 'arrow';
type DashType = 'solid' | 'dashed' | 'dotted';

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
  dash?: number[];
}

interface ImageAnnotatorProps {
  imageUrl?: string;
  initialElements?: Element[];
  onChange: (imageUrl: string, elements: Element[], annotatedImageUrl?: string) => void;
  readOnly?: boolean;
}

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Black', value: '#0f172a' },
  { name: 'Purple', value: '#a855f7' }
];

const DASH_STYLES: Record<DashType, number[] | undefined> = {
  solid: undefined,
  dashed: [10, 5],
  dotted: [2, 4]
};

const VIRTUAL_SIZE = 1000;

export function ImageAnnotator({ imageUrl, initialElements = [], onChange, readOnly = false }: ImageAnnotatorProps) {
  const [image] = useImage(imageUrl || '');
  const [elements, setElements] = useState<Element[]>(initialElements);
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [selectedDash, setSelectedDash] = useState<DashType>('solid');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textInput, setTextInput] = useState<{ visible: boolean, x: number, y: number, value: string, id: string | null }>({ visible: false, x: 0, y: 0, value: '', id: null });
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  let imageScale = 1;
  let imagePos = { x: 0, y: 0 };
  let virtualScale = 1;

  if (image && stageSize.width > 0) {
    const scaleX = stageSize.width / image.width;
    const scaleY = stageSize.height / image.height;
    imageScale = Math.min(scaleX, scaleY);
    if (imageScale > 1) imageScale = 1;
    imagePos = {
      x: (stageSize.width - image.width * imageScale) / 2,
      y: (stageSize.height - image.height * imageScale) / 2
    };
    virtualScale = (image.width * imageScale) / VIRTUAL_SIZE;
  }

  const getVirtualPointerPos = () => {
    if (!stageRef.current || !image) return { x: 0, y: 0 };
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: (pos.x - imagePos.x) / virtualScale,
      y: (pos.y - imagePos.y) / virtualScale
    };
  };

  const exportFlattened = useCallback(() => {
    if (stageRef.current && image) {
      const tr = stageRef.current.findOne('Transformer');
      if (tr) tr.hide();
      
      const dataUrl = stageRef.current.toDataURL({ 
        pixelRatio: 2,
        x: imagePos.x,
        y: imagePos.y,
        width: image.width * imageScale,
        height: image.height * imageScale
      });
      
      if (tr) tr.show();
      return dataUrl;
    }
    return undefined;
  }, [image, imagePos, imageScale]);

  useEffect(() => {
    if (textInput.visible && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    }
  }, [textInput.visible]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight || 400
        });
      }
    };
    
    updateSize();
    // Add a small delay to ensure the DOM has updated classes before measuring
    const timer = setTimeout(updateSize, 50);
    
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      clearTimeout(timer);
    };
  }, [imageUrl, isFullscreen]);

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
    if (readOnly || !image) return;

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

    const pos = getVirtualPointerPos();
    const id = Math.random().toString(36).substr(2, 9);
    setIsDrawing(true);

    if (selectedTool === 'text') {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      setTextInput({
        visible: true,
        x: pointer.x,
        y: pointer.y,
        value: '',
        id
      });
      return;
    }

    let newEl: Element;
    if (selectedTool === 'rect') {
      newEl = { id, type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0, stroke: selectedColor, dash: DASH_STYLES[selectedDash] };
    } else if (selectedTool === 'circle') {
      newEl = { id, type: 'circle', x: pos.x, y: pos.y, radius: 0, stroke: selectedColor, dash: DASH_STYLES[selectedDash] };
    } else if (selectedTool === 'arrow') {
      newEl = { id, type: 'arrow', x: pos.x, y: pos.y, points: [0, 0, 0, 0], stroke: selectedColor, dash: DASH_STYLES[selectedDash] };
    } else {
      return;
    }

    setElements([...elements, newEl]);
    setSelectedId(id);
  };

  const handleMouseMove = (e: any) => {
    if (readOnly || !isDrawing || selectedTool === 'select' || selectedTool === 'text') return;

    const pos = getVirtualPointerPos();
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
      // Use setTimeout to allow state to settle before export
      setTimeout(() => {
        onChange(imageUrl || '', elements, exportFlattened());
      }, 0);
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
    setTimeout(() => {
      onChange(imageUrl || '', newElements, exportFlattened());
    }, 100);
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
            width: (el.width || 0) * scaleX,
            height: (el.height || 0) * scaleY
          };
        }
        if (el.type === 'circle') {
          return {
            ...el,
            x: node.x(),
            y: node.y(),
            radius: (el.radius || 0) * Math.max(scaleX, scaleY)
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
             fontSize: node.fontSize(),
             width: node.width(),
             height: node.height()
           };
        }
      }
      return el;
    });
    setElements(newElements);
    setTimeout(() => {
      onChange(imageUrl || '', newElements, exportFlattened());
    }, 100);
  };

  const handleDelete = () => {
    if (selectedId) {
      const newElements = elements.filter(el => el.id !== selectedId);
      setElements(newElements);
      setSelectedId(null);
      setTimeout(() => {
        onChange(imageUrl || '', newElements, exportFlattened());
      }, 0);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (selectedId) {
      const newElements = elements.map(el => {
        if (el.id === selectedId) {
          return { ...el, stroke: color, fill: el.type === 'text' ? color : undefined };
        }
        return el;
      });
      setElements(newElements);
      setTimeout(() => {
        onChange(imageUrl || '', newElements, exportFlattened());
      }, 0);
    }
  };

  const handleDashChange = (dashStyle: DashType) => {
    setSelectedDash(dashStyle);
    if (selectedId) {
      const newElements = elements.map(el => {
        if (el.id === selectedId && (el.type === 'rect' || el.type === 'circle' || el.type === 'arrow')) {
          return { ...el, dash: DASH_STYLES[dashStyle] };
        }
        return el;
      });
      setElements(newElements);
      setTimeout(() => {
        onChange(imageUrl || '', newElements, exportFlattened());
      }, 0);
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

  return (
    <div 
      className={cn(
        "flex flex-col bg-slate-50 overflow-hidden transition-all",
        isFullscreen 
          ? "fixed inset-0 z-[60] p-4 bg-slate-900/90" 
          : "h-full w-full border border-slate-200 rounded-lg relative"
      )} 
      ref={containerRef}
    >
      {!readOnly && (
        <div className={cn(
          "bg-white border-b border-slate-200 p-2 flex items-center gap-2 overflow-x-auto no-scrollbar min-h-[52px]",
          isFullscreen && "rounded-t-lg"
        )}>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            id="image-upload" 
            onChange={handleImageUpload}
          />
          <ToolButton 
            icon={<ImageIcon size={20} />} 
            onClick={() => document.getElementById('image-upload')?.click()} 
            title="Upload" 
            className="flex-shrink-0" 
          />

          {imageUrl && (
            <>
              <div className="w-px h-6 bg-slate-300 mx-1 flex-shrink-0"></div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <ToolButton icon={<MousePointer2 size={20} />} active={selectedTool === 'select'} onClick={() => setSelectedTool('select')} title="Selecionar" />
                <ToolButton icon={<Square size={20} />} active={selectedTool === 'rect'} onClick={() => setSelectedTool('rect')} title="Retângulo" />
                <ToolButton icon={<CircleIcon size={20} />} active={selectedTool === 'circle'} onClick={() => setSelectedTool('circle')} title="Círculo" />
                <ToolButton icon={<ArrowUpRight size={20} />} active={selectedTool === 'arrow'} onClick={() => setSelectedTool('arrow')} title="Seta" />
                <ToolButton icon={<Type size={20} />} active={selectedTool === 'text'} onClick={() => setSelectedTool('text')} title="Texto" />
              </div>
              
              <div className="w-px h-6 bg-slate-300 mx-1 flex-shrink-0"></div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {COLORS.map(c => (
                  <button 
                    key={c.value}
                    onClick={() => handleColorChange(c.value)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform",
                      selectedColor === c.value ? "border-slate-800 scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>

              <div className="w-px h-6 bg-slate-300 mx-1 flex-shrink-0"></div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {(Object.keys(DASH_STYLES) as DashType[]).map(style => (
                  <button
                    key={style}
                    onClick={() => handleDashChange(style)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-bold border rounded transition-colors min-w-[44px] flex items-center justify-center",
                      selectedDash === style ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                    title={style.charAt(0).toUpperCase() + style.slice(1)}
                  >
                    {style === 'solid' && <div className="w-6 h-0.5 bg-current" />}
                    {style === 'dashed' && <div className="w-6 h-0.5 border-b-2 border-dashed border-current" />}
                    {style === 'dotted' && <div className="w-6 h-0.5 border-b-2 border-dotted border-current" />}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-slate-300 mx-1 flex-shrink-0"></div>
              
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={cn(
                  "p-2 rounded-md transition-colors flex-shrink-0",
                  isFullscreen ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                )}
                title={isFullscreen ? "Sair do Foco" : "Focar / Tela Cheia"}
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>

              {selectedId && (
                <button 
                  onClick={handleDelete}
                  className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                  title="Excluir Elemento"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className={cn(
        "flex-1 w-full bg-slate-100 min-h-[400px] relative overflow-hidden touch-none",
        isFullscreen && "bg-white rounded-b-lg"
      )}>
        {imageUrl && (
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md transition-all hover:scale-110 border border-slate-200"
            title={isFullscreen ? "Sair do Foco" : "Ver em Tela Cheia"}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        )}
        {textInput.visible && !readOnly && (
          <textarea
            ref={textInputRef}
            className="absolute z-10 p-2 border-2 border-blue-500 rounded text-xl bg-white/90 outline-none resize-both shadow-lg"
            style={{ 
              top: textInput.y, 
              left: textInput.x, 
              minWidth: '150px',
              minHeight: '40px',
              color: selectedColor,
              whiteSpace: 'pre-wrap',
              overflow: 'hidden'
            }}
            value={textInput.value}
            onChange={(e) => {
              setTextInput({ ...textInput, value: e.target.value });
              if (textInputRef.current) {
                textInputRef.current.style.height = 'auto';
                textInputRef.current.style.height = textInputRef.current.scrollHeight + 'px';
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (textInput.value.trim()) {
                  const width = textInputRef.current ? (textInputRef.current.offsetWidth / virtualScale) : undefined;
                  const newEl: Element = { id: textInput.id!, type: 'text', x: (textInput.x - imagePos.x) / virtualScale, y: (textInput.y - imagePos.y) / virtualScale, text: textInput.value, fill: selectedColor, fontSize: 20, width };
                  const newElements = [...elements, newEl];
                  setElements(newElements);
                  setTimeout(() => {
                    onChange(imageUrl || '', newElements, exportFlattened());
                  }, 100);
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
              if (textInput.value.trim()) {
                  const width = textInputRef.current ? (textInputRef.current.offsetWidth / virtualScale) : undefined;
                  const newEl: Element = { id: textInput.id!, type: 'text', x: (textInput.x - imagePos.x) / virtualScale, y: (textInput.y - imagePos.y) / virtualScale, text: textInput.value, fill: selectedColor, fontSize: 20, width };
                  const newElements = [...elements, newEl];
                  setElements(newElements);
                  setTimeout(() => {
                    onChange(imageUrl || '', newElements, exportFlattened());
                  }, 100);
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
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            ref={stageRef}
          >
            <Layer>
              <KonvaImage
                image={image}
                x={imagePos.x}
                y={imagePos.y}
                scaleX={imageScale}
                scaleY={imageScale}
                name="background-image"
              />
              <Group
                x={imagePos.x}
                y={imagePos.y}
                scaleX={virtualScale}
                scaleY={virtualScale}
              >
                {elements.map((el, i) => {
                  const isSelected = el.id === selectedId;
                  const commonProps = {
                    id: el.id,
                    x: el.x,
                    y: el.y,
                    draggable: !readOnly && isSelected,
                    onClick: () => !readOnly && setSelectedId(el.id),
                    onTap: () => !readOnly && setSelectedId(el.id),
                    onDblClick: (e: any) => {
                      if (!readOnly && el.type === 'text') {
                        const node = e.target;
                        const textPosition = node.absolutePosition();
                        setTextInput({
                          visible: true,
                          x: textPosition.x,
                          y: textPosition.y,
                          value: el.text || '',
                          id: el.id
                        });
                        setElements(elements.filter(e => e.id !== el.id));
                        setSelectedId(null);
                      }
                    },
                    onDblTap: (e: any) => {
                      if (!readOnly && el.type === 'text') {
                        const node = e.target;
                        const textPosition = node.absolutePosition();
                        setTextInput({
                          visible: true,
                          x: textPosition.x,
                          y: textPosition.y,
                          value: el.text || '',
                          id: el.id
                        });
                        setElements(elements.filter(e => e.id !== el.id));
                        setSelectedId(null);
                      }
                    },
                    onDragEnd: (e: any) => handleDragEnd(e, el.id),
                    onTransformEnd: (e: any) => handleTransformEnd(e, el.id),
                    strokeWidth: 4 / virtualScale,
                  };

                  if (el.type === 'rect') {
                    return <Rect key={el.id} {...commonProps} width={el.width} height={el.height} stroke={el.stroke} dash={el.dash} />;
                  }
                  if (el.type === 'circle') {
                    return <Circle key={el.id} {...commonProps} radius={el.radius} stroke={el.stroke} dash={el.dash} />;
                  }
                  if (el.type === 'arrow') {
                    return <Arrow key={el.id} {...commonProps} points={el.points || []} stroke={el.stroke} fill={el.stroke} dash={el.dash} pointerLength={15 / virtualScale} pointerWidth={15 / virtualScale} />;
                  }
                  if (el.type === 'text') {
                    return (
                      <Text 
                        key={el.id} 
                        {...commonProps} 
                        text={el.text} 
                        fill={el.fill} 
                        fontSize={el.fontSize || 20} 
                        width={el.width}
                        height={el.height}
                        onTransform={(e: any) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();
                          
                          node.scaleX(1);
                          node.scaleY(1);

                          const newWidth = Math.max(node.width() * scaleX, 20);
                          const newHeight = Math.max(node.height() * scaleY, 20);

                          if (scaleX !== 1 && scaleY === 1) {
                            // Dragging sides: change width only
                            node.width(newWidth);
                          } else if (scaleX === 1 && scaleY !== 1) {
                            // Dragging top/bottom: change height only
                            node.height(newHeight);
                          } else {
                            // Dragging corners: change font size and width proportionally
                            node.width(newWidth);
                            node.fontSize(Math.max(node.fontSize() * scaleY, 10));
                          }
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </Group>
              {selectedId && !readOnly && (
                <Transformer
                  ref={trRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 5 || newBox.height < 5) {
                      return oldBox;
                    }
                    return newBox;
                  }}
                  anchorSize={12}
                  rotateAnchorOffset={25}
                  enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-right', 'bottom-right', 'bottom-center', 'bottom-left', 'middle-left']}
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

function ToolButton({ icon, active, onClick, title, className }: { icon: React.ReactNode, active?: boolean, onClick: () => void, title: string, className?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-2 rounded-md transition-all",
        active ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100",
        className
      )}
    >
      {icon}
    </button>
  );
}
