import { useEffect, useRef, useState } from "react";
import styles from "./Timer.module.css";

const RADIUS = 20;

function Timer() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [position, setPosition] = useState({ x: 250, y: 150 });
  const positionRef = useRef(position);

  // pointer lock from Mozilla docs demo
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function find2ndCenter(pos, max) {
      if (pos < RADIUS) return pos + max;
      if (pos + RADIUS > max) return pos - max;
      return 0;
    }

    function drawBall(x, y) {
      ctx.beginPath();
      ctx.arc(x, y, RADIUS, 0, 2 * Math.PI, true);
      ctx.fill();
    }

    function canvasDraw() {
      const { x, y } = positionRef.current;

      const x2 = find2ndCenter(x, canvas.width);
      const y2 = find2ndCenter(y, canvas.height);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#f00";

      drawBall(x, y);

      if (x2) drawBall(x2, y);
      if (y2) drawBall(x, y2);
      if (x2 && y2) drawBall(x2, y2);
    }

    function updateCoord(pos, delta, max) {
      pos += delta;
      pos %= max;
      if (pos < 0) pos += max;
      return pos;
    }

    function updatePosition(e) {
      const current = positionRef.current;

      const next = {
        x: updateCoord(current.x, e.movementX, canvas.width),
        y: updateCoord(current.y, e.movementY, canvas.height),
      };

      positionRef.current = next;
      setPosition(next);

      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(() => {
          animationRef.current = null;
          canvasDraw();
        });
      }
    }

    function lockChangeChange() {
      if (document.pointerLockElement === canvas) {
        document.addEventListener("mousemove", updatePosition);
      } else {
        document.removeEventListener("mousemove", updatePosition);
      }
    }

    canvasDraw();

    document.addEventListener("pointerlockchange", lockChangeChange);

    return () => {
      document.removeEventListener("pointerlockchange", lockChangeChange);
      document.removeEventListener("mousemove", updatePosition);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, []);

  /* function resizeCanvas(canvas) {
    const { width, height } = canvas.getBoundingClientRect();

    if (canvas.width !== width || canvas.height !== height) {
      const { devicePixelRatio: ratio = 1 } = window;
      const context = canvas.getContext("2d");
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.scale(ratio, ratio);
      return true;
    }

    return false;
  } */

  async function handleClick() {
    const canvas = canvasRef.current;
    /* const div = canvas.parentElement;
    console.log(div.getBoundingClientRect().width);
    canvas.width = div.clientWidth;
    canvas.height = div.clientHeight; */

    if (!document.pointerLockElement) {
      try {
        await canvas.requestPointerLock({
          unadjustedMovement: true,
        });
      } catch (error) {
        if (error.name === "NotSupportedError") {
          await canvas.requestPointerLock();
        } else {
          throw error;
        }
      }
    }
  }

  return (
    <div className={styles.timerCard}>
      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        className={styles.timerDisplay}
      />
      <button onClick={handleClick} className={styles.startSessionBtn}>
        Start Session
      </button>
    </div>
  );
}

export default Timer;
