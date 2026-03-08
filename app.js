// cPanel Passenger Entry Point Wrapper
// Passenger requires exporting the Express app instance or explicitly binding to the provided process.env.PORT
// We require the compiled server file. We must wait for the async startServer to resolve if we were exporting it,
// but for cPanel, it's safer to just let the compiled script run the listen loop, ensuring we pass the correct PORT.

const serverPort = process.env.PORT || 3000;
process.env.PORT = serverPort;

require('./dist-server/server.js');
