import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import urlRoutes from './routes/urlRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Necessário em deploy atrás de proxy (Render, Railway etc.) para req.protocol retornar https
app.set('trust proxy', 1);

app.use(express.json());
// Arquivos estáticos antes das rotas, senão "/style.css" cairia em "/:code"
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/', urlRoutes);

app.listen(PORT, () => {
    console.log(`rotando em localhost:${PORT}`);    
});
