import React, { useCallback, useEffect, useRef, useState } from "https://esm.sh/react@18";
import { createRoot } from "https://esm.sh/react-dom@18/client";
import htm from "https://esm.sh/htm@3";

const html = htm.bind(React.createElement);

const CELL_SIZE = 20;
const ROWS = 21;
const COLS = 19;
const STEP_MS = 140;

const CELL_EMPTY = 0;
const CELL_WALL = 1;
const CELL_DOT = 2;
const CELL_PELLET = 3;

const DIRS = [
    { x: 0, y: -1, angle: -Math.PI / 2 },
    { x: 0, y: 1, angle: Math.PI / 2 },
    { x: -1, y: 0, angle: Math.PI },
    { x: 1, y: 0, angle: 0 },
];

const KEY_DIR = {
    ArrowUp: DIRS[0],
    ArrowDown: DIRS[1],
    ArrowLeft: DIRS[2],
    ArrowRight: DIRS[3],
    w: DIRS[0],
    s: DIRS[1],
    a: DIRS[2],
    d: DIRS[3],
};

function buildGrid() {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(CELL_DOT));
    const setWall = (x, y) => {
        grid[y][x] = CELL_WALL;
    };
    const addBlock = (x, y, w, h) => {
        for (let yy = y; yy < y + h; yy += 1) {
            for (let xx = x; xx < x + w; xx += 1) {
                setWall(xx, yy);
            }
        }
    };

    for (let x = 0; x < COLS; x += 1) {
        setWall(x, 0);
        setWall(x, ROWS - 1);
    }
    for (let y = 0; y < ROWS; y += 1) {
        setWall(0, y);
        setWall(COLS - 1, y);
    }

    addBlock(2, 2, 4, 3);
    addBlock(8, 2, 3, 3);
    addBlock(13, 2, 4, 3);

    addBlock(2, 7, 3, 3);
    addBlock(7, 7, 5, 3);
    addBlock(14, 7, 3, 3);

    addBlock(6, 10, 7, 3);

    addBlock(2, 14, 4, 3);
    addBlock(8, 14, 3, 3);
    addBlock(13, 14, 4, 3);

    addBlock(4, 17, 11, 2);

    const pellets = [
        { x: 1, y: 1 },
        { x: COLS - 2, y: 1 },
        { x: 1, y: ROWS - 2 },
        { x: COLS - 2, y: ROWS - 2 },
    ];

    for (const pellet of pellets) {
        if (grid[pellet.y][pellet.x] !== CELL_WALL) {
            grid[pellet.y][pellet.x] = CELL_PELLET;
        }
    }

    let dotsLeft = 0;
    for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
            if (grid[y][x] === CELL_DOT || grid[y][x] === CELL_PELLET) {
                dotsLeft += 1;
            }
        }
    }

    return { grid, dotsLeft };
}

function buildInitialState() {
    const { grid, dotsLeft } = buildGrid();
    const pacmanStart = { x: 9, y: 13 };
    const ghostStarts = [
        { x: 8, y: 6, color: "#ff4b4b" },
        { x: 9, y: 6, color: "#ff7dd6" },
        { x: 10, y: 6, color: "#6ee7ff" },
        { x: 9, y: 5, color: "#ffb347" },
    ];

    let remaining = dotsLeft;
    const clearCell = (pos) => {
        const cell = grid[pos.y][pos.x];
        if (cell === CELL_DOT || cell === CELL_PELLET) {
            grid[pos.y][pos.x] = CELL_EMPTY;
            remaining -= 1;
        }
    };

    clearCell(pacmanStart);
    for (const ghost of ghostStarts) {
        clearCell(ghost);
    }

    return {
        grid,
        dotsLeft: remaining,
        pacman: {
            x: pacmanStart.x,
            y: pacmanStart.y,
            dir: { x: 0, y: 0, angle: 0 },
            next: { x: 0, y: 0, angle: 0 },
            facing: { x: 1, y: 0, angle: 0 },
            start: pacmanStart,
        },
        ghosts: ghostStarts.map((ghost) => ({
            x: ghost.x,
            y: ghost.y,
            dir: { x: 0, y: 1, angle: Math.PI / 2 },
            color: ghost.color,
            scatter: Math.random() * Math.PI * 2,
            start: { x: ghost.x, y: ghost.y },
        })),
        win: false,
        hitTimer: 0,
    };
}

function canMove(grid, x, y) {
    return y >= 0 && y < ROWS && x >= 0 && x < COLS && grid[y][x] !== CELL_WALL;
}

