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

```bash
# Basic usage
node src/index.mjs --path ./public --port 3000

# With compression
node src/index.mjs --path ./public --compression --port 3000

# With proxy
node src/index.mjs --path ./public --proxy '{"\/api":"http://api.example.com"}' --port 3000

# With dev server
node src/index.mjs --path ./public --devServer --port 3000

# Launch browser automatically (Windows only)
node src/index.mjs --path ./public --launch --port 3000
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