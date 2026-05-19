import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Timer.module.css";
import MouseLock from "./MouseLock.jsx";
import { useNavigate } from "react-router";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

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
      setTime((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    async function sendStudyTime() {
      const lapsedSeconds = MAX_TIME - time - sentTimeRef.current;
      sentTimeRef.current += lapsedSeconds;

      if (lapsedSeconds <= 0) return;

      const lapsedHours = lapsedSeconds / 3600;

      try {
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        await fetch(`${AZURE_URL}/api/users/${userId}/study-time`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hours: lapsedHours }),
        });
      } catch (error) {
        console.error("Failed to save study time:", error);
      }

      if (time === 0) {
        // Reset timer for next session
        setTime(MAX_TIME);
        sentTimeRef.current = 0;
      }
    }

    if (wasRunningRef.current && !isRunning) {
      sendStudyTime();
    }

    wasRunningRef.current = isRunning;
  }, [isRunning, time, navigate]);

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
