// Tap-to-connect for the workflow builder.
// On touch screens, dragging a wire between 14px sockets is nearly impossible,
// so this adds a two-tap flow: tap a socket to arm it (it glows), then tap a
// socket on the other side to create the connection. Tapping the same pair
// again removes the connection. Works alongside the normal drag behavior.

import { ClassicPreset, NodeEditor } from 'rete';
import type { ClassicScheme } from '@retejs/lit-plugin';

interface ArmedSocket {
  nodeId: string;
  side: 'input' | 'output';
  key: string;
  el: HTMLElement;
}

const ARMED_STYLE = {
  transform: 'scale(1.35)',
  filter: 'drop-shadow(0 0 6px #818cf8)',
  transition: 'transform 0.12s, filter 0.12s',
};

function styleSocket(el: HTMLElement, armed: boolean) {
  el.style.transform = armed ? ARMED_STYLE.transform : '';
  el.style.filter = armed ? ARMED_STYLE.filter : '';
  el.style.transition = ARMED_STYLE.transition;
}

function ensureHint(container: HTMLElement): HTMLElement {
  let hint = container.querySelector<HTMLElement>('[data-wf-tap-hint]');
  if (!hint) {
    hint = document.createElement('div');
    hint.setAttribute('data-wf-tap-hint', '');
    hint.style.cssText =
      'position:absolute; left:50%; bottom:14px; transform:translateX(-50%);' +
      'background:#312e81; color:#e0e7ff; font-size:12px; font-weight:500;' +
      'padding:6px 14px; border-radius:9999px; z-index:50; pointer-events:none;' +
      'opacity:0; transition:opacity 0.15s; white-space:nowrap;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.4);';
    const host =
      container.style.position === '' ? container.parentElement || container : container;
    if (getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }
    host.appendChild(hint);
  }
  return hint;
}

export function installTapConnect(
  editor: NodeEditor<ClassicScheme>,
  container: HTMLElement
): () => void {
  let armed: ArmedSocket | null = null;
  let downX = 0;
  let downY = 0;
  let downTime = 0;
  const hint = ensureHint(container);

  const showHint = (text: string) => {
    hint.textContent = text;
    hint.style.opacity = '1';
  };
  const hideHint = () => {
    hint.style.opacity = '0';
  };

  const disarm = () => {
    if (armed) styleSocket(armed.el, false);
    armed = null;
    hideHint();
  };

  const findSocket = (target: EventTarget | null): ArmedSocket | null => {
    const el = (target as HTMLElement | null)?.closest?.<HTMLElement>(
      '[data-wf-socket]'
    );
    if (!el) return null;
    const side = el.getAttribute('data-wf-socket') as 'input' | 'output';
    const key = el.getAttribute('data-wf-socket-key') || '';
    const nodeId = el.getAttribute('data-wf-socket-node') || '';
    if (!side || !key || !nodeId) return null;
    return { side, key, nodeId, el };
  };

  const connectionBetween = (
    sourceId: string,
    sourceKey: string,
    targetId: string,
    targetKey: string
  ) =>
    editor
      .getConnections()
      .find(
        (c) =>
          c.source === sourceId &&
          c.sourceOutput === sourceKey &&
          c.target === targetId &&
          c.targetInput === targetKey
      );

  const onPointerDown = (e: PointerEvent) => {
    downX = e.clientX;
    downY = e.clientY;
    downTime = Date.now();
  };

  const onPointerUp = (e: PointerEvent) => {
    // Only treat as a tap: little movement, short duration
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (moved > 10 || Date.now() - downTime > 600) return;

    const socket = findSocket(e.target);

    if (!socket) {
      // Tap on empty canvas cancels the armed socket
      if (armed) disarm();
      return;
    }

    if (!armed) {
      armed = socket;
      styleSocket(socket.el, true);
      showHint(
        socket.side === 'output'
          ? 'Tap an input socket on another node to connect'
          : 'Tap an output socket on another node to connect'
      );
      return;
    }

    // Second tap on the same socket cancels
    if (
      armed.nodeId === socket.nodeId &&
      armed.side === socket.side &&
      armed.key === socket.key
    ) {
      disarm();
      return;
    }

    // Same side: switch the armed socket instead of failing
    if (armed.side === socket.side) {
      styleSocket(armed.el, false);
      armed = socket;
      styleSocket(socket.el, true);
      return;
    }

    const from = armed.side === 'output' ? armed : socket;
    const to = armed.side === 'output' ? socket : armed;

    if (from.nodeId === to.nodeId) {
      showHint("Can't connect a node to itself");
      setTimeout(hideHint, 1500);
      styleSocket(armed.el, false);
      armed = null;
      return;
    }

    const source = editor.getNode(from.nodeId);
    const target = editor.getNode(to.nodeId);
    const armedRef = armed;
    armed = null;
    styleSocket(armedRef.el, false);
    hideHint();
    if (!source || !target) return;

    const existing = connectionBetween(
      from.nodeId,
      from.key,
      to.nodeId,
      to.key
    );

    void (async () => {
      if (existing) {
        // Toggle: same pair tapped again removes the connection
        await editor.removeConnection(existing.id);
        return;
      }
      // Inputs accept one connection: replace anything already wired in
      const occupied = editor
        .getConnections()
        .filter((c) => c.target === to.nodeId && c.targetInput === to.key);
      for (const c of occupied) {
        await editor.removeConnection(c.id);
      }
      const conn = new ClassicPreset.Connection(
        source,
        from.key as never,
        target,
        to.key as never
      );
      await editor.addConnection(conn as ClassicScheme['Connection']);
    })();
  };

  container.addEventListener('pointerdown', onPointerDown, true);
  container.addEventListener('pointerup', onPointerUp, true);

  return () => {
    container.removeEventListener('pointerdown', onPointerDown, true);
    container.removeEventListener('pointerup', onPointerUp, true);
    hint.remove();
  };
}
