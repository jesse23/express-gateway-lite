# Express Gateway Lite

A lightweight Express-based gateway server with proxy and static file serving capabilities.

## Installation

```bash
npm install express-gateway-lite
```

## Usage

### As a Library

```javascript
import createServer from 'express-gateway-lite';

// Create a server instance
const app = createServer({
    path: './public',           // Path to serve static files from
    compression: true,          // Enable compression
    proxy: {                    // Proxy configuration
        '/api': 'http://api.example.com'
    }
});

// Start the server (Express-style)
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

### As a CLI Tool

The server can be configured using either a YAML file or CLI arguments. CLI arguments will override YAML settings.

```bash
# Using default config.yaml
node src/index.mjs

# Using custom config file
node src/index.mjs --config ./my-config.yaml

# Override config with CLI arguments
node src/index.mjs --port 8080 --compression

# All CLI options
node src/index.mjs --path ./public --compression --port 3000 --proxy '{"\/api":"http://api.example.com"}' --devServer --launch
```

### YAML Configuration

Create a `config.yaml` file to configure the server:

```yaml
# Port to listen on
port: 3000

# Path to serve static files from
path: ./public

# Enable compression
compression: true

# Proxy configuration
proxy:
  /api: http://api.example.com
  /auth: http://auth.example.com

# Development server settings
devServer: false
noReload: false

# Launch browser on Windows
launch: false
```

## API Reference

### createServer(options)

Creates an Express server with the specified configuration. Returns a standard Express application instance that you can use with Express's standard methods like `listen()`, `use()`, etc.

#### Options

- `path` (string): Path to serve static files from
- `compression` (boolean): Whether to enable compression
- `proxy` (Object|string): Proxy configuration map or JSON string

## License

ISC 