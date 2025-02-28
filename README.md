# Stock Market Analysis Dashboard

A web-based dashboard for visualizing and analyzing stock market indices data. Built with Node.js, Express.js, and Chart.js.

## Features

-  Interactive line charts for stock market indices
-  Real-time search functionality for indices
-  Multiple time period views (3M, 6M, 1Y)
-  Key statistics display (Latest Value, Change, % Change)
-  Smooth animations and transitions
-  Responsive design for all devices
-  Data caching for improved performance

## Tech Stack

- **Frontend:**
  - HTML5
  - CSS3 (Bootstrap 5)
  - JavaScript
  - Chart.js

- **Backend:**
  - Node.js
  - Express.js
  - CSV Parser


## Installation

 Clone the repository:
```bash
git clone <https://github.com/nishantsevak11/stock-app.git>

### Install Dependencies
Run the following command in the terminal:

```bash
npm install
```

### Place CSV Data File
Place your stock market data file as `dump.csv` in the root directory.

## Running the Server
To start the development server with auto-reload, run:

```bash
npm run dev
```

The application will be accessible at: [http://localhost:5000](http://localhost:5000)

## Project Structure
```
stock-market-analysis/
├── frontend/
│   └── index.html
├── dump.csv
├── index.js
├── package.json
└── README.md
```

## API Endpoints
### Get list of all available indices
```http
GET /api/indices
```

### Get historical data for a specific index
```http
GET /api/data/:index
```
- **:index** - Name of the stock market index

### Health Check Endpoint
```http
GET /api/health
```
