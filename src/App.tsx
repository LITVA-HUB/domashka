import { useState, useEffect, useCallback, useRef } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type Difficulty = 'easy' | 'medium' | 'hard';
type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

const GRID_SIZE = 20;

const DIFFICULTY_SPEEDS: Record<Difficulty, number> = {
  easy: 180,
  medium: 120,
  hard: 70,
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'from-green-500 to-emerald-600',
  medium: 'from-yellow-500 to-orange-600',
  hard: 'from-red-500 to-rose-600',
};

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(seg => seg.x === pos.x && seg.y === pos.y));
  return pos;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [shaking, setShaking] = useState(false);

  const directionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastDirectionRef = useRef<Direction>('RIGHT');

  const speed = DIFFICULTY_SPEEDS[difficulty];

  // Save high score
  useEffect(() => {
    localStorage.setItem('snake-highscore', highScore.toString());
  }, [highScore]);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(getRandomPosition(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    lastDirectionRef.current = 'RIGHT';
    setScore(0);
    setShaking(false);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
  }, [resetGame]);

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  }, [gameState]);

  const gameOver = useCallback(() => {
    setGameState('gameover');
    setShaking(true);
    if (score > highScore) {
      setHighScore(score);
    }
    setTimeout(() => setShaking(false), 400);
  }, [score, highScore]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = window.setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDir = directionRef.current;

        switch (currentDir) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          gameOver();
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          gameOver();
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => prev + 10);
          setFood(getRandomPosition(newSnake));
        } else {
          newSnake.pop();
        }

        lastDirectionRef.current = currentDir;
        return newSnake;
      });
    }, speed);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, speed, food, gameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'menu') {
        if (e.key === 'Enter' || e.key === ' ') {
          startGame();
          return;
        }
      }

      if (gameState === 'gameover') {
        if (e.key === 'Enter' || e.key === ' ') {
          startGame();
          return;
        }
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
          return;
        }
      }

      if (gameState !== 'playing') return;

      const lastDir = lastDirectionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (lastDir !== 'DOWN') {
            directionRef.current = 'UP';
            setDirection('UP');
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (lastDir !== 'UP') {
            directionRef.current = 'DOWN';
            setDirection('DOWN');
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (lastDir !== 'RIGHT') {
            directionRef.current = 'LEFT';
            setDirection('LEFT');
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (lastDir !== 'LEFT') {
            directionRef.current = 'RIGHT';
            setDirection('RIGHT');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startGame, togglePause]);

  // Touch controls (swipe)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || gameState !== 'playing') return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    const lastDir = lastDirectionRef.current;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && lastDir !== 'LEFT') {
        directionRef.current = 'RIGHT';
        setDirection('RIGHT');
      } else if (dx < 0 && lastDir !== 'RIGHT') {
        directionRef.current = 'LEFT';
        setDirection('LEFT');
      }
    } else {
      if (dy > 0 && lastDir !== 'UP') {
        directionRef.current = 'DOWN';
        setDirection('DOWN');
      } else if (dy < 0 && lastDir !== 'DOWN') {
        directionRef.current = 'UP';
        setDirection('UP');
      }
    }

    touchStartRef.current = null;
  }, [gameState]);

  // Mobile button controls
  const handleDirectionButton = useCallback((dir: Direction) => {
    if (gameState !== 'playing') return;
    const lastDir = lastDirectionRef.current;
    if (
      (dir === 'UP' && lastDir !== 'DOWN') ||
      (dir === 'DOWN' && lastDir !== 'UP') ||
      (dir === 'LEFT' && lastDir !== 'RIGHT') ||
      (dir === 'RIGHT' && lastDir !== 'LEFT')
    ) {
      directionRef.current = dir;
      setDirection(dir);
    }
  }, [gameState]);

  // Render game grid
  const renderGrid = () => {
    const cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
        const snakeIndex = snake.findIndex(seg => seg.x === x && seg.y === y);
        const isSnakeBody = snakeIndex > 0;
        const isFood = food.x === x && food.y === y;

        let cellClass = 'game-cell';
        let cellStyle: React.CSSProperties = {};

        if (isSnakeHead) {
          cellClass += ' snake-head';
          const gradient = 'linear-gradient(135deg, #4ade80, #22c55e)';
          cellStyle = { background: gradient };
        } else if (isSnakeBody) {
          cellClass += ' snake-body';
          const opacity = Math.max(0.4, 1 - (snakeIndex / snake.length) * 0.6);
          cellStyle = {
            background: `rgba(74, 222, 128, ${opacity})`,
          };
        } else if (isFood) {
          cellClass += ' food-cell animate-food-pulse';
          cellStyle = { background: 'linear-gradient(135deg, #f87171, #ef4444)' };
        } else {
          cellStyle = { background: 'rgba(255, 255, 255, 0.02)' };
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={cellStyle}
          />
        );
      }
    }
    return cells;
  };

  // Menu screen
  if (gameState === 'menu') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="text-center mb-8 animate-slide-up">
          <div className="text-6xl mb-4">🐍</div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
            ЗМЕЙКА
          </h1>
          <p className="text-gray-400 text-sm md:text-base">Классическая аркадная игра</p>
        </div>

        <div className="w-full max-w-sm space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-center mb-4">
            <p className="text-gray-300 text-sm font-medium mb-3">Выберите сложность:</p>
            <div className="flex gap-3 justify-center">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`difficulty-btn px-4 py-2 rounded-lg font-semibold text-sm text-white bg-gradient-to-r ${DIFFICULTY_COLORS[d]} ${
                    difficulty === d ? 'active ring-2 ring-white/30' : 'opacity-60 hover:opacity-90'
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            className="btn-game w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
          >
            🎮 Начать игру
          </button>

          {highScore > 0 && (
            <div className="score-display rounded-xl p-4 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Рекорд</p>
              <p className="text-2xl font-bold text-yellow-400">🏆 {highScore}</p>
            </div>
          )}

          <div className="text-center text-gray-500 text-xs mt-4 space-y-1">
            <p>⌨️ Стрелки / WASD — управление</p>
            <p>📱 Свайпы или кнопки — на мобильном</p>
            <p>⏸️ Esc / P — пауза</p>
          </div>
        </div>
      </div>
    );
  }

  // Game screen (playing, paused, gameover)
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-between p-2 md:p-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-2">
        <div className="score-display rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-green-400 text-lg">🐍</span>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Счёт</p>
            <p className="text-lg font-bold text-white leading-none">{score}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="btn-game p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title={gameState === 'paused' ? 'Продолжить' : 'Пауза'}
          >
            {gameState === 'paused' ? '▶️' : '⏸️'}
          </button>
          <button
            onClick={() => { setGameState('menu'); resetGame(); }}
            className="btn-game p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Меню"
          >
            🏠
          </button>
        </div>

        <div className="score-display rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-yellow-400 text-lg">🏆</span>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Рекорд</p>
            <p className="text-lg font-bold text-white leading-none">{highScore}</p>
          </div>
        </div>
      </div>

      {/* Difficulty indicator */}
      <div className="mb-2">
        <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${DIFFICULTY_COLORS[difficulty]} text-white font-medium`}>
          {DIFFICULTY_LABELS[difficulty]}
        </span>
      </div>

      {/* Game grid */}
      <div className={`flex-1 flex items-center justify-center w-full max-w-lg ${shaking ? 'animate-shake' : ''}`}>
        <div
          className="game-grid w-full"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            maxWidth: 'min(100%, 500px)',
            maxHeight: 'min(100%, 500px)',
            aspectRatio: '1',
          }}
        >
          {renderGrid()}
        </div>
      </div>

      {/* Mobile controls */}
      <div className="mobile-controls w-40 mt-3 md:hidden">
        <button
          className="btn-up btn-game p-3 rounded-xl bg-white/10 active:bg-white/25 text-xl flex items-center justify-center"
          onTouchStart={(e) => { e.preventDefault(); handleDirectionButton('UP'); }}
          onClick={() => handleDirectionButton('UP')}
        >
          ▲
        </button>
        <button
          className="btn-left btn-game p-3 rounded-xl bg-white/10 active:bg-white/25 text-xl flex items-center justify-center"
          onTouchStart={(e) => { e.preventDefault(); handleDirectionButton('LEFT'); }}
          onClick={() => handleDirectionButton('LEFT')}
        >
          ◀
        </button>
        <button
          className="btn-right btn-game p-3 rounded-xl bg-white/10 active:bg-white/25 text-xl flex items-center justify-center"
          onTouchStart={(e) => { e.preventDefault(); handleDirectionButton('RIGHT'); }}
          onClick={() => handleDirectionButton('RIGHT')}
        >
          ▶
        </button>
        <button
          className="btn-down btn-game p-3 rounded-xl bg-white/10 active:bg-white/25 text-xl flex items-center justify-center"
          onTouchStart={(e) => { e.preventDefault(); handleDirectionButton('DOWN'); }}
          onClick={() => handleDirectionButton('DOWN')}
        >
          ▼
        </button>
      </div>

      {/* Pause overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center animate-slide-up">
            <div className="text-5xl mb-4">⏸️</div>
            <h2 className="text-3xl font-bold text-white mb-4">Пауза</h2>
            <button
              onClick={togglePause}
              className="btn-game px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600"
            >
              ▶️ Продолжить
            </button>
            <p className="text-gray-400 text-sm mt-3">Esc или P для продолжения</p>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center animate-slide-up p-6">
            <div className="text-5xl mb-4">💀</div>
            <h2 className="text-3xl font-bold text-white mb-2">Игра окончена!</h2>
            <div className="mb-6 space-y-2">
              <p className="text-xl text-gray-300">
                Счёт: <span className="text-green-400 font-bold">{score}</span>
              </p>
              {score >= highScore && score > 0 && (
                <p className="text-yellow-400 font-bold text-lg animate-pulse">
                  🎉 Новый рекорд!
                </p>
              )}
              <p className="text-sm text-gray-400">
                Рекорд: <span className="text-yellow-400 font-semibold">{highScore}</span>
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={startGame}
                className="btn-game px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600"
              >
                🔄 Играть снова
              </button>
              <button
                onClick={() => { setGameState('menu'); resetGame(); }}
                className="btn-game px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-gray-600 to-gray-700"
              >
                🏠 В меню
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
