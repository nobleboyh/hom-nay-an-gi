import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  type AccessibilityProps,
  type ViewStyle,
} from 'react-native';

import { accessibilityDefaults } from './tokens';

export { accessibilityDefaults } from './tokens';

/*
 * ARIA → React Native Accessibility Mapping
 * -------------------------------------------
 * Web ARIA                    | React Native Equivalent
 * ----------------------------|-----------------------------------
 * role="button"               | accessibilityRole="button"
 * aria-expanded               | accessibilityState.expanded
 * aria-pressed                | accessibilityState.selected
 * aria-current="page"         | accessibilityState.selected on tab items
 * aria-label                  | accessibilityLabel
 * aria-live="polite"          | accessibilityLiveRegion="polite"
 * aria-hidden                 | importantForAccessibility="no-hide-descendants"
 * aria-invalid                | accessibilityState.invalid
 * aria-busy                   | accessibilityState.busy
 * aria-disabled               | accessibilityState.disabled
 * prefers-reduced-motion      | AccessibilityInfo.isReduceMotionEnabled()
 * focus indicators            | onFocus/onBlur + state-based border/outline
 * touch targets               | minWidth/minHeight: 44px on Pressable/Touchable
 */

export function getAccessibilityLabel(label: string) {
  return label;
}

export function getAccessibilityProps(label: string, hint?: string): Partial<AccessibilityProps> {
  return {
    accessibilityHint: hint,
    accessibilityLabel: getAccessibilityLabel(label),
  };
}

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) {
          setPrefersReducedMotion(enabled);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPrefersReducedMotion(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setPrefersReducedMotion(enabled);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return prefersReducedMotion;
}

export function getFocusOutline(): ViewStyle {
  return {
    borderColor: accessibilityDefaults.focusOutlineColor,
    borderStyle: 'solid',
    borderWidth: accessibilityDefaults.focusOutlineWidth,
  } as ViewStyle;
}
