const appJson = require('./app.json');

const DEFAULT_API_URL = 'https://productcount.up.railway.app/api/v1';

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
    },
  },
};
