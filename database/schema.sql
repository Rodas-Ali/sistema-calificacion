-- ============================================
-- SISTEMA DE CALIFICACIÓN DE CURSOS
-- Base de datos
-- ============================================

CREATE DATABASE IF NOT EXISTS sistema_calificacion
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sistema_calificacion;

-- ============================================
-- TABLA: usuarios
-- ============================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carne VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: catedraticos
-- ============================================

CREATE TABLE catedraticos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL
);

-- ============================================
-- TABLA: cursos
-- ============================================

CREATE TABLE cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    creditos INT NOT NULL DEFAULT 0
);

-- ============================================
-- TABLA: publicaciones
-- ============================================

CREATE TABLE publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    curso_id INT,
    catedratico_id INT,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    FOREIGN KEY (curso_id)
        REFERENCES cursos(id)
        ON DELETE SET NULL,

    FOREIGN KEY (catedratico_id)
        REFERENCES catedraticos(id)
        ON DELETE SET NULL
);

-- ============================================
-- TABLA: comentarios
-- ============================================

CREATE TABLE comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (publicacion_id)
        REFERENCES publicaciones(id)
        ON DELETE CASCADE,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- ============================================
-- TABLA: cursos_aprobados
-- ============================================

CREATE TABLE cursos_aprobados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    fecha_aprobacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    FOREIGN KEY (curso_id)
        REFERENCES cursos(id)
        ON DELETE CASCADE,

    UNIQUE (usuario_id, curso_id)
);

-- ============================================
-- DATOS INICIALES
-- ============================================

INSERT INTO cursos (codigo, nombre, creditos) VALUES
('IPC1', 'Introducción a la Programación y Computación 1', 5),
('IPC2', 'Introducción a la Programación y Computación 2', 5),
('MAT1', 'Matemática 1', 7),
('MAT2', 'Matemática 2', 7),
('FIS1', 'Física 1', 5);

INSERT INTO catedraticos (nombre) VALUES
('Catedrático de Ejemplo 1'),
('Catedrático de Ejemplo 2'),
('Catedrático de Ejemplo 3');