import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();
// console.log("Kafka Brokers:", process.env.KAFKA_BROKERS," Username:", process.env.KAFKA_USERNAME," SSL_CA:", process.env.KAFKA_SSL_CA ,  process.env.KAFKA_PASSWORD );
export const kafka = new Kafka({
  clientId: 'connect4-backend',
  brokers: [process.env.KAFKA_BROKERS], // must be HOST:SASL_PORT
  ssl: {
    rejectUnauthorized: true,
    ca: [Buffer.from(process.env.KAFKA_SSL_CA, 'base64').toString('utf8')],
  },
  sasl: {
    mechanism: 'scram-sha-256', // kafkajs expects lowercase
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});
