const dns = require('dns');
const mongoose = require('mongoose');

/** Local DNS proxies (127.0.0.1) often break Node SRV lookups needed by mongodb+srv. */
function fixLocalDnsForAtlas(uri) {
  if (!uri?.startsWith('mongodb+srv://')) return;

  const servers = dns.getServers();
  const hasLoopback = servers.some((s) => s === '127.0.0.1' || s === '::1');
  if (!hasLoopback) return;

  dns.setServers([
    '8.8.8.8',
    '1.1.1.1',
    ...servers.filter((s) => s !== '127.0.0.1' && s !== '::1'),
  ]);
}

const connectDB = async () => {
  // Reuse connection across warm serverless invocations
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const uri = process.env.MONGO_URI;
    fixLocalDnsForAtlas(uri);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
