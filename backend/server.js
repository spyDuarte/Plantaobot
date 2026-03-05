import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const app = createApp();
const port = Number(process.env.PORT || 8080);

app.listen(port, () => {
  console.log(`[backend] PlantaoBot API listening on :${port}`);
});
