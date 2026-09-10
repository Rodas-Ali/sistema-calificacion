require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const authRoutes = require("./auth")(db);
app.use("/api/auth", authRoutes);

// Ruta de prueba del servidor
app.get("/", (req, res) => {
    res.json({
        mensaje: "Servidor del Sistema de Calificación funcionando"
    });
});

// Endpoint 1: Obtener cursos
app.get("/api/cursos", async (req, res) => {
    try {
        const [cursos] = await db.query(
            "SELECT * FROM cursos ORDER BY nombre"
        );

        res.json(cursos);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al obtener los cursos"
        });
    }
});

// Endpoint 2: Obtener publicaciones
app.get("/api/publicaciones", async (req, res) => {
    try {
        const [publicaciones] = await db.query(`
            SELECT
                publicaciones.id,
                publicaciones.contenido,
                publicaciones.fecha_creacion,
                usuarios.nombres,
                usuarios.apellidos,
                cursos.nombre AS curso,
                catedraticos.nombre AS catedratico
            FROM publicaciones
            INNER JOIN usuarios
                ON publicaciones.usuario_id = usuarios.id
            LEFT JOIN cursos
                ON publicaciones.curso_id = cursos.id
            LEFT JOIN catedraticos
                ON publicaciones.catedratico_id = catedraticos.id
            ORDER BY publicaciones.fecha_creacion DESC
        `);

        res.json(publicaciones);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al obtener las publicaciones"
        });
    }
});

// Endpoint 3: Obtener usuarios
app.get("/api/usuarios", async (req, res) => {
    try {
        const [usuarios] = await db.query(`
            SELECT
                id,
                carne,
                nombres,
                apellidos,
                correo,
                fecha_registro
            FROM usuarios
        `);

        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al obtener los usuarios"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});