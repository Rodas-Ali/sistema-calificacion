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

//Endpoint 4: obtener catedráticos
app.get("/api/catedraticos", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT id, nombre FROM catedraticos ORDER BY nombre"
        );

        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al obtener catedráticos"
        });
    }
});

//Crear publicación
app.post("/api/publicaciones", async (req, res) => {
    try {
        const {
            usuario_id,
            curso_id,
            catedratico_id,
            contenido
        } = req.body;

        if (!usuario_id || !contenido) {
            return res.status(400).json({
                error: "El usuario y el contenido son obligatorios"
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO publicaciones
            (usuario_id, curso_id, catedratico_id, contenido)
            VALUES (?, ?, ?, ?)`,
            [
                usuario_id,
                curso_id || null,
                catedratico_id || null,
                contenido
            ]
        );

        res.status(201).json({
            mensaje: "Publicación creada correctamente",
            id: resultado.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al crear la publicación"
        });
    }
});

// Comentarios
app.get("/api/publicaciones/:id/comentarios", async (req, res) => {
    try {
        const { id } = req.params;

        const [comentarios] = await db.query(`
            SELECT
                comentarios.id,
                comentarios.contenido,
                comentarios.fecha_creacion,
                usuarios.nombres,
                usuarios.apellidos
            FROM comentarios
            INNER JOIN usuarios
                ON comentarios.usuario_id = usuarios.id
            WHERE comentarios.publicacion_id = ?
            ORDER BY comentarios.fecha_creacion ASC
        `, [id]);

        res.json(comentarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al obtener los comentarios"
        });
    }
});

// Crear comentarios
app.post("/api/publicaciones/:id/comentarios", async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id, contenido } = req.body;

        if (!usuario_id || !contenido) {
            return res.status(400).json({
                error: "El usuario y el contenido son obligatorios"
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO comentarios
            (publicacion_id, usuario_id, contenido)
            VALUES (?, ?, ?)`,
            [id, usuario_id, contenido]
        );

        res.status(201).json({
            mensaje: "Comentario creado correctamente",
            id: resultado.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al crear el comentario"
        });
    }
});

// Agregar curso aprobado a un usuario
app.post("/api/usuarios/:id/cursos", async (req, res) => {
    try {
        const { id } = req.params;
        const { curso_id } = req.body;

        if (!curso_id) {
            return res.status(400).json({
                error: "Debe seleccionar un curso"
            });
        }

        const [resultado] = await db.query(
            `INSERT INTO cursos_aprobados
            (usuario_id, curso_id)
            VALUES (?, ?)`,
            [id, curso_id]
        );

        res.status(201).json({
            mensaje: "Curso aprobado agregado correctamente",
            id: resultado.insertId
        });

    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                error: "Este curso ya está aprobado"
            });
        }

        res.status(500).json({
            error: "Error al agregar el curso aprobado"
        });
    }
});

// Obtener cursos aprobados de un usuario
app.get("/api/usuarios/:id/cursos", async (req, res) => {
    try {
        const { id } = req.params;

        const [cursos] = await db.query(`
            SELECT
                cursos.id,
                cursos.codigo,
                cursos.nombre,
                cursos.creditos
            FROM cursos_aprobados
            INNER JOIN cursos
                ON cursos_aprobados.curso_id = cursos.id
            WHERE cursos_aprobados.usuario_id = ?
            ORDER BY cursos.codigo
        `, [id]);

        res.json(cursos);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al obtener los cursos aprobados"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});