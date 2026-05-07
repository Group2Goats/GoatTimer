import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Timer.module.css";
import MouseLockCanvas from "./MouseLock.jsx";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

function ClockDisplay({ time }) {
  return <h1 className={styles.timerDisplay}>{formatTime(time)}</h1>;
}

function SessionButton({ isRunning, onClick }) {
  return (
    <button onClick={onClick} className={styles.sessionBtn}>
      {isRunning ? "Stop Session" : "Start Session"}
    </button>
  );
}

function Timer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const handleLockChange = useCallback((locked) => {
    setIsRunning(locked);
  }, []);

  async function startSession() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      await canvas.requestPointerLock({
        unadjustedMovement: true,
      });
    } catch (error) {
      if (error.name === "NotSupportedError") {
        await canvas.requestPointerLock();
      } else {
        console.error(error);
      }
    }
  }

  function stopSession() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    setIsRunning(false);
  }

  async function sessionToggle() {
    if (isRunning) {
      stopSession();
    } else {
      await startSession();
    }
  }

  return (
    <div className={styles.timerCard}>
      <ClockDisplay time={time} />

      <MouseLockCanvas canvasRef={canvasRef} onLockChange={handleLockChange} />

      <SessionButton isRunning={isRunning} onClick={sessionToggle} />
      <span className={styles.sessionInfo}>
        Laptop users: press ESC to stop timer
      </span>
    </div>
  );
}

export default Timer;
