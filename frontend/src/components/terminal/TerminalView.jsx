'use client';

import { useEffect, useRef } from 'react';
import { monoFontFamily } from '@/components/editor/editorTheme';
import styles from './TerminalView.module.css';

const THEME = {
  background: '#0c0e13',
  foreground: '#d5d9e2',
  cursor: '#ddb96f',
  cursorAccent: '#0c0e13',
  selectionBackground: '#2b3345',
  black: '#1b1f28',
  red: '#e2646e',
  green: '#56c292',
  yellow: '#e0b44a',
  blue: '#78a9f5',
  magenta: '#c79bf2',
  cyan: '#6fc3df',
  white: '#d5d9e2',
  brightBlack: '#5d6576',
  brightRed: '#ef8088',
  brightGreen: '#79d6aa',
  brightYellow: '#ecc877',
  brightBlue: '#9bc0f8',
  brightMagenta: '#d7b5f6',
  brightCyan: '#94d5ea',
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
