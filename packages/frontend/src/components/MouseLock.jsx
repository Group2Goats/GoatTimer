//trap mouse movement within canvas and show the mouse/ball position when active
import { useEffect, useRef, useState } from "react";
import styles from "./Timer.module.css";

const RADIUS = 20;
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 300;
const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;
const MIN_CANVAS_WIDTH = 280;
const MAX_CANVAS_WIDTH = 300;

function MouseLock({ canvasRef, onLockChange }) {
  const animationRef = useRef(null);
  const positionRef = useRef({ x: 250, y: 150 });
  const [canvasSize, setCanvasSize] = useState({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function calculateCanvasSize() {
      const parentWidth =
        canvas.parentElement && canvas.parentElement.clientWidth
          ? canvas.parentElement.clientWidth
          : window.innerWidth;
      const width = Math.min(
        MAX_CANVAS_WIDTH,
        Math.max(MIN_CANVAS_WIDTH, Math.floor(parentWidth * 0.95)),
      );
      const height = Math.round(width / ASPECT_RATIO);
      return { width, height };
    }

    function resizeCanvas() {
      setCanvasSize((currentSize) => {
        const nextSize = calculateCanvasSize();
        if (
          nextSize.width === currentSize.width &&
          nextSize.height === currentSize.height
        ) {
          return currentSize;
        }

        positionRef.current = {
          x: Math.min(positionRef.current.x, nextSize.width),
          y: Math.min(positionRef.current.y, nextSize.height),
        };

        return nextSize;
      });
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayWidth = canvasSize.width;
    const displayHeight = canvasSize.height;
    const dpr = window.devicePixelRatio;

    canvas.width = Math.round(displayWidth * dpr);
    canvas.height = Math.round(displayHeight * dpr);
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    function findSecondCenter(pos, max) {
      if (pos < RADIUS) return pos + max;
      if (pos + RADIUS > max) return pos - max;
      return null;
    }

    function drawBall(x, y) {
      ctx.beginPath();
      ctx.arc(x, y, RADIUS, 0, 2 * Math.PI, true);
      ctx.fill();
    }

    function drawCanvas() {
      const { x, y } = positionRef.current;
      const x2 = findSecondCenter(x, displayWidth);
      const y2 = findSecondCenter(y, displayHeight);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      ctx.fillStyle = "#f00";
      drawBall(x, y);

      if (x2 !== null) drawBall(x2, y);
      if (y2 !== null) drawBall(x, y2);
      if (x2 !== null && y2 !== null) drawBall(x2, y2);
    }

    function updateCoord(pos, delta, max) {
      let next = pos + delta;
      next %= max;

      if (next < 0) {
        next += max;
      }

      return next;
    }

    function updatePosition(event) {
      const current = positionRef.current;

      positionRef.current = {
        x: updateCoord(current.x, event.movementX, displayWidth),
        y: updateCoord(current.y, event.movementY, displayHeight),
      };

      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(() => {
          animationRef.current = null;
          drawCanvas();
        });
      }
    }

    function handlePointerLockChange() {
      const isLocked = document.pointerLockElement === canvas;

      if (isLocked) {
        document.addEventListener("mousemove", updatePosition);
      } else {
        document.removeEventListener("mousemove", updatePosition);
      }

      onLockChange(isLocked);
    }

    drawCanvas();

    document.addEventListener("pointerlockchange", handlePointerLockChange);

    return () => {
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange,
      );
      document.removeEventListener("mousemove", updatePosition);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [canvasRef, canvasSize, onLockChange]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      className={styles.timerDisplay}
    />
  );
}

export default MouseLock;
