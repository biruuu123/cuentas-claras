import { createApp } from './app.ts';
import { config } from './config.ts';

createApp().listen(config.port, () => {
  console.log(`Cuentas Claras API escuchando en el puerto ${config.port}`);
});
