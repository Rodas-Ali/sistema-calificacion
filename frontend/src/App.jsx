import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:3000/api";

function App() {
    const [usuario, setUsuario] = useState(() => {
        const guardado = localStorage.getItem("usuario");
        return guardado ? JSON.parse(guardado) : null;
    });

    const [modo, setModo] = useState("login");

    const [login, setLogin] = useState({
        correo: "",
        password: ""
    });

    const [registro, setRegistro] = useState({
        carne: "",
        nombres: "",
        apellidos: "",
        correo: "",
        password: ""
    });

    const [publicaciones, setPublicaciones] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [catedraticos, setCatedraticos] = useState([]);

    const [contenido, setContenido] = useState("");
    const [cursoSeleccionado, setCursoSeleccionado] = useState("");
    const [catedraticoSeleccionado, setCatedraticoSeleccionado] = useState("");

    const [comentarios, setComentarios] = useState({});
    const [nuevoComentario, setNuevoComentario] = useState({});

    const [perfil, setPerfil] = useState(null);
    const [cursosAprobados, setCursosAprobados] = useState([]);
    const [mostrarPerfil, setMostrarPerfil] = useState(false);

    const cargarDatos = async () => {
        try {
            const [pub, cursosRes, cat] = await Promise.all([
                axios.get(`${API}/publicaciones`),
                axios.get(`${API}/cursos`),
                axios.get(`${API}/catedraticos`)
            ]);

            setPublicaciones(pub.data);
            setCursos(cursosRes.data);
            setCatedraticos(cat.data);
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    useEffect(() => {
        if (usuario) {
            cargarDatos();
        }
    }, [usuario]);

    const iniciarSesion = async (e) => {
        e.preventDefault();

        try {
            const respuesta = await axios.post(
                `${API}/auth/login`,
                login
            );

            setUsuario(respuesta.data.usuario);

            localStorage.setItem(
                "usuario",
                JSON.stringify(respuesta.data.usuario)
            );

            localStorage.setItem("token", respuesta.data.token);
        } catch (error) {
            alert(
                error.response?.data?.error ||
                "Error al iniciar sesión"
            );
        }
    };

    const registrar = async (e) => {
        e.preventDefault();

        try {
            await axios.post(`${API}/auth/register`, registro);

            alert("Registro exitoso.");
            setModo("login");

            setRegistro({
                carne: "",
                nombres: "",
                apellidos: "",
                correo: "",
                password: ""
            });
        } catch (error) {
            alert(
                error.response?.data?.error ||
                "Error al registrarse"
            );
        }
    };

    const crearPublicacion = async (e) => {
        e.preventDefault();

        if (!contenido.trim()) {
            alert("Escribe el contenido de la publicación.");
            return;
        }

        try {
            await axios.post(`${API}/publicaciones`, {
                usuario_id: usuario.id,
                curso_id: cursoSeleccionado || null,
                catedratico_id: catedraticoSeleccionado || null,
                contenido
            });

            setContenido("");
            setCursoSeleccionado("");
            setCatedraticoSeleccionado("");

            cargarDatos();
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.error ||
                "No se pudo crear la publicación."
            );
        }
    };

    const cargarComentarios = async (id) => {
        try {
            const respuesta = await axios.get(
                `${API}/publicaciones/${id}/comentarios`
            );

            setComentarios((prev) => ({
                ...prev,
                [id]: respuesta.data
            }));
        } catch (error) {
            console.error(error);
            alert("No se pudieron cargar los comentarios.");
        }
    };

    const agregarComentario = async (id) => {
        const texto = nuevoComentario[id];

        if (!texto?.trim()) {
            return;
        }

        try {
            await axios.post(
                `${API}/publicaciones/${id}/comentarios`,
                {
                    usuario_id: usuario.id,
                    contenido: texto
                }
            );

            setNuevoComentario((prev) => ({
                ...prev,
                [id]: ""
            }));

            cargarComentarios(id);
        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.error ||
                "No se pudo agregar el comentario."
            );
        }
    };

    const cargarPerfil = async () => {
        // Mostrar inmediatamente los datos que ya tenemos
        setPerfil(usuario);
        setMostrarPerfil(true);

        // Intentar cargar información adicional
        try {
            const cursosRes = await axios.get(
                `${API}/usuarios/${usuario.id}/cursos`
            );

            setCursosAprobados(cursosRes.data);
        } catch (error) {
            console.error("No se pudieron cargar los cursos aprobados:", error);
            setCursosAprobados([]);
        }
    };

    const agregarCurso = async (e) => {
        const cursoId = e.target.value;

        if (!cursoId) return;

        try {
            await axios.post(
                `${API}/usuarios/${usuario.id}/cursos`,
                {
                    curso_id: cursoId
                }
            );

            cargarPerfil();
            e.target.value = "";
        } catch (error) {
            alert(
                error.response?.data?.error ||
                "Ese curso posiblemente ya está agregado."
            );
        }
    };

    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUsuario(null);
    };

    if (!usuario) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h1>Sistema de Calificación</h1>

                    {modo === "login" ? (
                        <>
                            <h2>Iniciar sesión</h2>

                            <form onSubmit={iniciarSesion}>
                                <input
                                    type="email"
                                    placeholder="Correo electrónico"
                                    value={login.correo}
                                    onChange={(e) =>
                                        setLogin({
                                            ...login,
                                            correo: e.target.value
                                        })
                                    }
                                    required
                                />

                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={login.password}
                                    onChange={(e) =>
                                        setLogin({
                                            ...login,
                                            password: e.target.value
                                        })
                                    }
                                    required
                                />

                                <button type="submit">
                                    Iniciar sesión
                                </button>
                            </form>

                            <p>
                                ¿No tienes cuenta?
                                <button
                                    className="link-button"
                                    onClick={() => setModo("registro")}
                                >
                                    Registrarte
                                </button>
                            </p>
                        </>
                    ) : (
                        <>
                            <h2>Crear cuenta</h2>

                            <form onSubmit={registrar}>
                                <input
                                    placeholder="Carné"
                                    value={registro.carne}
                                    onChange={(e) =>
                                        setRegistro({
                                            ...registro,
                                            carne: e.target.value
                                        })
                                    }
                                    required
                                />

                                <input
                                    placeholder="Nombres"
                                    value={registro.nombres}
                                    onChange={(e) =>
                                        setRegistro({
                                            ...registro,
                                            nombres: e.target.value
                                        })
                                    }
                                    required
                                />

                                <input
                                    placeholder="Apellidos"
                                    value={registro.apellidos}
                                    onChange={(e) =>
                                        setRegistro({
                                            ...registro,
                                            apellidos: e.target.value
                                        })
                                    }
                                    required
                                />

                                <input
                                    type="email"
                                    placeholder="Correo electrónico"
                                    value={registro.correo}
                                    onChange={(e) =>
                                        setRegistro({
                                            ...registro,
                                            correo: e.target.value
                                        })
                                    }
                                    required
                                />

                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={registro.password}
                                    onChange={(e) =>
                                        setRegistro({
                                            ...registro,
                                            password: e.target.value
                                        })
                                    }
                                    required
                                />

                                <button type="submit">
                                    Registrarse
                                </button>
                            </form>

                            <p>
                                ¿Ya tienes cuenta?
                                <button
                                    className="link-button"
                                    onClick={() => setModo("login")}
                                >
                                    Iniciar sesión
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <header>
                <h1>Sistema de Calificación de Cursos</h1>

                <div>
                    <button onClick={cargarPerfil}>
                        Mi perfil
                    </button>

                    <button onClick={cerrarSesion}>
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <main>
                {mostrarPerfil && perfil && (
                    <section className="card">
                        <h2>Mi perfil</h2>

                        <p>
                            <strong>Nombre:</strong>{" "}
                            {perfil.nombres} {perfil.apellidos}
                        </p>

                        <p>
                            <strong>Carné:</strong> {perfil.carne}
                        </p>

                        <p>
                            <strong>Correo:</strong> {perfil.correo}
                        </p>

                        <h3>Cursos aprobados</h3>

                        <select onChange={agregarCurso}>
                            <option value="">
                                Agregar curso aprobado
                            </option>

                            {cursos.map((curso) => (
                                <option
                                    key={curso.id}
                                    value={curso.id}
                                >
                                    {curso.codigo} - {curso.nombre}
                                </option>
                            ))}
                        </select>

                        {cursosAprobados.length === 0 ? (
                            <p>No hay cursos aprobados registrados.</p>
                        ) : (
                            cursosAprobados.map((curso) => (
                                <p key={curso.id}>
                                    {curso.codigo} - {curso.nombre} (
                                    {curso.creditos} créditos)
                                </p>
                            ))
                        )}
                    </section>
                )}

                <section className="card">
                    <h2>Publicar opinión</h2>

                    <form onSubmit={crearPublicacion}>
                        <select
                            value={cursoSeleccionado}
                            onChange={(e) =>
                                setCursoSeleccionado(e.target.value)
                            }
                        >
                            <option value="">
                                Seleccionar curso
                            </option>

                            {cursos.map((curso) => (
                                <option
                                    key={curso.id}
                                    value={curso.id}
                                >
                                    {curso.codigo} - {curso.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={catedraticoSeleccionado}
                            onChange={(e) =>
                                setCatedraticoSeleccionado(e.target.value)
                            }
                        >
                            <option value="">
                                Seleccionar catedrático
                            </option>

                            {catedraticos.map((cat) => (
                                <option
                                    key={cat.id}
                                    value={cat.id}
                                >
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>

                        <textarea
                            placeholder="Escribe tu opinión..."
                            value={contenido}
                            onChange={(e) =>
                                setContenido(e.target.value)
                            }
                        />

                        <button type="submit">
                            Publicar
                        </button>
                    </form>
                </section>

                <h2>Publicaciones recientes</h2>

                {publicaciones.length === 0 && (
                    <div className="card">
                        <p>No hay publicaciones todavía.</p>
                    </div>
                )}

                {publicaciones.map((pub) => (
                    <article className="card" key={pub.id}>
                        <h3>
                            {pub.nombres} {pub.apellidos}
                        </h3>

                        <p>
                            <strong>Curso:</strong>{" "}
                            {pub.curso || "No especificado"}
                        </p>

                        <p>
                            <strong>Catedrático:</strong>{" "}
                            {pub.catedratico || "No especificado"}
                        </p>

                        <p>{pub.contenido}</p>

                        <small>
                            {new Date(
                                pub.fecha_creacion
                            ).toLocaleString()}
                        </small>

                        <hr />

                        <button
                            onClick={() =>
                                cargarComentarios(pub.id)
                            }
                        >
                            Ver comentarios
                        </button>

                        {comentarios[pub.id] && (
                            <div className="comments">
                                {comentarios[pub.id].length === 0 ? (
                                    <p>
                                        No hay comentarios todavía.
                                    </p>
                                ) : (
                                    comentarios[pub.id].map(
                                        (comentario) => (
                                            <p key={comentario.id}>
                                                <strong>
                                                    {comentario.nombres}{" "}
                                                    {comentario.apellidos}:
                                                </strong>{" "}
                                                {comentario.contenido}
                                            </p>
                                        )
                                    )
                                )}

                                <input
                                    placeholder="Escribe un comentario..."
                                    value={
                                        nuevoComentario[pub.id] || ""
                                    }
                                    onChange={(e) =>
                                        setNuevoComentario({
                                            ...nuevoComentario,
                                            [pub.id]: e.target.value
                                        })
                                    }
                                />

                                <button
                                    onClick={() =>
                                        agregarComentario(pub.id)
                                    }
                                >
                                    Comentar
                                </button>
                            </div>
                        )}
                    </article>
                ))}
            </main>
        </div>
    );
}

export default App;