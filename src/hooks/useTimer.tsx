import * as React from 'react';

export interface TimerOptions {
  /** Amount of time to wait before firing the timer, in milliseconds. Use `undefined` or `0` if you'd like the timer to behave as a stopwatch, never firing. */
  delay?: number;
  /** The callback to call when the timer fires. Must provide a `delay` for the timer to fire. */
  callback?: () => void;
  /** Use `true` to only run the timer once, `false` otherwise.  */
  runOnce?: boolean;
  /** Use `true` if the timer should fire immediately, calling the provided callback when starting. Use `false` otherwise. */
  fireImmediately?: boolean;
  /** Use `true` if the timer should start immediately, `false` if you'd like to call `start()` yourself. */
  startImmediately?: boolean;
  /** There is a failsafe built in for very low delays (less than 10ms) and expensive callback operations, which sometimes cause the timer to not fire fast enough. You can use `true` to disable the failsafe. With no failsafe, the callback will always be called the exact number of times expected, even when calls are overdue. Be aware that if the callback is expensive (takes longer than the delay), this may lead to a crash. When `false` (default), the failsafe is enabled and calls to the callback will be skipped when the timer can't keep up. Only set this to `true` if your callback isn't expensive. Default `false`. */
  fireOverdueCallbacks?: boolean;
}

/** Milliseconds representing forever in the future. */
const never = Number.MAX_SAFE_INTEGER;

/**
 * See documentation: [useTimer](https://justinmahar.github.io/react-use-precision-timer/?path=/story/docs-usetimer--page)
 *
 * A versatile precision timer hook for React. Doubles as a stopwatch.
 *
 * - Based on `setTimeout()` and timestamps, not `setInterval()` or ticks.
 * - Features perfect mean interval accuracy, meaning it doesn't wander.
 * - Resilient to expensive callback operations and low timer delays.
 * - Can be used as a timer or a stopwatch.
 * - Supports starting, stopping, pausing, and resuming.
 * - Includes accessors for everything under the sun.
 */
