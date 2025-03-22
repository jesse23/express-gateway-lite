# Express Gateway Lite

A lightweight Express-based gateway server with proxy and static file serving capabilities.

## Features

- Static file serving
- Proxy configuration
- Compression support
- Development server with hot reload
- Environment variable configuration
- CLI argument support

## Installation

```bash
npm install express-gateway-lite
```

## Usage

### As a Module

```javascript
import createServer from 'express-gateway-lite';

const app = createServer({
    path: './public',           // Path to serve static files from
    compression: true,          // Enable compression
    proxy: '/api=http://localhost:3001,/auth=http://localhost:3002'  // Proxy configuration
});

app.listen(4173);
```

### As a CLI Tool

```bash
# Basic usage
node src/index.mjs --path ./public --compression --port 3000

# With proxy configuration
node src/index.mjs --path ./public --proxy "/api=http://localhost:3001,/auth=http://localhost:3002"

# Development mode with hot reload
node src/index.mjs --path ./public --devServer
```

### Configuration

The server can be configured using environment variables, a `.env` file, or CLI arguments. CLI arguments take precedence over environment variables.

#### Environment Variables

Create a `.env` file in your project root:

```env
# Server Configuration
PORT=4173
STATIC_PATH=./public
COMPRESSION=true

# Proxy Configuration (comma-separated key=value pairs)
PROXY=/auth=http://localhost:3001,/api=http://localhost:3002,/components=http://localhost:3003

# Development Server
DEV_SERVER=false
NO_RELOAD=false

# Browser Launch (Windows only)
LAUNCH=false
```

#### CLI Arguments

- `--port, -p`: Port to listen on (default: 4173)
- `--path, -d`: Path to serve static files from
- `--compression, -c`: Enable compression
- `--proxy, -x`: Proxy configuration as comma-separated key=value pairs
- `--devServer, -d`: Enable development server with hot reload
- `--noReload, -n`: Disable hot reload in development server
- `--launch, -l`: Launch browser on Windows

### Proxy Configuration

The proxy configuration is specified as a comma-separated string of key-value pairs, where:
- Keys are the paths to proxy
- Values are the target URLs

Example:
```
/auth=http://localhost:3001,/api=http://localhost:3002,/components=http://localhost:3003
```

This will:
- Proxy `/auth/*` to `http://localhost:3001/*`
- Proxy `/api/*` to `http://localhost:3002/*`
- Proxy `/components/*` to `http://localhost:3003/*`

## License

ISC 