import React, { useEffect, useState, useRef } from 'react';
import { Hexagon, Layers, Box, Star } from 'lucide-react';
import { GameMode } from '../types';
import { audioService } from '../services/audioService';

interface TitleScreenProps {
    onStart: (mode: GameMode) => void;
    gameCompleted?: boolean;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart, gameCompleted = false }) => {
    const [glitch, setGlitch] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => {
            setLoaded(true);
        }, 100);

        // Glitch effect loop
        const interval = setInterval(() => {
            setGlitch(true);
            setTimeout(() => setGlitch(false), 150);
        }, 3000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);


    // BACKGROUND ANIMATION LOOP
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;

        // --- STANDARD HEXAGON LOOP ---
        if (!gameCompleted) {
            const hexRadius = 40;
            const hexHeight = Math.sqrt(3) * hexRadius;
            const hexWidth = 2 * hexRadius;
            const xOffset = hexWidth * 0.75;

            interface HexCell { x: number; y: number; active: number; speed: number; }
            const cells: HexCell[] = [];

            const init = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                cells.length = 0;
                const cols = Math.ceil(canvas.width / xOffset) + 2;
                const rows = Math.ceil(canvas.height / hexHeight) + 2;

                for (let col = 0; col < cols; col++) {
                    for (let row = 0; row < rows; row++) {
                        const yOffset = (col % 2) * (hexHeight / 2);
                        cells.push({
                            x: col * xOffset,
                            y: row * hexHeight + yOffset,
                            active: 0,
                            speed: Math.random() * 0.02 + 0.005
                        });
                    }
                }
            };
            init();

            const drawHex = (x: number, y: number, r: number) => {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = 2 * Math.PI / 6 * i;
                    const px = x + r * Math.cos(angle);
                    const py = y + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
            };

            const render = (time: number) => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (Math.random() > 0.95) {
                    const idx = Math.floor(Math.random() * cells.length);
                    if (cells[idx].active <= 0.01) cells[idx].active = 1;
                }

                cells.forEach(cell => {
                    if (cell.active > 0) {
                        cell.active -= cell.speed;
                        if (cell.active < 0) cell.active = 0;
                    }

                    if (cell.active > 0) {
                        ctx.strokeStyle = `rgba(0, 243, 255, ${cell.active * 0.3})`;
                        ctx.fillStyle = `rgba(0, 243, 255, ${cell.active * 0.05})`;
                        ctx.lineWidth = 1;
                        drawHex(cell.x, cell.y, hexRadius);
                        ctx.stroke();
                        ctx.fill();
                    } else {
                        if (Math.sin(cell.x + time / 2000) * Math.cos(cell.y + time / 3000) > 0.8) {
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
                            ctx.lineWidth = 1;
                            drawHex(cell.x, cell.y, hexRadius);
                            ctx.stroke();
                        }
                    }
                });
                animId = requestAnimationFrame(() => render(performance.now()));
            };
            render(0);
            window.addEventListener('resize', init);
            return () => {
                window.removeEventListener('resize', init);
                cancelAnimationFrame(animId);
            };
        }
        // --- ASCENDED / COMPLETED VISUALS ---
        else {
            interface Particle {
                x: number; y: number; vx: number; vy: number;
                size: number; color: string; alpha: number;
                life: number; maxLife: number; type: 'orb' | 'hex' | 'dust';
                phase: number;
            }

            const particles: Particle[] = [];
            const colors = ['#00f3ff', '#bc13fe', '#00ff9f', '#ffffff'];
            let width = window.innerWidth;
            let height = window.innerHeight;

            const createParticle = (isDust = false): Particle => {
                const typeProb = Math.random();
                let type: 'orb' | 'hex' | 'dust' = 'orb';
                if (isDust) type = 'dust';
                else if (typeProb > 0.8) type = 'hex';

                return {
                    x: Math.random() * width,
                    y: height + Math.random() * 100,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: type === 'dust' ? Math.random() * 0.5 + 0.2 : Math.random() * 1.5 + 0.5,
                    size: type === 'dust' ? Math.random() * 2 : Math.random() * 40 + 5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 0,
                    life: 0,
                    maxLife: 500 + Math.random() * 500,
                    type,
                    phase: Math.random() * Math.PI * 2
                };
            };

            const init = () => {
                width = window.innerWidth;
                height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
            };
            init();

            for (let i = 0; i < 50; i++) particles.push(createParticle());
            for (let i = 0; i < 100; i++) particles.push(createParticle(true));

            let time = 0;
            const render = () => {
                time += 0.005;
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = 'rgba(5, 5, 10, 0.2)';
                ctx.fillRect(0, 0, width, height);

                // Aurora Effect
                ctx.globalCompositeOperation = 'screen';
                const gradX = Math.sin(time) * width * 0.5 + width * 0.5;
                const gradY = Math.cos(time * 0.7) * height * 0.5 + height * 0.5;
                const gradient = ctx.createRadialGradient(gradX, gradY, 0, gradX, gradY, width * 0.8);
                gradient.addColorStop(0, 'rgba(0, 243, 255, 0.03)');
                gradient.addColorStop(0.5, 'rgba(188, 19, 254, 0.02)');
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                ctx.globalCompositeOperation = 'lighter';

                particles.forEach((p, i) => {
                    p.y -= p.vy;
                    p.x += Math.sin(time + p.phase) * 0.5;
                    p.life++;
                    if (p.life < 100) p.alpha = (p.life / 100) * 0.5;
                    else if (p.y < -50) p.alpha -= 0.01;

                    if (p.y < -100 || p.alpha < 0) {
                        particles[i] = createParticle(p.type === 'dust');
                        particles[i].y = height + 10;
                    }

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.strokeStyle = p.color;

                    if (p.type === 'hex') {
                        ctx.rotate(time + p.phase);
                        ctx.beginPath();
                        for (let j = 0; j < 6; j++) {
                            const angle = (Math.PI / 3) * j;
                            const r = p.size;
                            ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
                        }
                        ctx.closePath();
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    } else if (p.type === 'dust') {
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
                        glow.addColorStop(0, p.color);
                        glow.addColorStop(1, 'rgba(0,0,0,0)');
                        ctx.fillStyle = glow;
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(0, 0, p.size * 0.1, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                });
                animId = requestAnimationFrame(render);
            };
            render();

            window.addEventListener('resize', init);
            return () => {
                window.removeEventListener('resize', init);
                cancelAnimationFrame(animId);
            };
        }
    }, [gameCompleted]);


    const getRevealStyle = (delay: number) => ({
        opacity: loaded ? 1 : 0,
        filter: loaded ? 'blur(0px)' : 'blur(30px)',
        transform: loaded ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
        transition: `all 3s cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms`
    });

    return (
        <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none cursor-default"
        >
            <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-50 pointer-events-none" />

            {/* Background Grid Animation (Only show if not completed to avoid cluttering Aurora) */}
            {!gameCompleted && (
                <div className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-3000" style={{ opacity: loaded ? 0.2 : 0 }}>
                    <div className="w-full h-full" style={{
                        backgroundImage: 'linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
                        animation: 'gridMove 20s linear infinite'
                    }}></div>
                </div>
            )}
            <style>{`
        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(40px) translateZ(-200px); }
        }
      `}</style>

            {/* Main Content Container */}
            <div className="relative z-10 text-center flex flex-col items-center w-full max-w-4xl">

                {/* LOGO SECTION - Always Visible (but animates in) */}
                <div style={getRevealStyle(0)} className="transition-all duration-1000 flex flex-col items-center">

                    {/* STUDIO HEADER SECTION - Dynamic based on Mode */}
                    <div className="mb-10 relative group h-10 flex items-center justify-center w-full">
                        <div className={`absolute transition-all duration-1000 ease-in-out flex flex-col items-center opacity-100 scale-100 blur-0`}>
                            <h2 className="font-display text-sm md:text-lg font-bold tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-cyan-200 uppercase drop-shadow-[0_0_15px_rgba(0,243,255,0.6)]">
                                PRIMEDEV STUDIOS
                            </h2>
                            <div className="absolute -bottom-3 w-2/3 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60"></div>
                        </div>
                    </div>

                    {/* BALLINIUM Logo */}
                    <div className="flex items-center justify-center mb-6">
                        {gameCompleted ? (
                            <Star className={`w-12 h-12 animate-pulse mr-4 text-yellow-400 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]`} />
                        ) : (
                            <Hexagon className={`w-12 h-12 animate-spin-slow mr-4 transition-colors duration-1000 text-cyan-400`} />
                        )}
                    </div>
                    <h1 className={`font-display text-6xl md:text-8xl font-black uppercase tracking-tighter text-white transition-all duration-1000 ${glitch ? 'skew-x-12 translate-x-2' : ''} neon-text-blue`}>
                        BALLINIUM
                    </h1>
                </div>

                {/* CONDITIONAL SECTION WRAPPER */}
                <div className={`w-full relative transition-all duration-500 mt-8 min-h-[300px] opacity-100`}>

                    {/* NORMAL MODE */}
                    <div
                        className={`flex flex-col items-center w-full absolute top-0 left-0 transition-all duration-1000 ease-in-out opacity-100 blur-0 scale-100 translate-y-0`}
                    >
                        <p className={`mb-12 font-light tracking-[0.5em] text-sm uppercase opacity-80 ${gameCompleted ? 'text-yellow-200 drop-shadow-[0_0_5px_gold]' : 'text-cyan-200'}`} style={getRevealStyle(500)}>
                            {gameCompleted ? "System Ascended // Limitless Mode Active" : "Physics Simulation Engine V.2.0"}
                        </p>

                        <div className="flex flex-col md:flex-row gap-6 z-20 justify-center">
                            {/* Campaign Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onStart(GameMode.CAMPAIGN); }}
                                className="group relative px-8 py-6 w-64 bg-transparent border border-cyan-500 overflow-hidden transition-all duration-300 hover:bg-cyan-900/20"
                                style={getRevealStyle(1000)}
                            >
                                <div className="absolute inset-0 w-0 bg-cyan-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
                                <div className="flex flex-col items-center gap-2">
                                    <Layers className="w-8 h-8 text-cyan-400 group-hover:text-white transition-colors mb-2" />
                                    <span className="font-display font-bold text-xl tracking-widest text-cyan-400 group-hover:text-white group-hover:neon-text-blue transition-all">
                                        CAMPAIGN
                                    </span>
                                    <span className="text-[10px] text-cyan-600 font-mono">12 SECTORS</span>
                                </div>
                            </button>

                            {/* Sandbox Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onStart(GameMode.SANDBOX); }}
                                className="group relative px-8 py-6 w-64 bg-transparent border border-purple-500 overflow-hidden transition-all duration-300 hover:bg-purple-900/20"
                                style={getRevealStyle(1400)}
                            >
                                <div className="absolute inset-0 w-0 bg-purple-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
                                <div className="flex flex-col items-center gap-2">
                                    <Box className="w-8 h-8 text-purple-400 group-hover:text-white transition-colors mb-2" />
                                    <span className="font-display font-bold text-xl tracking-widest text-purple-400 group-hover:text-white group-hover:neon-text-pink transition-all">
                                        SANDBOX
                                    </span>
                                    <span className="text-[10px] text-purple-600 font-mono">UNLIMITED CHAOS</span>
                                </div>
                            </button>
                        </div>

                        <div className="mt-16 text-xs text-gray-600 font-mono" style={getRevealStyle(2000)}>
                            © PRIMEDEV STUDIOS 2026 // DO NOT DISTRIBUTE
                        </div>
                    </div>

                </div>
            </div>
            {/* Social Links Positioned Bottom Right */}
            <div className="absolute bottom-6 right-8 md:bottom-10 md:right-12 flex items-center gap-6 z-50" style={getRevealStyle(1000)}>
                <a
                    href="https://x.com/PrimeDevv"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110"
                >
                    <div className="w-10 h-10 border border-cyan-900 bg-black/50 backdrop-blur-md text-cyan-500 group-hover:border-cyan-400 group-hover:text-cyan-300 drop-shadow-[0_0_10px_rgba(0,243,255,0.1)] group-hover:drop-shadow-[0_0_15px_rgba(0,243,255,0.4)] flex items-center justify-center transition-all duration-300 transform rotate-45 group-hover:rotate-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="-rotate-45 group-hover:rotate-0 transition-transform duration-300">
                            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                        </svg>
                    </div>
                    <span className="text-[9px] font-display tracking-widest text-cyan-900 group-hover:text-cyan-400 transition-colors uppercase">X Update</span>
                </a>

                <a
                    href="https://discord.gg/bYsa6DJXAx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-1 transition-all duration-300 hover:scale-110"
                >
                    <div className="w-10 h-10 border border-purple-900 bg-black/50 backdrop-blur-md text-purple-500 group-hover:border-purple-400 group-hover:text-purple-300 drop-shadow-[0_0_10px_rgba(188,19,254,0.1)] group-hover:drop-shadow-[0_0_15px_rgba(188,19,254,0.4)] flex items-center justify-center transition-all duration-300 transform rotate-45 group-hover:rotate-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="-rotate-45 group-hover:rotate-0 transition-transform duration-300">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                        </svg>
                    </div>
                    <span className="text-[9px] font-display tracking-widest text-purple-900 group-hover:text-purple-400 transition-colors uppercase">HQ</span>
                </a>
            </div>
        </div>
    );
};