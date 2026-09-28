import express from 'express';
import cors from 'cors';
import userRoutes from '../routes/userRoutes';
import productsRoutes from '../routes/productsRoutes';

// arquivo server, necessário para inicializar o back-end

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', productsRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});