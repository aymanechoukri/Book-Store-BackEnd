import app from './router/app.js';

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`)
})