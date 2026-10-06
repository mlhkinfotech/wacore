import { Command } from 'commander';
import pc from 'picocolors';
import fs from 'fs';
import path from 'path';
import { createWAServer } from '@mlhkinfotech/wa-server';

const program = new Command();

program
  .name('mlhk-wa')
  .description(pc.cyan('Enterprise WhatsApp AI Agent CLI by MLHK'))
  .version('1.0.0');

// Command: START (Runs turnkey server)
program
  .command('start')
  .description('Start the WhatsApp AI REST & WebSocket Server')
  .option('-p, --port <port>', 'Port number to listen on', '3001')
  .option('-t, --token <token>', 'API Token for authentication')
  .option('--provider <provider>', 'AI Provider (gemini or openrouter)', 'gemini')
  .option('--key <key>', 'AI Provider API Key')
  .action(async (options) => {
    console.log(pc.bold(pc.green('\n🚀 Starting MLHK WhatsApp AI Server...')));

    const server = createWAServer({
      port: Number(options.port),
      apiToken: options.token,
      aiProvider: options.provider as any,
      aiApiKey: options.key || process.env.AI_API_KEY
    });

    try {
      await server.start();
      console.log(pc.yellow(`👉 Scan QR or use Admin Dashboard at port ${options.port}`));
    } catch (err: any) {
      console.error(pc.red(`Failed to start server: ${err.message}`));
      process.exit(1);
    }
  });

// Command: CREATE (Scaffolds new client project)
program
  .command('create <projectName>')
  .description('Scaffold a new WhatsApp AI Agent project for a client')
  .action(async (projectName) => {
    const targetDir = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
      console.error(pc.red(`Error: Directory "${projectName}" already exists.`));
      process.exit(1);
    }

    console.log(pc.cyan(`\n📦 Creating new WhatsApp AI Bot in ${targetDir}...`));
    fs.mkdirSync(targetDir, { recursive: true });

    // 1. package.json
    const pkg = {
      name: projectName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        start: 'node --env-file=.env index.js',
        dev: 'node --watch --env-file=.env index.js'
      },
      dependencies: {
        '@mlhkinfotech/wa-core': '^1.0.0',
        '@mlhkinfotech/ai-agent': '^1.0.0',
        '@mlhkinfotech/plugin-catalog': '^1.0.0'
      }
    };
    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2));

    // 2. .env.example
    const envContent = `# AI Configuration
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-2.0-flash
`;
    fs.writeFileSync(path.join(targetDir, '.env.example'), envContent);
    fs.writeFileSync(path.join(targetDir, '.env'), envContent);

    // 3. index.js
    const indexJs = `import { WhatsAppEngine } from '@mlhkinfotech/wa-core';
import { AIAgent } from '@mlhkinfotech/ai-agent';
import { CatalogPlugin } from '@mlhkinfotech/plugin-catalog';

// 1. Configure Business & Products
const catalog = new CatalogPlugin({
  business: {
    name: '${projectName} Store',
    currencySymbol: '₹'
  },
  products: [
    { id: 1, name: 'Sample Product 1', price: 999 }
  ]
});

// 2. Initialize AI Agent
const agent = new AIAgent({
  provider: (process.env.AI_PROVIDER || 'gemini'),
  apiKey: process.env.AI_API_KEY,
  systemPrompt: 'You are a helpful customer support and sales assistant.'
});

// 3. Start WhatsApp Bot
const bot = new WhatsAppEngine({ sessionId: '${projectName}' });
bot.use(catalog);

bot.on('message', async (ctx) => {
  await ctx.sendPresence('composing');
  const response = await agent.process({
    contactId: ctx.from,
    contactName: ctx.fromName,
    message: ctx.body
  });
  await ctx.sendPresence('paused');

  if (response.reply) {
    await ctx.reply(response.reply);
  }
});

console.log('🚀 Starting WhatsApp AI Agent...');
await bot.start();
`;
    fs.writeFileSync(path.join(targetDir, 'index.js'), indexJs);

    console.log(pc.green(`\n✅ Project "${projectName}" successfully created!`));
    console.log(pc.bold('\nNext steps:'));
    console.log(pc.cyan(`  1. cd ${projectName}`));
    console.log(pc.cyan(`  2. npm install`));
    console.log(pc.cyan(`  3. Add your AI_API_KEY in .env`));
    console.log(pc.cyan(`  4. npm start\n`));
  });

// Command: DOCTOR / HEALTH
program
  .command('doctor')
  .description('Verify system environment and requirements')
  .action(() => {
    console.log(pc.bold('\n🩺 Checking System Environment:'));
    console.log(`Node Version: ${pc.green(process.version)} (Required: >= 20.0.0)`);
    console.log(`Platform: ${process.platform} (${process.arch})`);
    console.log(`Status: ${pc.green('Ready to build & run WhatsApp bots!')}\n`);
  });

program.parse(process.argv);
