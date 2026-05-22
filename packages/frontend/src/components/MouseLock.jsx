//trap mouse movement within canvas and show the mouse/ball position when active
import { useEffect, useRef } from "react";
import styles from "./Timer.module.css";

const RADIUS = 20;
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 300;

function MouseLock({ canvasRef, onLockChange }) {
  const animationRef = useRef(null);
  const positionRef = useRef({ x: 250, y: 150 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

      const x2 = findSecondCenter(x, canvas.width);
      const y2 = findSecondCenter(y, canvas.height);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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
        x: updateCoord(current.x, event.movementX, canvas.width),
        y: updateCoord(current.y, event.movementY, canvas.height),
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
  }, [canvasRef, onLockChange]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className={styles.timerDisplay}
    />
  );
}

export default MouseLock;