function stepGame(state, onEat, onWin) {
    const { grid, pacman, ghosts } = state;

    if ((pacman.next.x !== 0 || pacman.next.y !== 0) && canMove(grid, pacman.x + pacman.next.x, pacman.y + pacman.next.y)) {
        pacman.dir = pacman.next;
    }

    if (pacman.dir.x !== 0 || pacman.dir.y !== 0) {
        const nx = pacman.x + pacman.dir.x;
        const ny = pacman.y + pacman.dir.y;
        if (canMove(grid, nx, ny)) {
            pacman.x = nx;
            pacman.y = ny;
            pacman.facing = pacman.dir;
        }
    }

    const cell = grid[pacman.y][pacman.x];
    if (cell === CELL_DOT || cell === CELL_PELLET) {
        grid[pacman.y][pacman.x] = CELL_EMPTY;
        state.dotsLeft -= 1;
        onEat(cell === CELL_PELLET ? 50 : 10, state.dotsLeft);
        if (state.dotsLeft <= 0) {
            state.win = true;
            onWin();
        }
    }

    const handleHit = () => {
        pacman.x = pacman.start.x;
        pacman.y = pacman.start.y;
        pacman.dir = { x: 0, y: 0, angle: pacman.facing.angle };
        pacman.next = { x: 0, y: 0, angle: pacman.facing.angle };
        for (const ghost of ghosts) {
            ghost.x = ghost.start.x;
            ghost.y = ghost.start.y;
        }
        state.hitTimer = 8;
    };

    for (const ghost of ghosts) {
        if (ghost.x === pacman.x && ghost.y === pacman.y) {
            handleHit();
            continue;
        }

        const nextX = ghost.x + ghost.dir.x;
        const nextY = ghost.y + ghost.dir.y;
        const blocked = !canMove(grid, nextX, nextY);

        const options = DIRS.filter((dir) => canMove(grid, ghost.x + dir.x, ghost.y + dir.y));
        const atIntersection = options.length >= 3;

        if (blocked || atIntersection) {
            const reverse = { x: -ghost.dir.x, y: -ghost.dir.y };
            const filtered = options.filter((dir) => !(dir.x === reverse.x && dir.y === reverse.y));
            const choices = filtered.length ? filtered : options;
            ghost.dir = choices[Math.floor(Math.random() * choices.length)] || ghost.dir;
        }

        if (canMove(grid, ghost.x + ghost.dir.x, ghost.y + ghost.dir.y)) {
            ghost.x += ghost.dir.x;
            ghost.y += ghost.dir.y;
        }

        if (ghost.x === pacman.x && ghost.y === pacman.y) {
            handleHit();
        }
    }

    if (state.hitTimer > 0) {
        state.hitTimer -= 1;
    }
}

function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}

function drawWall(ctx, x, y) {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    ctx.save();
    ctx.fillStyle = "#0b3d91";
    ctx.strokeStyle = "#39d6ff";
    ctx.lineWidth = 1.4;
    ctx.shadowColor = "rgba(57, 214, 255, 0.6)";
    ctx.shadowBlur = 8;
    roundRectPath(ctx, px + 1.5, py + 1.5, CELL_SIZE - 3, CELL_SIZE - 3, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();
}

function drawDot(ctx, x, y) {
    const cx = x * CELL_SIZE + CELL_SIZE / 2;
    const cy = y * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillStyle = "#f5f5f5";
    ctx.beginPath();
    ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
    ctx.fill();
}

function drawPellet(ctx, x, y, time) {
    const cx = x * CELL_SIZE + CELL_SIZE / 2;
    const cy = y * CELL_SIZE + CELL_SIZE / 2;
    const pulse = 1 + 0.25 * Math.sin(time / 140);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx, cy, 4.2 * pulse, 0, Math.PI * 2);
    ctx.fill();
}

function drawPacman(ctx, pacman, time) {
    const cx = pacman.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = pacman.y * CELL_SIZE + CELL_SIZE / 2;
    const idle = pacman.dir.x === 0 && pacman.dir.y === 0;
    const mouth = idle ? 0.12 : 0.25 + 0.08 * Math.sin(time / 90);
    const angle = pacman.facing.angle || 0;
    ctx.fillStyle = "#ffd438";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, CELL_SIZE * 0.45, angle + mouth, angle - mouth + Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#2a1f00";
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle - 0.5) * 6, cy + Math.sin(angle - 0.5) * 6, 1.6, 0, Math.PI * 2);
    ctx.fill();
}

