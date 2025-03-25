import express from 'express';
import debug from 'debug';
import process from 'process';
import yargs from 'yargs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import compression from 'compression';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

/*
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
*/

const debugApp = debug('app');

/**
 * Parses proxy configuration string into a map
 * @param {string} proxyStr - Comma-separated string of key=value pairs
 * @returns {Object} Proxy configuration map
 */
function parseProxyConfig(proxyStr) {
    if (!proxyStr) return {};
    
    return proxyStr.split(',')
        .map(pair => pair.trim())
        .filter(pair => pair)
        .reduce((acc, pair) => {
            const [key, value] = pair.split('=').map(s => s.trim());
            if (key && value) {
                acc[key] = value;
            }
            return acc;
        }, {});
}

/**
 * Loads configuration from environment variables and CLI arguments
 * @param {Object} cliArgs - CLI arguments
 * @returns {Object} Merged configuration
 */
function loadConfig(cliArgs) {
    // Load .env file if it exists
    dotenv.config();

    console.log('process.env.STATIC_PATH:', process.env.STATIC_PATH);

    // Environment variables with defaults
    const envConfig = {
        port: process.env.PORT || 4173,
        path: process.env.STATIC_PATH,
        compression: process.env.COMPRESSION === 'true',
        proxy: process.env.PROXY,
        devServer: process.env.DEV_SERVER === 'true',
        noReload: process.env.NO_RELOAD === 'true',
        launch: process.env.LAUNCH === 'true'
    };

    return {
        ...envConfig,
        ...cliArgs
    };
}

/**
 * Creates an Express server with the specified configuration
 * @param {Object} options - Server configuration options
 * @param {string} options.path - Path to serve static files from
 * @param {boolean} options.compression - Whether to enable compression
 * @param {string} options.proxy - Proxy configuration as comma-separated string
 * @returns {import('express').Application} Express application instance
 */
export default function createServer({ path, compression: enableCompression, proxy } = {}) {
    const app = express();
    app.disable('x-powered-by');

    // Setup proxy if configured
    if (proxy) {
        const proxyMap = parseProxyConfig(proxy);
        Object.entries(proxyMap).forEach(([key, value]) => {
            console.log('Setting up proxy:', key, '->', value);
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
        console.log('Setting up static file serving at:', path);
        app.use(express.static(path));
    }

    return app;
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { argv } = yargs(process.argv.slice(2))
        .option('port', {
            alias: 'p',
            type: 'number',
            description: 'Port to listen on',
            default: process.env.PORT || 4173
        });
        /*
        .option('path', {
            alias: 'd',
            type: 'string',
            description: 'Path to serve static files from'
        })
        .option('compression', {
            alias: 'c',
            type: 'boolean',
            description: 'Enable compression',
        })
        .option('proxy', {
            alias: 'x',
            type: 'string',
            description: 'Proxy configuration as comma-separated key=value pairs'
        })
        .option('devServer', {
            alias: 'd',
            type: 'boolean',
            description: 'Enable development server with hot reload',
            default: process.env.DEV_SERVER === 'true'
        })
        .option('noReload', {
            alias: 'n',
            type: 'boolean',
            description: 'Disable hot reload in development server',
            default: process.env.NO_RELOAD === 'true'
        })
        .option('launch', {
            alias: 'l',
            type: 'boolean',
            description: 'Launch browser on Windows',
            default: process.env.LAUNCH === 'true'
        });
        */

    const config = loadConfig(argv);
    console.log('Config:', config);
    const app = createServer({
        path: config.path,
        compression: config.compression,
        proxy: config.proxy
    });

    const port = config.port;
    const server = app.listen(port, async () => {
        const actualPort = server.address().port;
        debugApp(`Node JS Server Started at ${actualPort} `);
        console.info(`Node JS Server Started at ${actualPort} `);

        if (config.devServer) {
            try {
                const devServerModule = (await import('./devServer.mjs')).default;
                devServerModule(config.path, config.noReload, port, actualPort);
            } catch (error) {
                console.error('Failed to start dev server:', error);
            }
        }

        if (config.launch && process.platform === 'win32') {
            debugApp('Launching in browser');
            try {
                const { exec } = await import('child_process');
                exec(`start http://localhost:${actualPort}`);
            } catch (error) {
                console.error('Failed to launch browser:', error);
            }
        }
    });

    server.on('error', (error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
} 