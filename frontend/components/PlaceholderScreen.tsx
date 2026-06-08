import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing, Typography, oklchToRgba } from '../lib/tokens';

type PlaceholderScreenProps = {
  description: string;
  mainContentId: string;
  showBackButton?: boolean;
  skipLabel: string;
  title: string;
};

export function PlaceholderScreen({
  description,
  mainContentId,
  showBackButton = false,
  skipLabel,
  title,
}: PlaceholderScreenProps) {
  const router = useRouter();
  const [skipFocused, setSkipFocused] = useState(false);

  const handleSkipToContent = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const mainContent = document.getElementById(mainContentId);
    if (mainContent instanceof HTMLElement) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // `nativeID` covers native assistive tech, while `id`/`tabIndex` allow the web skip link target.
  const webMainContentProps =
    Platform.OS === 'web'
      ? ({ id: mainContentId, tabIndex: -1 } as { id: string; tabIndex: number })
      : {};

  return (
    <View style={styles.screen}>
      <Pressable
        accessibilityRole="link"
        focusable
        onBlur={() => setSkipFocused(false)}
        onFocus={() => setSkipFocused(true)}
        onPress={handleSkipToContent}
        style={[styles.skipLink, skipFocused ? styles.skipLinkVisible : styles.skipLinkHidden]}>
        <Text style={styles.skipLinkText}>{skipLabel}</Text>
      </Pressable>

      <View style={styles.contentWrap}>
        {showBackButton ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)' as Href)}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
        ) : null}

        <View
          {...webMainContentProps}
          accessibilityRole="summary"
          nativeID={mainContentId}
          role="main"
          style={styles.card}>
          <Text style={styles.eyebrow}>Router Shell Placeholder</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: oklchToRgba(Colors.bg),
    paddingHorizontal: Spacing.md2,
    paddingTop: Spacing.md2,
    paddingBottom: 96,
  },
  skipLink: {
    alignSelf: 'flex-start',
    borderRadius: Radius.sm,
    backgroundColor: oklchToRgba(Colors.fg),
    paddingHorizontal: Spacing.gap,
    paddingVertical: Spacing.sm2,
  },
  skipLinkHidden: {
    position: 'absolute',
    left: 12,
    top: 12,
    opacity: 0,
  },
  skipLinkVisible: {
    position: 'relative',
    marginBottom: 12,
    opacity: 1,
  },
  skipLinkText: {
    color: oklchToRgba(Colors.surface),
    fontFamily: Typography.button.family,
    fontSize: Typography.cardSubtitle.fontSize,
    fontWeight: Typography.button.fontWeight,
  },
  contentWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: oklchToRgba(Colors.surface),
    paddingHorizontal: Spacing.gap,
    paddingVertical: Spacing.sm2,
  },
  backButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: oklchToRgba(Colors.fg),
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: oklchToRgba(Colors.border),
    backgroundColor: oklchToRgba(Colors.surface),
    paddingHorizontal: Spacing.lg,
    paddingVertical: 28,
    gap: Spacing.sm2,
  },
  eyebrow: {
    fontFamily: Typography.badge.family,
    fontSize: Typography.badge.fontSize,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: oklchToRgba(Colors.accentStrong),
  },
  title: {
    fontFamily: Typography.appTitle.family,
    fontSize: Typography.appTitle.fontSize,
    fontWeight: '800',
    color: oklchToRgba(Colors.fg),
  },
  description: {
    fontFamily: Typography.cardSubtitle.family,
    fontSize: Typography.cardTitle.fontSize,
    lineHeight: 24,
    color: oklchToRgba(Colors.muted),
  },
});
