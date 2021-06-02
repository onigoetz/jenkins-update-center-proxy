import { networkInterfaces } from "os";

/**
 * Getting an IP Address in multiple systems in Bash is HARD
 * Let's go the lazy route
 */
function getIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
}

console.log(getIp());
