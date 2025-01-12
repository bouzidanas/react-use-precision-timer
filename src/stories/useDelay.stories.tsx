import React from 'react';
import { useDelay } from '../hooks/useDelay';

// Needed to wrap the hook and give it visual representation.
const HookComponent = (props: any) => {
  const [delay, setDelay] = React.useState(2000);
  const [callbackTime, setCallbackTime] = React.useState(-1);
  const [renderTime, setRenderTime] = React.useState(new Date().getTime());
  const callback = React.useCallback(() => {
    setCallbackTime(new Date().getTime());
  }, []);
  const timer = useDelay(delay, callback);

  React.useEffect(() => {
    const timeout = setTimeout(() => setRenderTime(new Date().getTime()), 1);
    return () => {
      clearTimeout(timeout);
    };
  });

  return (
    <div>
      <div>
        <div>
          <input
            type="range"
            id="points"
            name="points"
            min="10"
            max="5000"
            value={delay}
            onChange={(e) => {
              setDelay(parseInt(e.target.value));
              timer.start();
            }}
          />{' '}
          {delay} milliseconds
        </div>
      </div>
      <div>
        <progress value={timer.isStopped() ? 0 : delay - timer.getRemainingTime()} max={delay}>
          {timer.getRemainingTime()}
        </progress>
      </div>
      <table>
        <tr>
          <td>callback time:</td>
          <td>{callbackTime}</td>
        </tr>
        <tr>
          <td>delay:</td>
          <td>{delay}</td>
        </tr>
        <tr>
          <td>getLastFireTime:</td>
          <td>{timer.getLastFireTime()}</td>
        </tr>
        <tr>
          <td>getNextFireTime:</td>
          <td>{timer.getNextFireTime()}</td>
        </tr>
        <tr>
          <td>getRemainingTime:</td>
          <td>{timer.getRemainingTime()}</td>
        </tr>
        <tr>
          <td>getElapsedStartedTime:</td>
          <td>{timer.getElapsedStartedTime()}</td>
        </tr>
        <tr>
          <td>getElapsedRunningTime:</td>
          <td>{timer.getElapsedRunningTime()}</td>
        </tr>
        <tr>
          <td>getStartTime:</td>
          <td>{timer.getStartTime()}</td>
        </tr>
        <tr>
          <td>getPauseTime:</td>
          <td>{timer.getPauseTime()}</td>
        </tr>
        <tr>
          <td>getResumeTime:</td>
          <td>{timer.getResumeTime()}</td>
        </tr>
        <tr>
          <td>getPeriodElapsedPausedTime:</td>
          <td>{timer.getPeriodElapsedPausedTime()}</td>
        </tr>
        <tr>
          <td>getTotalElapsedPausedTime:</td>
          <td>{timer.getTotalElapsedPausedTime()}</td>
        </tr>
        <tr>
          <td>getElapsedResumedTime:</td>
          <td>{timer.getElapsedResumedTime()}</td>
        </tr>
        <tr>
          <td>isStarted:</td>
          <td>{timer.isStarted() + ''}</td>
        </tr>
        <tr>
          <td>isStopped:</td>
          <td>{timer.isStopped() + ''}</td>
        </tr>
        <tr>
          <td>isRunning:</td>
          <td>{timer.isRunning() + ''}</td>
        </tr>
        <tr>
          <td>isPaused:</td>
          <td>{timer.isPaused() + ''}</td>
        </tr>
      </table>
    </div>
  );
};

export const TimerStory = () => <HookComponent />;
TimerStory.story = {
  name: 'Hook Visual',
};

export default {};
