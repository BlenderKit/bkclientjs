const CLIENT_PORTS = ["62485", "65425", "55428", "49452", "35452", "25152", "5152", "1234"]


export function GetConnection(): WebSocket {
  const socket = new WebSocket("ws://127.0.0.1:" + CLIENT_PORTS[0] + "/");
  return socket;
}











