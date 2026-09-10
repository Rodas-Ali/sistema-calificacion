const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

module.exports = (db) => {

    // REGISTRO
    router.post("/register", async (req, res) => {
        try {
            const { carne, nombres, apellidos, correo, password } = req.body;

            if (!carne || !nombres || !apellidos || !correo || !password) {
                return res.status(400).json({
                    error: "Todos los campos son obligatorios"
                });
            }

            const [existentes] = await db.query(
                "SELECT id FROM usuarios WHERE carne = ? OR correo = ?",
                [carne, correo]
            );

            if (existentes.length > 0) {
                return res.status(400).json({
                    error: "El carné o correo ya está registrado"
                });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const [resultado] = await db.query(
                `INSERT INTO usuarios
                (carne, nombres, apellidos, correo, password)
                VALUES (?, ?, ?, ?, ?)`,
                [carne, nombres, apellidos, correo, passwordHash]
            );

            res.status(201).json({
                mensaje: "Usuario registrado correctamente",
                usuarioId: resultado.insertId
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Error al registrar usuario"
            });
        }
    });

    // LOGIN
    router.post("/login", async (req, res) => {
        try {
            const { correo, password } = req.body;

            if (!correo || !password) {
                return res.status(400).json({
                    error: "Correo y contraseña son obligatorios"
                });
            }

            const [usuarios] = await db.query(
                "SELECT * FROM usuarios WHERE correo = ?",
                [correo]
            );

            if (usuarios.length === 0) {
                return res.status(401).json({
                    error: "Correo o contraseña incorrectos"
                });
            }

            const usuario = usuarios[0];

            const passwordCorrecta = await bcrypt.compare(
                password,
                usuario.password
            );

            if (!passwordCorrecta) {
                return res.status(401).json({
                    error: "Correo o contraseña incorrectos"
                });
            }

            const token = jwt.sign(
                {
                    id: usuario.id,
                    carne: usuario.carne
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "2h"
                }
            );

            res.json({
                mensaje: "Inicio de sesión exitoso",
                token,
                usuario: {
                    id: usuario.id,
                    carne: usuario.carne,
                    nombres: usuario.nombres,
                    apellidos: usuario.apellidos,
                    correo: usuario.correo
                }
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Error al iniciar sesión"
            });
        }
    });

    return router;
};