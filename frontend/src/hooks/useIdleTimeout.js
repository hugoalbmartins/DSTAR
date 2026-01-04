import { useEffect, useRef } from 'react';

export function useIdleTimeout(onIdle, idleTime = 1800000) {
  const timeoutId = useRef(null);
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!onIdleRef.current) {
      return;
    }

    const resetTimer = () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }

      timeoutId.current = setTimeout(() => {
        if (onIdleRef.current) {
          onIdleRef.current();
        }
      }, idleTime);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [idleTime]);

  return null;
}
