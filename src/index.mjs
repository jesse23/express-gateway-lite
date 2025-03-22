import express from 'express';
import debug from 'debug';
import process from 'process';
import yargs from 'yargs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const debugApp = debug('app');

/**
 * Creates an Express server with the specified configuration
 * @param {Object} options - Server configuration options
 * @param {string} options.path - Path to serve static files from
 * @param {boolean} options.compression - Whether to enable compression
 * @param {Object} options.proxy - Proxy configuration map
 * @returns {import('express').Application} Express application instance
 */
export default function createServer({ path, compression: enableCompression, proxy } = {}) {
    const app = express();
    app.disable('x-powered-by');

    // Setup proxy if configured
    if (proxy) {
        const proxyMap = typeof proxy === 'string' ? JSON.parse(proxy) : proxy;
        Object.entries(proxyMap).forEach(([key, value]) => {
            console.log('key', key);
            app.use(key, createProxyMiddleware({
                target: value,
                changeOrigin: true,
            }));
        });
    }

    // Setup compression if enabled
    if (enableCompression) {
        app.use(compression({
            level: 9,
            memLevel: 9,
        }));
    }

    // Setup static file serving
    if (path) {
        app.use(express.static(path));
    }

    return app;
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { argv } = yargs(process.argv.slice(2));
    const app = createServer({
        path: argv.path,
        compression: argv.compression,
        proxy: argv.proxy
    });

    const port = argv.port || 4173;
    const server = app.listen(port, async () => {
        const actualPort = server.address().port;
        debugApp(`Node JS Server Started at ${actualPort} `);
        console.info(`Node JS Server Started at ${actualPort} `);

        if (argv.devServer) {
            try {
                const devServerModule = (await import('./devServer.mjs')).default;
                devServerModule(argv.path, argv.noReload, port, actualPort);
            } catch (error) {
                console.error('Failed to start dev server:', error);
            }
        }
    });

    server.on('error', (error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
} 