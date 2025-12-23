import { kafka } from './kafkaClient.mjs';
import { TOPICS } from './topics.mjs';
import { processGameEvent } from '../analytics/analyticsWorker.mjs';

const consumer = kafka.consumer({ groupId: 'analytics-group' });

export const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPICS.GAME_EVENTS });

  console.log('Kafka Consumer started');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      await processGameEvent(event);
    }
  });
};
