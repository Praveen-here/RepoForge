'use client';

import { useEffect, useRef } from 'react';
import { monoFontFamily } from '@/components/editor/editorTheme';
import styles from './TerminalView.module.css';

const THEME = {
  background: '#262626',
  foreground: '#e6e6e6',
  cursor: '#f5f5f5',
  cursorAccent: '#262626',
  selectionBackground: '#264f78',
  black: '#3a3a3a',
  red: '#ef4743',
  green: '#2cbb5d',
  yellow: '#ffb800',
  blue: '#3e9bff',
  magenta: '#c586c0',
  cyan: '#46c6c2',
  white: '#e6e6e6',
  brightBlack: '#8a8a8a',
  brightRed: '#ff6b67',
  brightGreen: '#4cd37b',
  brightYellow: '#ffcb47',
  brightBlue: '#6cb3ff',
  brightMagenta: '#d7a4d3',
  brightCyan: '#6fd8d4',
  brightWhite: '#ffffff',
};

const MAX_RETRIES = 6;
const DIM = (text) => `\x1b[2m${text}\x1b[0m`;

/**
 * An xterm.js terminal connected to a backend WebSocket.
 * interactive=true  -> a shell (keystrokes are sent to the container)
 * interactive=false -> read-only output (app logs)
 * onReady receives { send, focus } so parents can type commands into it.
 */
export default function TerminalView({ url, interactive = true, onReady, onStatus }) {
  const hostRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const onStatusRef = useRef(onStatus);
  onReadyRef.current = onReady;
  onStatusRef.current = onStatus;

  useEffect(() => {
    let disposed = false;
    let socket = null;
    let term = null;
    let resizeObserver = null;
    let retryTimer = null;
    let retries = 0;

    const setStatus = (status) => onStatusRef.current?.(status);
    const sendJson = (message) => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    };

    (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([import('@xterm/xterm'), import('@xterm/addon-fit')]);
      await document.fonts.ready;
      if (disposed) return;

      term = new Terminal({
        fontFamily: monoFontFamily(),
        fontSize: 13,
        lineHeight: 1.3,
        cursorBlink: interactive,
        cursorStyle: interactive ? 'bar' : 'underline',
        disableStdin: !interactive,
        convertEol: !interactive,
        scrollback: 5000,
        theme: THEME,
        allowProposedApi: false,
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(hostRef.current);

      const safeFit = () => {
        if (hostRef.current?.offsetWidth > 0 && hostRef.current?.offsetHeight > 0) {
          try {
            fit.fit();
          } catch {
            /* element not measurable yet */
          }
        }
      };
      const sendResize = () => interactive && sendJson({ type: 'resize', cols: term.cols, rows: term.rows });

      if (interactive) term.onData((data) => sendJson({ type: 'input', data }));
      term.onResize(sendResize);

      resizeObserver = new ResizeObserver(safeFit);
      resizeObserver.observe(hostRef.current);
      safeFit();

      const connect = () => {
        setStatus('connecting');
        socket = new WebSocket(url);

        socket.onopen = () => {
          retries = 0;
          setStatus('connected');
          safeFit();
          sendResize();
        };
        socket.onmessage = (event) => term.write(event.data);
        socket.onclose = () => {
          if (disposed) return;
          setStatus('disconnected');
          if (retries >= MAX_RETRIES) {
            term.write(`\r\n${DIM('[connection lost]')}\r\n`);
            return;
          }
          retries += 1;
          term.write(`\r\n${DIM('[disconnected, reconnecting…]')}\r\n`);
          retryTimer = setTimeout(connect, Math.min(800 * 2 ** (retries - 1), 8000));
        };
      };
      connect();

      onReadyRef.current?.({
        send: (data) => sendJson({ type: 'input', data }),
        focus: () => term.focus(),
      });
    })();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      resizeObserver?.disconnect();
      socket?.close();
      term?.dispose();
    };
  }, [url, interactive]);

  return (
    <div className={styles.wrapper}>
      <div ref={hostRef} className={styles.host} />
    </div>
  );
}
