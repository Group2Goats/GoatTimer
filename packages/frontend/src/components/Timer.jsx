import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Timer.module.css";
import MouseLock from "./MouseLock.jsx";

/* const STUDY_TIME = 1500;
const SHORT_BREAK_TIME = 300;
const LONG_BREAK_TIME = 1800; */

// For testing:
const STUDY_TIME = 25;
const SHORT_BREAK_TIME = 5;
const LONG_BREAK_TIME = 30;

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

function Timer({ userId }) {
  const [time, setTime] = useState(STUDY_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isStudying, setIsStudying] = useState(true);
  const [rounds, setRounds] = useState(1);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [securityError, setSecurityError] = useState(false);

  const canvasRef = useRef(null);
  const sentTimeRef = useRef(0);
  const hasCompletedRef = useRef(false);

  const getNextSession = useCallback(() => {
    if (isStudying) {
      const nextIsLongBreak = rounds % 4 === 0;

      return {
        isStudying: false,
        time: nextIsLongBreak ? LONG_BREAK_TIME : SHORT_BREAK_TIME,
      };
    }

    return {
      isStudying: true,
      time: STUDY_TIME,
    };
  }, [isStudying, rounds]);

  const switchTime = useCallback(() => {
    const nextSession = getNextSession();

    setIsStudying(nextSession.isStudying);
    setTime(nextSession.time);
    setIsRunning(false);

    sentTimeRef.current = 0;
    hasCompletedRef.current = false;

    if (!isStudying) {
      setRounds((prevRounds) => prevRounds + 1);
    }
  }, [isStudying, getNextSession]);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= 1) {
          setIsRunning(false);
          setIsSessionComplete(true);
          return 0;
        }

        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  useEffect(() => {
    if (time !== 0 || hasCompletedRef.current) return;

    hasCompletedRef.current = true;

    const completedTime = isStudying ? STUDY_TIME - sentTimeRef.current : 0;

    if (completedTime > 0) {
      sentTimeRef.current += completedTime;

      /*
      fetch(`/api/users/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lapsedTime: completedTime,
        }),
      }).catch((error) => {
        console.error("Failed to send total time:", error);
      });
      */

      console.log("Completed study time:", completedTime);
    }

    switchTime();
  }, [time, isStudying, userId, switchTime]);

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
      } else if (error.name === "SecurityError") {
        setSecurityError(true);
      } else {
        console.error(error);
      }
    }

    setIsSessionComplete(false);
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

  useEffect(() => {
    if (!securityError) return;

    const intervalId = setInterval(() => {
      setSecurityError(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [securityError]);

  return (
    <div className={styles.timerCard}>
      <div className={styles.messageDiv}>
        {!isSessionComplete && (
          <div className={styles.roundsInfo} style={{ color: "white" }}>
            {isStudying ? `Focus Round ${rounds}` : "Break Time"}
          </div>
        )}
      </div>

      <div className={styles.messageDiv}>
        {isSessionComplete && (
          <div className={styles.roundsInfo} style={{ color: "white" }}>
            Session complete! Press the button to continue.
          </div>
        )}
      </div>

      <ClockDisplay time={time} />

      <MouseLock canvasRef={canvasRef} onLockChange={handleLockChange} />

      <SessionButton isRunning={isRunning} onClick={handleSessionToggle} />

      <div className={styles.messageDiv}>
        {securityError && (
          <div className={styles.errorInfo}>
            Cannot start the session that quick :/
          </div>
        )}
      </div>
      <p className={styles.sessionInfo}>
        Press stop button or ESC to stop timer
      </p>
    </div>
  );
}

export default Timer;
