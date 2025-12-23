import { kafka } from './kafkaClient.mjs';
import { TOPICS } from './topics.mjs';

export const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka Producer connected');
};

export const emitGameEvent = async (event) => {
  try {
    await producer.send({
      topic: TOPICS.GAME_EVENTS,
      messages: [
        {
          key: event.gameId,
          value: JSON.stringify(event)
        }
      ]
    });
  } catch (err) {
    console.error('Kafka produce error:', err);
  }
};