export const useTimer = (options: TimerOptions = {}): Timer => {
  const [firstRun, setFirstRun] = React.useState(true);
  const [, setRenderTime] = React.useState(Date.now());
  const startedRef = React.useRef(false);
  const startTimeRef = React.useRef(never);
  const lastFireTimeRef = React.useRef(never);
  const nextFireTimeRef = React.useRef(never);
  const pauseTimeRef = React.useRef(never);
  const resumeTimeRef = React.useRef(never);
  const periodElapsedPauseTimeRef = React.useRef(0);
  const totalElapsedPauseTimeRef = React.useRef(0);

  const isStarted = React.useCallback((): boolean => {
    return startedRef.current;
  }, []);

  const isStopped = React.useCallback((): boolean => {
    return !isStarted();
  }, [isStarted]);

  const isPaused = React.useCallback((): boolean => {
    return isStarted() && pauseTimeRef.current !== never;
  }, [isStarted]);

  const isRunning = React.useCallback((): boolean => {
    return isStarted() && !isPaused();
  }, [isPaused, isStarted]);

  const getStartTime = React.useCallback((): number => {
    if (isStarted()) {
      return startTimeRef.current;
    }
    return -1;
  }, [isStarted]);

  const getLastFireTime = React.useCallback((): number => {
    return lastFireTimeRef.current < never && !!options.delay ? lastFireTimeRef.current : -1;
  }, [options.delay]);

  const getNextFireTime = React.useCallback((): number => {
    if (isRunning() && !!options.delay) {
      return nextFireTimeRef.current;
    }
    return -1;
  }, [isRunning, options.delay]);

  const getPauseTime = React.useCallback((): number => {
    if (isPaused()) {
      return pauseTimeRef.current;
    }
    return -1;
  }, [isPaused]);

  const getResumeTime = React.useCallback((): number => {
    if (isStarted() && resumeTimeRef.current < never) {
      return resumeTimeRef.current;
    }
    return -1;
  }, [isStarted]);

  const getElapsedStartedTime = React.useCallback((): number => {
    if (isStarted()) {
      return new Date().getTime() - startTimeRef.current;
    }
    return 0;
  }, [isStarted]);

  const getElapsedRunningTime = React.useCallback((): number => {
    if (isStarted()) {
      if (isPaused()) {
        return pauseTimeRef.current - startTimeRef.current - totalElapsedPauseTimeRef.current;
      } else {
        return new Date().getTime() - startTimeRef.current - totalElapsedPauseTimeRef.current;
      }
    }
    return 0;
  }, [isPaused, isStarted]);

  const getPeriodElapsedPausedTime = React.useCallback((): number => {
    let additionalElapsedPauseTime = 0;
    if (isPaused()) {
      additionalElapsedPauseTime = new Date().getTime() - pauseTimeRef.current;
    }
    return periodElapsedPauseTimeRef.current + additionalElapsedPauseTime;
  }, [isPaused]);

  const getTotalElapsedPausedTime = React.useCallback((): number => {
    let additionalElapsedPauseTime = 0;
    if (isPaused()) {
      additionalElapsedPauseTime = new Date().getTime() - pauseTimeRef.current;
    }
    return totalElapsedPauseTimeRef.current + additionalElapsedPauseTime;
  }, [isPaused]);

  const getElapsedResumedTime = React.useCallback((): number => {
    if (isRunning()) {
      return new Date().getTime() - resumeTimeRef.current;
    }
    return 0;
  }, [isRunning]);

  const getRemainingTime = React.useCallback((): number => {
    const currentTime = new Date().getTime();
    if (isStarted() && !!options.delay) {
      if (isRunning()) {
        return Math.max(0, nextFireTimeRef.current - currentTime);
      } else if (isPaused()) {
        const edgeTime = lastFireTimeRef.current !== never ? lastFireTimeRef.current : startTimeRef.current;
        return Math.max(0, options.delay - (pauseTimeRef.current - edgeTime - periodElapsedPauseTimeRef.current));
      }
    }
    return 0;
  }, [isPaused, isRunning, isStarted, options.delay]);

  const start = React.useCallback(
    (startTimeMillis = new Date().getTime()) => {
      const newNextFireTime = options.delay
        ? Math.max(startTimeMillis, options.fireImmediately ? startTimeMillis : startTimeMillis + options.delay)
        : never;
      startTimeRef.current = startTimeMillis;
      lastFireTimeRef.current = never;
      nextFireTimeRef.current = newNextFireTime;
      pauseTimeRef.current = never;
      resumeTimeRef.current = startTimeMillis;
      periodElapsedPauseTimeRef.current = 0;
      totalElapsedPauseTimeRef.current = 0;
      startedRef.current = true;
    },
    [options.delay, options.fireImmediately],
  );

  const stop = React.useCallback((): void => {
    startTimeRef.current = never;
    lastFireTimeRef.current = never;
    nextFireTimeRef.current = never;
    pauseTimeRef.current = never;
    resumeTimeRef.current = never;
    periodElapsedPauseTimeRef.current = 0;
    totalElapsedPauseTimeRef.current = 0;
    startedRef.current = false;
  }, []);

  const pause = React.useCallback((): void => {
    if (isRunning()) {
      pauseTimeRef.current = new Date().getTime();
      resumeTimeRef.current = never;
    }
  }, [isRunning]);

  const resume = React.useCallback((): void => {
    if (isStarted() && isPaused()) {
      const currentTime = new Date().getTime();
      totalElapsedPauseTimeRef.current = totalElapsedPauseTimeRef.current + (currentTime - pauseTimeRef.current);
      periodElapsedPauseTimeRef.current = periodElapsedPauseTimeRef.current + (currentTime - pauseTimeRef.current);
      nextFireTimeRef.current = currentTime + getRemainingTime();
      pauseTimeRef.current = never;
      resumeTimeRef.current = currentTime;
    }
  }, [isStarted, isPaused, getRemainingTime]);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    // If it's a timer and it isn't paused...
    if (options.delay && !isPaused()) {
      const now = Date.now();
      // Check if we're overdue on any events being fired (super low delay or expensive callback)
      const overdueCalls =
        lastFireTimeRef.current !== never
          ? Math.max(0, Math.floor((now - nextFireTimeRef.current) / options.delay))
          : 0;
      // If we're overdue, this means we're not firing callbacks fast enough and need to prevent
      // exceeding the maximum update depth.
      // To do this, we only fire the callback on an even number of overdues (including 0, no overdues).
      // Else, we wait a little, then try again.
      if (overdueCalls % 2 !== 1) {
        // If the timer is up...
        if (now >= nextFireTimeRef.current) {
          // Call the callback
          if (typeof options.callback === 'function') {
            try {
              // Only fire overdue callbacks if we're told to, otherwise skip them
              for (let i = 0; i < (options.fireOverdueCallbacks ? overdueCalls + 1 : 1); i++) {
                options.callback();
              }
            } catch (e) {
              console.error(e);
            }
          }
          lastFireTimeRef.current = now;
          periodElapsedPauseTimeRef.current = 0;
          // If it repeats
          if (!options.runOnce) {
            // Calculate and set the next time the timer should fire
            const overdueElapsedTime = overdueCalls * options.delay;
            const newFireTime = Math.max(now, nextFireTimeRef.current + options.delay + overdueElapsedTime);
            nextFireTimeRef.current = newFireTime;
            // Set a timeout to check and fire the timer when time's up
            timeout = setTimeout(() => {
              // This merely triggers a rerender to check if the timer can fire.
              setRenderTime(new Date().getTime());
            }, Math.max(newFireTime - new Date().getTime(), 1));
          } else {
            // If it doesn't repeat, stop the timer.
            stop();
          }
        }
        // Time is not up yet. Set a timeout to check and fire when time's up
        else if (nextFireTimeRef.current < never) {
          timeout = setTimeout(() => {
            // This merely triggers a rerender to check if the timer can fire.
            setRenderTime(new Date().getTime());
            // Home in on the exact time to fire.
          }, Math.max(nextFireTimeRef.current - new Date().getTime(), 1));
        }
      } else {
        // Relief valve to avoid maximum update depth exceeded errors.
        // When calls become overdue, there's too expensive of a callback or too low of a delay to keep up.
        // In both cases, the React max update stack will be exceeded due to repeated firings.
        // To relieve this, don't check to fire this time around, but check again in a short time.
        timeout = setTimeout(() => {
          setRenderTime(new Date().getTime());
        }, 20);
      }
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [options.runOnce, options.delay, stop, isPaused, options]);

  // Start immediately if this is our first run.
  React.useEffect(() => {
    if (firstRun) {
      setFirstRun(false);
      if (options.startImmediately) {
        start();
      }
    }
  }, [firstRun, options.startImmediately, start]);

  return {
    start,
    stop,
    pause,
    resume,
    isStarted,
    isStopped,
    isRunning,
    isPaused,
    getStartTime,
    getLastFireTime,
    getNextFireTime,
    getPauseTime,
    getResumeTime,
    getRemainingTime,
    getElapsedStartedTime,
    getElapsedRunningTime,
    getTotalElapsedPausedTime,
    getPeriodElapsedPausedTime,
    getElapsedResumedTime,
  };
};

