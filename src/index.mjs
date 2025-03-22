import express from 'express';
import debug from 'debug';
import process from 'process';
import yargs from 'yargs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFileSync } from 'fs';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Loads configuration from YAML file and merges with CLI arguments
 * @param {string} configPath - Path to YAML config file
 * @param {Object} cliArgs - CLI arguments
 * @returns {Object} Merged configuration
 */
function loadConfig(configPath, cliArgs) {
    try {
        const yamlConfig = yaml.load(readFileSync(configPath, 'utf8'));
        return {
            ...yamlConfig,
            ...cliArgs
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            debugApp(`No config file found at ${configPath}, using CLI arguments only`);
            return cliArgs;
        }
        throw error;
    }
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
        app.use(express.static(path));
    }

    return app;
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { argv } = yargs(process.argv.slice(2))
        .option('config', {
            alias: 'c',
            type: 'string',
            description: 'Path to YAML config file',
            default: './config.yaml'
        });

    const config = loadConfig(argv.config, argv);
    const app = createServer({
        path: config.path,
        compression: config.compression,
        proxy: config.proxy
    });

    const port = config.port || 4173;
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