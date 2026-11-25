import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

// Calls onTimeout after timeoutMs with no touches or scrolls.
// Only active while enabled (signed in).
const InactivityGuard = ({ enabled, timeoutMs, onTimeout, children }) => {
  const timer = useRef(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const arm = () => {
    clear();
    timer.current = setTimeout(() => onTimeoutRef.current?.(), timeoutMs);
  };

  useEffect(() => {
    if (enabled) arm();
    else clear();
    return clear;
  }, [enabled, timeoutMs]);

  // Capture phase: sees every touch, but never takes it away from the screen underneath
  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        if (enabled) arm();
        return false;
      }}
      onMoveShouldSetResponderCapture={() => {
        if (enabled) arm();
        return false;
      }}
    >
      {children}
    </View>
  );
};

export default InactivityGuard;