function drawGhost(ctx, ghost, time) {
    const r = CELL_SIZE * 0.42;
    const cx = ghost.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = ghost.y * CELL_SIZE + CELL_SIZE / 2;
    const wave = Math.sin(time / 120 + ghost.scatter) * 2;

    ctx.fillStyle = ghost.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0, false);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    const eyeOffset = r * 0.35;
    ctx.beginPath();
    ctx.arc(cx - eyeOffset, cy - r * 0.1, r * 0.25, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffset, cy - r * 0.1, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1a2a44";
    const pupilX = ghost.dir.x * r * 0.15;
    const pupilY = ghost.dir.y * r * 0.15;
    ctx.beginPath();
    ctx.arc(cx - eyeOffset + pupilX, cy - r * 0.1 + pupilY, r * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + eyeOffset + pupilX, cy - r * 0.1 + pupilY, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(cx - r, cy + r - 2 + wave);
    ctx.lineTo(cx + r, cy + r - 2 - wave);
    ctx.stroke();
}

function drawGame(ctx, state, time) {
    const width = COLS * CELL_SIZE;
    const height = ROWS * CELL_SIZE;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#05060c";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    if (state.hitTimer > 0) {
        const shake = (state.hitTimer / 8) * 2;
        ctx.translate(Math.sin(time * 0.05) * shake, Math.cos(time * 0.04) * shake);
    }

    for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
            const cell = state.grid[y][x];
            if (cell === CELL_WALL) {
                drawWall(ctx, x, y);
            } else if (cell === CELL_DOT) {
                drawDot(ctx, x, y);
            } else if (cell === CELL_PELLET) {
                drawPellet(ctx, x, y, time);
            }
        }
    }

    for (const ghost of state.ghosts) {
        drawGhost(ctx, ghost, time);
    }

    drawPacman(ctx, state.pacman, time);
    ctx.restore();
}

