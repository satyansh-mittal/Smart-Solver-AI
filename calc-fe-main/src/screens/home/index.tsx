import { ColorSwatch, Group, Loader, Notification, Slider } from '@mantine/core'; // Added Slider import
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import { RefreshCw, Play, Eraser } from 'lucide-react'; // Added Eraser icon

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const [notification, setNotification] = useState<{ type: string; message: string } | null>(null); // Notification state
    
    // New state variables
    const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
    const [brushWidth, setBrushWidth] = useState(3);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = brushWidth; // Initial brush width
                ctx.strokeStyle = color; // Initial stroke style
                ctx.globalCompositeOperation = 'source-over'; // Initial composite operation
            }
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
            });
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []); // Run once on mount

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const fullText = `${expression} = ${answer}`;
    
        setLatexExpression(prev => [...prev, fullText]);
    
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.font = '48px "Times New Roman", serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = 'black';
                const padding = 20;
                    // Start of Selection
                    const maxWidth: number = canvas.width - 2 * padding;

                    const wrapText = (
                        context: CanvasRenderingContext2D,
                        text: string,
                        x: number,
                        y: number,
                        maxWidth: number,
                        lineHeight: number
                    ): void => {
                        const words: string[] = text.split(' ');
                        let line: string = '';
                        const lines: string[] = [];

                    for (let i = 0; i < words.length; i++) {
                        const testLine = line + words[i] + ' ';
                        const metrics = context.measureText(testLine);
                        const testWidth = metrics.width;
                        if (testWidth > maxWidth && i > 0) {
                            lines.push(line);
                            line = words[i] + ' ';
                        } else {
                            line = testLine;
                        }
                    }
                    lines.push(line);

                    for (let j = 0; j < lines.length; j++) {
                        context.fillText(lines[j], x, y + j * lineHeight);
                    }
                };

                const centerX = canvas.width / 2;
                const startY = padding;
                const lineHeight = 56;

                wrapText(ctx, fullText, centerX, startY, maxWidth, lineHeight);
            }
        }
    };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineWidth = brushWidth; // Set brush width
                if (tool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out'; // Set eraser mode
                    ctx.strokeStyle = 'rgba(0,0,0,1)';
                } else {
                    ctx.globalCompositeOperation = 'source-over'; // Set pencil mode
                    ctx.strokeStyle = color;
                }
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };  

    // Handler to select tool
    const selectTool = (selectedTool: 'pencil' | 'eraser') => {
        setTool(selectedTool);
    };

    // Handler for color selection
    const handleColorSelect = (selectedColor: string) => {
        setColor(selectedColor);
        setTool('pencil'); // Switch to pencil when a color is selected
    };

    const runRoute = async () => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            setIsLoading(true); // Start loading
            try {
                const response = await axios({
                    method: 'post',
                    url: `${import.meta.env.VITE_API_URL}/calculate`,
                    data: {
                        image: canvas.toDataURL('image/png'),
                        dict_of_vars: dictOfVars
                    }
                });

                const resp = await response.data;
                console.log('Response', resp);
                resp.data.forEach((data: Response) => {
                    if (data.assign === true) {
                        setDictOfVars(prev => ({
                            ...prev,
                            [data.expr]: data.result
                        }));
                    }
                });
                const ctx = canvas.getContext('2d');
                const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                setLatexPosition({ x: centerX, y: centerY });
                resp.data.forEach((data: Response) => {
                    setTimeout(() => {
                        setResult({
                            expression: data.expr,
                            answer: data.result
                        });
                    }, 1000);
                });

                // Show success notification
                setNotification({ type: 'success', message: 'Calculation successful!' });
            } catch (error) {
                console.error('Error running calculation:', error);
                // Show error notification
                setNotification({ type: 'error', message: 'Failed to run calculation.' });
            } finally {
                setIsLoading(false); // End loading
            }
        }
    };

    return (
        <>
            {notification && (
                <Notification
                    onClose={() => setNotification(null)}
                    color={notification.type === 'error' ? 'red' : 'green'}
                    title={notification.type === 'error' ? 'Error' : 'Success'}
                    withCloseButton
                >
                    {notification.message}
                </Notification>
            )}
            <div className='controls-container'>
                <div className='grid grid-cols-3 gap-1 p-1'> {/* Further reduced gap and padding */}
                    <Button
                        onClick={() => setReset(true)}
                        className='z-20 bg-black text-white flex items-center justify-center gap-1 px-2 py-1 hover:bg-gray-700 transition text-sm' // Reduced padding and font size
                        variant='default' 
                        color='black'
                        aria-label='Reset Canvas'
                        disabled={isLoading} // Disable during loading
                    >
                        <RefreshCw size={16} /> Reset {/* Reduced icon size */}
                    </Button>
                    <Group className='z-20'>
                        {SWATCHES.map((swatch) => (
                            <ColorSwatch 
                                key={swatch} 
                                color={swatch} 
                                onClick={() => handleColorSelect(swatch)} 
                                style={{ cursor: 'pointer', width: '24px', height: '24px' }} // Smaller swatch size
                            />
                        ))}
                    </Group>
                    <Button
                        onClick={runRoute}
                        className='z-20 bg-green-500 text-white flex items-center justify-center gap-1 px-2 py-1 hover:bg-green-600 transition text-sm' // Reduced padding and font size
                        variant='default'
                        color='white'
                        aria-label='Run Calculation'
                        disabled={isLoading} // Disable during loading
                    >
                        {isLoading ? <Loader size="sm" /> : <Play size={16} />} Run {/* Reduced icon size */}
                    </Button>
                </div>
                <div className='additional-controls p-1 flex items-center gap-1'> {/* Further reduced padding and gap */}
                    <Button
                        onClick={() => selectTool('eraser')}
                        className={`z-20 flex items-center justify-center gap-1 hover:bg-gray-700 transition ${tool === 'eraser' ? 'bg-gray-700' : 'bg-black'} px-2 py-1 text-sm`} // Reduced padding and font size
                        variant='default'
                        color='black'
                        aria-label='Eraser'
                        disabled={isLoading}
                    >
                        <Eraser size={16} /> Eraser {/* Reduced icon size */}
                    </Button><br></br>
                    <div className='w-24'> {/* Further reduced width */}
                        <label htmlFor="brushWidth" className="block text-xs font-medium text-white">Brush</label> {/* Changed text color to white */}
                        <Slider
                            id="brushWidth"
                            min={1}
                            max={20}
                            value={brushWidth}
                            onChange={setBrushWidth}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                id='canvas'
                className='canvas-area'
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />

            {latexExpression && latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(_, data) => setLatexPosition({ x: data.x, y: data.y })}
                >
                    <div className="absolute p-4 text-white bg-gray-800 bg-opacity-75 rounded shadow-md transition-transform transform hover:scale-105">
                        <div className="latex-content">{latex}</div>
                    </div>
                </Draggable>
            ))}
        </>
    );
}