/**
 * See documentation: [Timer](https://justinmahar.github.io/react-use-precision-timer/?path=/story/docs-usetimer--page#timer)
 */
export interface Timer {
  /**
   * Start the timer. If already started, will restart the timer.
   *
   * @param startTime Optional. The Unix epoch time in milliseconds at which to start the timer. Defaults to the current time in millis.
   */
  start: (startTime?: number) => void;
  /** Stop the timer. */
  stop: () => void;
  /** Pause the timer. */
  pause: () => void;
  /** Resume the timer. */
  resume: () => void;
  /** Returns `true` if the timer is started, `false` otherwise. Will be `true` when the timer is started but paused. Use `isRunning()` to check if the timer is started and not paused. */
  isStarted: () => boolean;
  /** Returns `true` if the timer is stopped, `false` otherwise. Will be `false` when the timer is started but paused. */
  isStopped: () => boolean;
  /** Returns `true` if the timer is started and not paused, `false` otherwise. */
  isRunning: () => boolean;
  /** Returns `true` if the timer is started but paused, `false` otherwise. */
  isPaused: () => boolean;
  /** Return the time at which the timer was started, in milliseconds since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time). Returns `-1` if the timer is stopped. */
  getStartTime: () => number;
  /** The last time the timer fired and the callback was called, in milliseconds since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time), or `-1` if it hasn't fired yet or there is no `delay`. */
  getLastFireTime: () => number;
  /** The next time the timer will fire and the callback will be called, in milliseconds since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time), or `-1` if the timer is not running or there is no `delay`. */
  getNextFireTime: () => number;
  /** Return the time at which the timer was paused, in milliseconds since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time). Returns `-1` if the timer is not paused or is stopped. */
  getPauseTime: () => number;
  /** Return the time at which the timer was last resumed, in milliseconds since the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time). Returns `-1` if the timer is not started. */
  getResumeTime: () => number;
  /** Return the time remaining in milliseconds before the timer fires. Returns `0` if the timer has no `delay`. */
  getRemainingTime: () => number;
  /** Return the total amount of time elapsed in milliseconds since starting the timer, including paused time. Returns `0` if the timer is stopped. */
  getElapsedStartedTime: () => number;
  /** Return the amount of time that has elapsed in milliseconds since starting the timer, minus the time spent paused (if any). Returns `0` if the timer is stopped. */
  getElapsedRunningTime: () => number;
  /** Return the total amount of time elapsed in milliseconds while paused since starting the timer. Returns `0` if the timer is stopped. */
  getTotalElapsedPausedTime: () => number;
  /** Return the amount of time elapsed in milliseconds while paused in the current period. This will be the elapsed time since the timer last fired, or since it started if it hasn't fired yet. Returns `0` if never paused since starting or last firing. */
  getPeriodElapsedPausedTime: () => number;
  /** Return the total amount of time elapsed in milliseconds since the timer was last resumed, or since it was started if never paused. Returns `0` if the timer is stopped. */
  getElapsedResumedTime: () => number;
}
