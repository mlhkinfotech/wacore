import { createWAServer } from './server.js';
export { createWAServer, type WAServerInstance } from './server.js';
export { loadConfig, type ServerConfig } from './config.js';
export { NotificationQueue, type NotificationItem } from './notifications/queue.js';

// Auto-run if executed directly as main script or CLI binary
const isDirectExecution = process.argv[1] && (
  process.argv[1].endsWith('dist/index.js') ||
  process.argv[1].endsWith('wa-server') ||
  process.argv[1].endsWith('src/index.ts')
);

if (isDirectExecution) {
  const server = createWAServer();
  server.start().catch((err) => {
    console.error('Failed to start MLHK WhatsApp Server:', err);
    process.exit(1);
  });
}
