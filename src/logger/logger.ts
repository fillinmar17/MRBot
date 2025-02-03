import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  defaultMeta: { service: 'github-reminder' },
  transports: [
    new winston.transports.Console(),
  ],
});

export const userDescription = (discordId: string, githubUsername: string): string => {
  return `[Discord: ${discordId}, Github: ${githubUsername}]`;
}
