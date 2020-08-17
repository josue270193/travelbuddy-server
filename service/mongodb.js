const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}
let mongoClient;
const connect = () => {
  MongoClient.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then((client) => {
      console.log(`MongoDB Connection OK`);
      mongoClient = client.db(process.env.MONGO_DB);
    })
    .catch((err) => {
      console.log(`MongoDB Connection ERROR: ${err}`);
    });
};

const testConnection = async () => {
  try {
    const result = await mongoClient.command({ ping: 1 });
    console.log(`MongoDB OK: ${result}`);
  } catch (err) {
    console.log(`MongoDB ERROR: ${err}`);
  }
};

module.exports = {
  connect,
  testConnection,
};
