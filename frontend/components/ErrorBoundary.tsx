import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { captureMonitoringException, prepareMonitoringException } from '../lib/monitoring';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    prepareMonitoringException(error);
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureMonitoringException(error, { extra: { componentStack: errorInfo.componentStack } });
    console.error('Route shell render failure', error, errorInfo);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View role="alert" style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Đã xảy ra lỗi giao diện</Text>
          <Text style={styles.body}>
            The route shell hit an unexpected rendering error. Reset the shell to continue.
          </Text>
          <Pressable accessibilityRole="button" onPress={this.reset} style={styles.button}>
            <Text style={styles.buttonText}>Thử lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7F3EE',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7DCE2',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18212A',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4C5A67',
  },
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#A8461F',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
