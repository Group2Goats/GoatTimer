import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Timer.module.css";
import MouseLock from "./MouseLock.jsx";

const STUDY_TIME = 1500;
const SHORT_BREAK_TIME = 300;
const LONG_BREAK_TIME = 1800;

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

function Timer({ userId }) {
  const [time, setTime] = useState(STUDY_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isStudying, setIsStudying] = useState(true);
  const [rounds, setRounds] = useState(1);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [errorStatus, setErrorStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState(false);

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
    async function patchUserData() {
      if (time !== 0 || hasCompletedRef.current) return;

      hasCompletedRef.current = true;

      const completedTime = isStudying ? STUDY_TIME - sentTimeRef.current : 0;

      const timeInHours = completedTime / 3600;

      if (completedTime > 0) {
        sentTimeRef.current += completedTime;

        try {
          console.log("user", userId);
          const res = await fetch(
            `${AZURE_URL}/api/users/${userId}/study-time`,
            {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ hours: timeInHours }),
            },
          );

          if (!res.ok) {
            throw new Error();
          }
        } catch (error) {
          if (error instanceof Error) {
            setErrorStatus(true);
            setErrorMsg("Network error: Failed to update study time.");
          } else {
            console.error("Failed to update study time:", error);
          }
        }
      }

      switchTime();
    }

    // call function
    patchUserData();
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
        setErrorStatus(true);
        setErrorMsg("Cannot start the session that quick :/");
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
    if (!errorStatus) return;

    const intervalId = setInterval(() => {
      setErrorStatus(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [errorStatus]);

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
        {errorStatus && <div className={styles.errorInfo}>{errorMsg}</div>}
      </div>
      <p className={styles.sessionInfo}>
        Press stop button or ESC to stop timer
      </p>
    </div>
  );
}

export default Timer;
