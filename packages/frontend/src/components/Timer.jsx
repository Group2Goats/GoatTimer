import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Timer.module.css";
import MouseLock from "./MouseLock.jsx";
import { useNavigate } from "react-router";

const MAX_TIME = 1500; // 25 minutes in seconds

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
  const navigate = useNavigate();
  const [time, setTime] = useState(MAX_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef(null);
  const sentTimeRef = useRef(0);

  const wasRunningRef = useRef(false);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setTime((prev) => prev - 1);

      if (time <= 0) {
        setIsRunning(false);
        setTime(0);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, time]);

  useEffect(() => {
    async function sendTotalTime() {
      const lapsedTime = MAX_TIME - time - sentTimeRef.current;
      sentTimeRef.current += lapsedTime;

      if (lapsedTime === 0) return;

      /* try {
        await fetch(`/api/users/${userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            totalTime,
          }),
        });
      } catch (error) {
        console.error("Failed to send total time:", error);
      } */
      console.log("Lapsed time:", lapsedTime);
      if (time === 0) {
        // create component with break timer and navigate to it
        navigate(0);
      }
    }

    if (wasRunningRef.current && !isRunning) {
      sendTotalTime();
    }

    wasRunningRef.current = isRunning;
  }, [isRunning, time]);

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

  async function handleSessionToggle() {
    if (isRunning) {
      stopSession();
    } else {
      await startSession();
    }
  }

  return (
    <div className={styles.timerCard}>
      <ClockDisplay time={time} />

      <MouseLock canvasRef={canvasRef} onLockChange={handleLockChange} />

      <SessionButton isRunning={isRunning} onClick={handleSessionToggle} />

      <p className={styles.sessionInfo}>
        Press stop button or ESC to stop timer
      </p>
    </div>
  );
}

export default Timer;
