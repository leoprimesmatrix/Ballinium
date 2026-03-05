import React, { useState, useEffect } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ControlPanel } from './components/ControlPanel';
import { StrategyHUD } from './components/StrategyHUD';
import { Credits } from './components/Credits';
import { GameSettings, AudioMode, SimulationMode, GameMode, GameState, ToolType, Tool } from './types';
import { INITIAL_SETTINGS, TOTAL_LEVELS } from './constants';
import { audioService } from './services/audioService';
import { fetchServerConfig } from './services/firebaseService';
import { Play, RotateCcw, Menu, ArrowRight, Zap, ShieldAlert } from 'lucide-react';
import { getLevel } from './levels';

const App: React.FC = () => {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [serverStatus, setServerStatus] = useState<'IDLE' | 'CONNECTING' | 'ONLINE' | 'OFFLINE'>('IDLE');
  const [announcement, setAnnouncement] = useState<string>('');

  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.PLANNING);

  const [settings, setSettings] = useState<GameSettings>(INITIAL_SETTINGS);
  const [fps, setFps] = useState(0);
  const [ballCount, setBallCount] = useState(0);
  const [resetSignal, setResetSignal] = useState(false);
  const [clearSignal, setClearSignal] = useState(false);

  // Strategy State
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [inventory, setInventory] = useState<Record<ToolType, number>>({ REFLECTOR: 0, ACCELERATOR: 0, GRAVITY_WELL: 0 });
  const [placedTools, setPlacedTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [levelName, setLevelName] = useState("");

  // Global Progression
  const [gameCompleted, setGameCompleted] = useState(() => {
    try {
      return localStorage.getItem('BALLINIUM_ASCENDED') === 'true';
    } catch { return false; }
  });

  const handleSystemInit = async () => {
    // Attempting Connection Layer
    setServerStatus('CONNECTING');
    setHasInteracted(true);

    try {
      const startTime = Date.now();
      const config = await fetchServerConfig();

      if (config.isOnline && config.secureKey) {
        // Fast path for successful connection
        setServerStatus('ONLINE');
        setAnnouncement(config.announcement || '');
        audioService.init();
        audioService.startMusic('AMBIENCE');
      } else {
        // Simulate a long 10-second retry loop to mimic a real connection timeout
        const elapsed = Date.now() - startTime;
        if (elapsed < 10000) {
          await new Promise(r => setTimeout(r, 10000 - elapsed));
        }

        setServerStatus('OFFLINE');
        setAnnouncement(config.announcement || 'Please try again later or check your internet connection.');
      }
    } catch (e) {
      // Fallback for safety
      setServerStatus('ONLINE');
      audioService.init();
      audioService.startMusic('AMBIENCE');
    }
  };

  const handleStart = (mode: GameMode) => {
    // If we are coming from Credits, force restart ambience
    if (gameState === GameState.CREDITS) {
      audioService.startMusic('AMBIENCE');
    }

    setGameMode(mode);

    if (mode === GameMode.CAMPAIGN || mode === GameMode.STRATEGY) {
      const startLevel = 0;
      setCurrentLevelIdx(startLevel);
      setSettings(prev => ({
        ...prev,
        mode: SimulationMode.LEVEL,
        currentLevel: startLevel,
        ballCount: 1
      }));
      setGameState(GameState.PLANNING);
      loadLevelData(startLevel);
    } else {
      setSettings(prev => ({
        ...prev,
        mode: SimulationMode.TRAP,
        currentLevel: undefined
      }));
      setGameState(GameState.RUNNING);
    }

    setResetSignal(true);
  };

  const loadLevelData = (index: number) => {
    const data = getLevel(index, 1920, 1080);
    setInventory(data.inventory);
    setLevelName(data.name);
    setPlacedTools([]);
    setGameState(GameState.PLANNING);
  };

  const handleLevelComplete = () => {
    if (gameState !== GameState.VICTORY) {
      setGameState(GameState.VICTORY);
    }
  };

  const nextLevel = () => {
    // Check if this was the final level
    if (currentLevelIdx >= TOTAL_LEVELS - 1) {
      // Start Credits
      setGameState(GameState.CREDITS);
      audioService.startMusic('CREDITS');
      return;
    }

    const next = currentLevelIdx + 1;
    setCurrentLevelIdx(next);
    setSettings(prev => ({ ...prev, currentLevel: next }));
    loadLevelData(next);
    setResetSignal(true);
  };

  const jumpToLevel = (index: number) => {
    setCurrentLevelIdx(index);
    setSettings(prev => ({ ...prev, currentLevel: index }));
    loadLevelData(index);
    setResetSignal(true);
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => {
      const needsReset = newSettings.mode && newSettings.mode !== prev.mode;
      if (needsReset) {
        setResetSignal(true);
      }
      return { ...prev, ...newSettings };
    });
  };

  const handleReset = () => {
    setResetSignal(true);
    if (gameMode === GameMode.STRATEGY) {
      setGameState(GameState.PLANNING);
    }
  };

  const handleClear = () => {
    setClearSignal(true);
    setPlacedTools([]);
  }

  const handleCreditsComplete = () => {
    setGameMode(null); // Return to Title
    setGameState(GameState.PLANNING);
    setGameCompleted(true);
    try {
      localStorage.setItem('BALLINIUM_ASCENDED', 'true');
    } catch (e) {
      console.warn("Storage access denied");
    }
    // NOTE: We do NOT stop the music here. 
    // Credits song will continue playing on Title Screen until user clicks Start.
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-rajdhani select-none">
      <div className="scanlines" />
      <div className="vignette" />

      {serverStatus === 'IDLE' && (
        <div
          onClick={handleSystemInit}
          className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4 animate-pulse">
            <Zap className="w-8 h-8 text-cyan-500" />
            <div className="text-cyan-500/80 font-mono text-xs tracking-[0.5em]">
              SYSTEM STANDBY
            </div>
            <h1 className="text-white font-display font-bold text-3xl tracking-widest neon-text-blue group-hover:scale-105 transition-transform duration-500">
              CLICK TO INITIALIZE
            </h1>
          </div>
        </div>
      )}

      {serverStatus === 'CONNECTING' && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <div className="relative z-10 flex flex-col items-center gap-4">
            <Zap className="w-8 h-8 text-cyan-500 animate-spin" />
            <h1 className="text-cyan-400 font-mono text-sm tracking-[0.5em] animate-pulse">
              CONNECTING TO SERVER...
            </h1>
          </div>
        </div>
      )}

      {serverStatus === 'OFFLINE' && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
          {/* Red Scanlines & Noise */}
          <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-screen" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.2) 2px, rgba(255,0,0,0.2) 4px)' }} />
          <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg text-center p-8 border border-red-500/30 bg-red-950/40 rounded-xl backdrop-blur-md shadow-[0_0_50px_rgba(255,0,0,0.15)]">
            <ShieldAlert className="w-16 h-16 text-red-500 mb-2 animate-pulse" />
            <h1 className="text-red-500 font-display font-black text-4xl md:text-5xl tracking-widest uppercase neon-text-pink drop-shadow-[0_0_10px_red]">
              FAILED TO CONNECT TO SERVER
            </h1>
            <div className="h-px w-full bg-red-500/50 mb-4" />
            <p className="text-red-300 font-mono text-sm leading-relaxed whitespace-pre-wrap uppercase">
              Please try again later or check your internet connection.
            </p>
            <div className="mt-8 text-red-700/80 font-mono text-xs tracking-widest">
              ERROR CODE 403 - CONNECTION ERROR
            </div>
          </div>
        </div>
      )}

      {serverStatus === 'ONLINE' && hasInteracted && (
        <>
          {/* Global Announcement Banner */}
          {announcement && !gameMode && (
            <div className="absolute top-0 left-0 right-0 z-[150] bg-cyan-900/80 border-b border-cyan-500/50 text-cyan-100 py-2 px-4 shadow-[0_0_10px_rgba(0,243,255,0.2)] flex justify-center items-center backdrop-blur-md">
              <span className="font-mono text-xs uppercase tracking-widest font-bold">INFO: {announcement}</span>
            </div>
          )}

          {!gameMode && <TitleScreen onStart={(m) => handleStart(m === GameMode.CAMPAIGN ? GameMode.STRATEGY : m)} gameCompleted={gameCompleted} />}

          {/* CREDITS OVERLAY */}
          {gameState === GameState.CREDITS && (
            <Credits onComplete={handleCreditsComplete} />
          )}

          {gameMode && gameState !== GameState.CREDITS && (
            <>
              <SimulationCanvas
                settings={settings}
                gameMode={gameMode}
                gameState={gameState}
                setGameState={setGameState}
                setFps={setFps}
                setBallCount={setBallCount}
                shouldReset={resetSignal}
                onResetComplete={() => setResetSignal(false)}
                shouldClear={clearSignal}
                onClearComplete={() => setClearSignal(false)}
                onLevelComplete={handleLevelComplete}
                gameCompleted={gameCompleted}

                inventory={inventory}
                selectedTool={selectedTool}
                placedTools={placedTools}
                onUpdateTools={setPlacedTools}
              />

              {/* SANDBOX UI */}
              {gameMode === GameMode.SANDBOX && (
                <ControlPanel
                  settings={settings}
                  updateSettings={updateSettings}
                  onReset={handleReset}
                  onClear={handleClear}
                  fps={fps}
                  ballCount={ballCount}
                />
              )}

              {/* STRATEGY HUD */}
              {gameMode === GameMode.STRATEGY && (
                <StrategyHUD
                  gameState={gameState}
                  setGameState={setGameState}
                  inventory={inventory}
                  placedTools={placedTools}
                  selectedTool={selectedTool}
                  setSelectedTool={setSelectedTool}
                  levelName={levelName}
                  onReset={handleReset}
                  currentLevel={currentLevelIdx}
                  onLevelSelect={jumpToLevel}
                />
              )}

              {/* VICTORY OVERLAY */}
              {gameState === GameState.VICTORY && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="bg-black border border-green-500 p-8 rounded-lg shadow-[0_0_50px_rgba(0,255,100,0.3)] text-center max-w-md w-full mx-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                    <h2 className="text-5xl font-display font-black text-green-400 mb-2 neon-text-green relative z-10">SUCCESS</h2>
                    <div className="h-px w-full bg-green-500/50 mb-6 relative z-10"></div>

                    <div className="flex gap-4 justify-center relative z-10">
                      <button
                        onClick={() => { setGameState(GameState.PLANNING); handleReset(); }}
                        className="flex items-center gap-2 px-6 py-3 border border-gray-600 text-gray-400 hover:bg-gray-800 transition-colors rounded"
                      >
                        <RotateCcw className="w-4 h-4" />
                        REPLAY
                      </button>
                      <button
                        onClick={nextLevel}
                        className="flex items-center gap-2 px-8 py-3 bg-green-500 text-black font-bold hover:bg-green-400 transition-colors rounded shadow-lg shadow-green-900/50"
                      >
                        {currentLevelIdx >= TOTAL_LEVELS - 1 ? "FINISH" : "NEXT SECTOR"}
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default App;