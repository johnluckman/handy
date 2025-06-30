import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API server is running' });
});

// Stock sync endpoint
app.post('/api/syncStock', async (req, res) => {
  try {
    console.log('Stock sync requested...');
    
    // Run the stock sync script
    const scriptPath = path.join(__dirname, 'syncCin7StockToSupabase.js');
    const child = spawn('node', [scriptPath], {
      stdio: 'pipe',
      cwd: __dirname
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Stock sync output:', data.toString());
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Stock sync error:', data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('Stock sync completed successfully');
        res.json({ 
          success: true, 
          message: 'Stock sync completed successfully',
          output: output
        });
      } else {
        console.error('Stock sync failed with code:', code);
        res.status(500).json({ 
          success: false, 
          message: 'Stock sync failed',
          error: errorOutput,
          code: code
        });
      }
    });

    child.on('error', (error) => {
      console.error('Failed to start stock sync script:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to start stock sync script',
        error: error.message
      });
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Product sync endpoint (for backward compatibility)
app.post('/api/syncCin7', async (req, res) => {
  try {
    console.log('Product sync requested...');
    
    // Run the product sync script
    const scriptPath = path.join(__dirname, 'syncCin7ProductsToSupabase.js');
    const child = spawn('node', [scriptPath], {
      stdio: 'pipe',
      cwd: __dirname
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Product sync output:', data.toString());
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Product sync error:', data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('Product sync completed successfully');
        res.json({ 
          success: true, 
          message: 'Product sync completed successfully',
          output: output
        });
      } else {
        console.error('Product sync failed with code:', code);
        res.status(500).json({ 
          success: false, 
          message: 'Product sync failed',
          error: errorOutput,
          code: code
        });
      }
    });

    child.on('error', (error) => {
      console.error('Failed to start product sync script:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to start product sync script',
        error: error.message
      });
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Stock sync: POST http://localhost:${PORT}/api/syncStock`);
  console.log(`Product sync: POST http://localhost:${PORT}/api/syncCin7`);
}); 