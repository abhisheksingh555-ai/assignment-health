let socket = null;

export const connectSocket = () => {
  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
    return socket;
  }

  socket = new WebSocket(
    import.meta.env.VITE_WS_URL
  );

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const waitForSocketOpen = (
  timeout = 10000
) => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(
        new Error("WebSocket has not been created.")
      );
      return;
    }

    if (socket.readyState === WebSocket.OPEN) {
      resolve(socket);
      return;
    }

    if (
      socket.readyState === WebSocket.CLOSING ||
      socket.readyState === WebSocket.CLOSED
    ) {
      reject(
        new Error("WebSocket is closed.")
      );
      return;
    }

    const timer = setTimeout(() => {
      cleanup();

      reject(
        new Error(
          "WebSocket connection timeout."
        )
      );
    }, timeout);

    const handleOpen = () => {
      cleanup();
      resolve(socket);
    };

    const handleError = () => {
      cleanup();

      reject(
        new Error(
          "WebSocket connection failed."
        )
      );
    };

    const cleanup = () => {
      clearTimeout(timer);

      socket?.removeEventListener(
        "open",
        handleOpen
      );

      socket?.removeEventListener(
        "error",
        handleError
      );
    };

    socket.addEventListener(
      "open",
      handleOpen
    );

    socket.addEventListener(
      "error",
      handleError
    );
  });
};

export const sendSocketMessage = async (
  message
) => {
  const ws = await waitForSocketOpen();

  ws.send(
    JSON.stringify(message)
  );
};

export const sendSocketBinary = async (
  buffer
) => {
  const ws = await waitForSocketOpen();

  ws.send(buffer);
};

export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};