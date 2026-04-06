export interface RuntimeProfile {
  constrainedNetwork: boolean;
  lowEndDevice: boolean;
  mediumDevice: boolean;
  reduceEffects: boolean;
  compactIconRendering: boolean;
  galleryInitialBatch: number;
  galleryBatchIncrement: number;
  editorInitialBatch: number;
  editorBatchIncrement: number;
  maxBatchAnimationCards: number;
}

type NavigatorLike = Navigator & {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
  deviceMemory?: number;
};

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
    options?: { timeout?: number },
  ) => number;
  cancelIdleCallback?: (id: number) => void;
};

let cachedRuntimeProfile: RuntimeProfile | null = null;

const getDefaultProfile = (): RuntimeProfile => ({
  constrainedNetwork: false,
  lowEndDevice: false,
  mediumDevice: true,
  reduceEffects: false,
  compactIconRendering: true,
  galleryInitialBatch: 46,
  galleryBatchIncrement: 30,
  editorInitialBatch: 45,
  editorBatchIncrement: 30,
  maxBatchAnimationCards: 16,
});

export const getRuntimeProfile = (): RuntimeProfile => {
  if (cachedRuntimeProfile) return cachedRuntimeProfile;
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    cachedRuntimeProfile = getDefaultProfile();
    return cachedRuntimeProfile;
  }

  const nav = navigator as NavigatorLike;
  const connection = nav.connection;
  const effectiveType = connection?.effectiveType ?? '';
  const constrainedNetwork = Boolean(
    connection?.saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g',
  );

  const deviceMemory = nav.deviceMemory ?? 8;
  const cpuCores = nav.hardwareConcurrency ?? 8;
  const lowEndDevice = deviceMemory <= 4 || cpuCores <= 4 || constrainedNetwork;
  const mediumDevice = !lowEndDevice && (deviceMemory <= 6 || cpuCores <= 6);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reduceEffects = prefersReducedMotion || lowEndDevice;
  const compactIconRendering = lowEndDevice || mediumDevice;

  if (lowEndDevice) {
    cachedRuntimeProfile = {
      constrainedNetwork,
      lowEndDevice,
      mediumDevice,
      reduceEffects,
      compactIconRendering,
      galleryInitialBatch: 32,
      galleryBatchIncrement: 22,
      editorInitialBatch: 32,
      editorBatchIncrement: 20,
      maxBatchAnimationCards: 0,
    };
    return cachedRuntimeProfile;
  }

  if (mediumDevice) {
    cachedRuntimeProfile = {
      constrainedNetwork,
      lowEndDevice,
      mediumDevice,
      reduceEffects,
      compactIconRendering,
      galleryInitialBatch: 46,
      galleryBatchIncrement: 30,
      editorInitialBatch: 45,
      editorBatchIncrement: 30,
      maxBatchAnimationCards: 12,
    };
    return cachedRuntimeProfile;
  }

  cachedRuntimeProfile = {
    constrainedNetwork,
    lowEndDevice,
    mediumDevice,
    reduceEffects,
    compactIconRendering,
    galleryInitialBatch: 64,
    galleryBatchIncrement: 40,
    editorInitialBatch: 54,
    editorBatchIncrement: 36,
    maxBatchAnimationCards: 22,
  };
  return cachedRuntimeProfile;
};

export const runWhenIdle = (task: () => void, timeout = 1200) => {
  if (typeof window === 'undefined') return () => undefined;
  const idleWindow = window as WindowWithIdleCallback;

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const id = idleWindow.requestIdleCallback(() => {
      task();
    }, { timeout });
    return () => {
      idleWindow.cancelIdleCallback?.(id);
    };
  }

  const timer = window.setTimeout(task, timeout);
  return () => {
    window.clearTimeout(timer);
  };
};