function App() {
    const canvasRef = useRef(null);
    const stateRef = useRef(null);
    const scoreRef = useRef(0);
    const [score, setScore] = useState(0);
    const [dotsLeft, setDotsLeft] = useState(0);
    const [win, setWin] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const swipeRef = useRef(null);
    const lastTouchRef = useRef(0);

    const setDirection = useCallback((dir) => {
        const state = stateRef.current;
        if (state && dir) {
            state.pacman.next = dir;
        }
    }, []);

    useEffect(() => {
        const mq = window.matchMedia ? window.matchMedia("(max-width: 900px)") : null;
        const update = () => {
            const ua = navigator.userAgent || "";
            const uaMobile = typeof navigator.userAgentData === "object" && typeof navigator.userAgentData.mobile === "boolean"
                ? navigator.userAgentData.mobile
                : /Android|iPhone|iPod|Windows Phone|IEMobile|Mobile/i.test(ua);
            const isTablet = /iPad|Tablet/i.test(ua);
            const coarse = window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : false;
            const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
            const small = mq ? mq.matches : window.innerWidth <= 900;
            const isPhone = (uaMobile || (coarse && touch && small)) && !isTablet;
            setIsTouch(isPhone);
        };

        update();
        if (mq && mq.addEventListener) {
            mq.addEventListener("change", update);
        } else if (mq && mq.addListener) {
            mq.addListener(update);
        }
        window.addEventListener("resize", update);

        return () => {
            if (mq && mq.removeEventListener) {
                mq.removeEventListener("change", update);
            } else if (mq && mq.removeListener) {
                mq.removeListener(update);
            }
            window.removeEventListener("resize", update);
        };
    }, []);

    const handleSwipeStart = useCallback((event) => {
        if (!event.touches || event.touches.length === 0) {
            return;
        }
        const touch = event.touches[0];
        swipeRef.current = { x: touch.clientX, y: touch.clientY };
    }, []);

    const handleSwipeMove = useCallback((event) => {
        if (!swipeRef.current || !event.touches || event.touches.length === 0) {
            return;
        }
        const touch = event.touches[0];
        const dx = touch.clientX - swipeRef.current.x;
        const dy = touch.clientY - swipeRef.current.y;
        const deadZone = 12;
        if (Math.abs(dx) < deadZone && Math.abs(dy) < deadZone) {
            return;
        }
        const dir = Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? DIRS[3] : DIRS[2])
            : (dy > 0 ? DIRS[1] : DIRS[0]);
        setDirection(dir);
        swipeRef.current = { x: touch.clientX, y: touch.clientY };
    }, [setDirection]);

    const handleSwipeEnd = useCallback(() => {
        swipeRef.current = null;
    }, []);

    const handlePadTouch = useCallback((dir) => (event) => {
        event.preventDefault();
        lastTouchRef.current = Date.now();
        setDirection(dir);
    }, [setDirection]);

    const handlePadMouse = useCallback((dir) => (event) => {
        if (Date.now() - lastTouchRef.current < 600) {
            return;
        }
        event.preventDefault();
        setDirection(dir);
    }, [setDirection]);

    const resetGame = useCallback(() => {
        const nextState = buildInitialState();
        stateRef.current = nextState;
        scoreRef.current = 0;
        setScore(0);
        setDotsLeft(nextState.dotsLeft);
        setWin(false);
    }, []);

    useEffect(() => {
        resetGame();
    }, [resetGame]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return undefined;
        }
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        const handleKey = (event) => {
            const dir = KEY_DIR[event.key];
            if (!dir) {
                return;
            }
            event.preventDefault();
            const state = stateRef.current;
            if (state) {
                state.pacman.next = dir;
            }
        };

        window.addEventListener("keydown", handleKey);

        let lastStep = 0;
        let animationId = 0;

        const addScore = (points, remaining) => {
            scoreRef.current += points;
            setScore(scoreRef.current);
            setDotsLeft(remaining);
        };

        const onWin = () => {
            setWin(true);
        };

        const loop = (time) => {
            const state = stateRef.current;
            if (state) {
                if (!state.win && time - lastStep > STEP_MS) {
                    stepGame(state, addScore, onWin);
                    lastStep = time;
                }
                drawGame(ctx, state, time);
            }
            animationId = requestAnimationFrame(loop);
        };

        animationId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener("keydown", handleKey);
            cancelAnimationFrame(animationId);
        };
    }, [setWin]);

    const highScore = Math.max(score, 2610);
    const controlsText = isTouch
        ? "Swipe on the maze or tap the pad. Clear all dots to trigger the winner animation."
        : "Use arrow keys or WASD. Clear all dots to trigger the winner animation.";

    return html`
    <div className="app">
      <header className="hud">
        <div className="score-card">
          <span className="score-label">Score</span>
          <span className="score-value">${score}</span>
        </div>
        <div className="score-card primary">
          <span className="score-label">High Score</span>
          <span className="score-value">${highScore}</span>
        </div>
        <div className="score-card">
          <span className="score-label">Dots</span>
          <span className="score-value">${dotsLeft}</span>
        </div>
      </header>
            <div
                className="board-wrap"
                onTouchStart=${handleSwipeStart}
                onTouchMove=${handleSwipeMove}
                onTouchEnd=${handleSwipeEnd}
            >
        <canvas
          className="board"
          ref=${canvasRef}
          width=${COLS * CELL_SIZE}
          height=${ROWS * CELL_SIZE}
        ></canvas>
        ${win
            ? html`
                <div className="overlay">
                  <div className="winner-card">
                    <h1 className="winner-title">You Win</h1>
                    <p className="winner-sub">The maze is clear. Ready for another round?</p>
                    <div className="winner-actions">
                      <button type="button" onClick=${resetGame}>Play Again</button>
                    </div>
                  </div>
                </div>
              `
            : null
        }
      </div>
            ${isTouch
            ? html`
                                <div className="touch-controls">
                                    <div className="touch-pad">
                                        <button type="button" className="pad-btn up" onTouchStart=${handlePadTouch(DIRS[0])} onMouseDown=${handlePadMouse(DIRS[0])}>UP</button>
                                        <button type="button" className="pad-btn left" onTouchStart=${handlePadTouch(DIRS[2])} onMouseDown=${handlePadMouse(DIRS[2])}>LT</button>
                                        <button type="button" className="pad-btn right" onTouchStart=${handlePadTouch(DIRS[3])} onMouseDown=${handlePadMouse(DIRS[3])}>RT</button>
                                        <button type="button" className="pad-btn down" onTouchStart=${handlePadTouch(DIRS[1])} onMouseDown=${handlePadMouse(DIRS[1])}>DN</button>
                                    </div>
                                    <div className="touch-hint">
                                        <div className="touch-title">Touch Control</div>
                                        <div>Swipe on the maze or tap the pad.</div>
                                    </div>
                                </div>
                            `
            : null
        }
            <div className="controls">${controlsText}</div>
    </div>
  `;
}

createRoot(document.getElementById("root")).render(html`<${App} />`);
