import { createWAServer } from './server.js';
export { createWAServer, type WAServerInstance } from './server.js';
export { loadConfig, type ServerConfig } from './config.js';
export { NotificationQueue, type NotificationItem } from './notifications/queue.js';


// Auto-run only if executed directly as main script or CLI binary
const isDirectExecution = Boolean(
  process.argv[1] && (
    (typeof __filename !== 'undefined' && __filename === process.argv[1]) ||
    process.argv[1].endsWith('wa-server/dist/index.js') ||
    process.argv[1].endsWith('wa-server/dist/index.cjs') ||
    process.argv[1].endsWith('/wa-server')
  )
);

if (isDirectExecution) {
  const server = createWAServer();
  server.start().catch((err) => {
    console.error('Failed to start MLHK WhatsApp Server:', err);
    process.exit(1);
  });
}
