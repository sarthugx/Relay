// For the MVP, we use a simple memory-based rate limiter for socket connections.
// In production, you would use Redis for cross-instance rate limiting.

const connectionLimits = new Map();

function rateLimiter(socket, next) {
  const ip = socket.handshake.address;
  const now = Date.now();
  
  if (connectionLimits.has(ip)) {
    const { count, firstConnection } = connectionLimits.get(ip);
    
    // Reset window after 1 minute
    if (now - firstConnection > 60000) {
      connectionLimits.set(ip, { count: 1, firstConnection: now });
      return next();
    }
    
    // Max 10 connections per minute per IP
    if (count > 10) {
      return next(new Error('Rate limit exceeded. Try again later.'));
    }
    
    connectionLimits.set(ip, { count: count + 1, firstConnection });
  } else {
    connectionLimits.set(ip, { count: 1, firstConnection: now });
  }
  
  next();
}

module.exports = rateLimiter;
