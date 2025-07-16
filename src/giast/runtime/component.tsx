import {
  HTMLProps,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Runtime,
  RuntimeConfig,
} from './';

export interface RuntimeComponentProps
  extends Omit<HTMLProps<HTMLDivElement>, "children"> {
  config: RuntimeConfig;
}

export function RuntimeComponent({ config, ...props }: RuntimeComponentProps) {
  const [, forceUpdate] = useState({});
  const [error, setError] = useState<Error | null>(null);
  const runtime = useMemo(() => new Runtime(config), [config]);

  useEffect(() => {
    // Subscribe to runtime changes
    const unsubscribe = runtime.onChange(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!runtime.hasRun) {
      try {
        runtime.run();
      } catch (error) {
        setError(error as Error);
      }
    }
  }, [runtime]);

  return (
    <div {...props}>
      {error ? (
        <div className="text-red-500 flex flex-col gap-2 bg-red-500/10 p-4 rounded-md">
          <div className="font-bold">Runtime Error</div>
          <div className="text-sm">{error.message}</div>
        </div>
      ) : (
        runtime.render()
      )}
    </div>
  );
}
