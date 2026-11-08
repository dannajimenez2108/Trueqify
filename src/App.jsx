import { useState } from "react";
import "./App.css";

const normalizar = (valor) =>
  String(valor ?? "").trim().toLowerCase();

function leerGuardado(clave, inicial) {
  try {
    const valor = localStorage.getItem(clave);
    return valor ? JSON.parse(valor) : inicial;
  } catch {
    return inicial;
  }
}

// Compatibilidad con los nombres de campos de las versiones anteriores.
function correoUsuario(usuario) {
  return normalizar(usuario?.correo || usuario?.email);
}

function idUsuario(usuario) {
  return usuario?.id ?? usuario?.usuarioId ?? usuario?.userId ?? null;
}

function correoPropietario(producto) {
  return normalizar(
    producto?.ownerEmail ||
    producto?.propietario ||
    producto?.correoPropietario ||
    producto?.correoDueno ||
    producto?.emailPropietario
  );
}

function esDueno(producto, usuario) {
  if (!usuario) return false;

  const idActual = idUsuario(usuario);
  const idDueno =
    producto?.ownerId ??
    producto?.propietarioId ??
    producto?.usuarioId ??
    producto?.userId ??
    null;

  const correoActual = correoUsuario(usuario);
  const correoDueno = correoPropietario(producto);

  // Primero comparamos los identificadores si ambos existen.
  if (idActual != null && idDueno != null) {
    if (String(idActual) === String(idDueno)) return true;
  }

  // También comprobamos el correo guardado en el objeto.
  if (correoActual && correoDueno && correoActual === correoDueno) {
    return true;
  }

  return false;
}

const productosIniciales = [
  {
    id: "ejemplo-1",
    nombre: "Tomates frescos",
    categoria: "Alimentos",
    comunidad: "La Esperanza",
    descripcion: "Tomates recién cosechados para intercambiar.",
    estado: "Disponible",
    ownerId: null,
    ownerEmail: "",
    propietario: "",
  },
  {
    id: "ejemplo-2",
    nombre: "Silla de madera",
    categoria: "Hogar",
    comunidad: "El Progreso",
    descripcion: "Silla en buen estado para darle un nuevo uso.",
    estado: "Disponible",
    ownerId: null,
    ownerEmail: "",
    propietario: "",
  },
  {
    id: "ejemplo-3",
    nombre: "Verduras frescas",
    categoria: "Alimentos",
    comunidad: "La Esperanza",
    descripcion: "Verduras cultivadas en la comunidad.",
    estado: "Disponible",
    ownerId: null,
    ownerEmail: "",
    propietario: "",
  },
];

function Boton({ children, onClick, tipo = "principal", submit = false }) {
  return (
    <button
      type={submit ? "submit" : "button"}
      className={`boton boton-${tipo}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TarjetaProducto({ producto, usuarioActual, alSolicitar }) {
  const propio = esDueno(producto, usuarioActual);

  return (
    <article className="tarjeta-producto">
      <div className="producto-imagen">
        <span>{producto.categoria === "Alimentos" ? "🥬" : "🪑"}</span>
      </div>

      <div className="producto-contenido">
        <span className="etiqueta">{producto.categoria}</span>
        <h3>{producto.nombre}</h3>
        <p>{producto.descripcion}</p>
        <p><strong>Comunidad:</strong> {producto.comunidad}</p>
        <p><strong>Estado:</strong> {producto.estado}</p>

        {propio ? (
          <div className="aviso-propio">
            Este es tu objeto publicado.
          </div>
        ) : producto.estado !== "Disponible" ? (
          <div className="aviso-no-disponible">
            Este objeto ya no está disponible.
          </div>
        ) : (
          <Boton onClick={() => alSolicitar(producto)}>
            Solicitar intercambio
          </Boton>
        )}
      </div>
    </article>
  );
}

export default function App() {
  const [pantalla, setPantalla] = useState("inicio");

  const [usuarios, setUsuarios] = useState(() =>
    leerGuardado("trueqify_usuarios", [])
  );

  const [usuarioActual, setUsuarioActual] = useState(() =>
    leerGuardado("trueqify_usuario_actual", null)
  );

  const [productos, setProductos] = useState(() => {
    const guardados = leerGuardado("trueqify_productos", null);

    if (!Array.isArray(guardados)) return productosIniciales;

    return guardados;
  });

  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroComunidad, setFiltroComunidad] = useState("Todas");

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const [nombreProducto, setNombreProducto] = useState("");
  const [categoriaProducto, setCategoriaProducto] = useState("Alimentos");
  const [comunidadProducto, setComunidadProducto] =
    useState("La Esperanza");
  const [descripcionProducto, setDescripcionProducto] = useState("");

  function guardarUsuarios(lista) {
    setUsuarios(lista);
    localStorage.setItem("trueqify_usuarios", JSON.stringify(lista));
  }

  function guardarProductos(lista) {
    setProductos(lista);
    localStorage.setItem("trueqify_productos", JSON.stringify(lista));
  }

  function irA(destino) {
    setMensaje("");
    setPantalla(destino);
  }

  function registrarUsuario(evento) {
    evento.preventDefault();

    const nombreLimpio = nombre.trim();
    const correoLimpio = normalizar(correo);

    if (!nombreLimpio || !correoLimpio || !contrasena) {
      setMensaje("Completa todos los campos.");
      return;
    }

    if (
      usuarios.some((usuario) => correoUsuario(usuario) === correoLimpio)
    ) {
      setMensaje("Ese correo ya está registrado. Inicia sesión.");
      return;
    }

    const nuevoUsuario = {
      id: `usuario-${Date.now()}`,
      nombre: nombreLimpio,
      correo: correoLimpio,
      email: correoLimpio,
      contrasena,
    };

    guardarUsuarios([...usuarios, nuevoUsuario]);

    setNombre("");
    setCorreo("");
    setContrasena("");
    setMensaje("Cuenta creada. Ahora inicia sesión.");
    setPantalla("login");
  }

  function iniciarSesion(evento) {
    evento.preventDefault();

    const correoLimpio = normalizar(correo);

    const encontrado = usuarios.find(
      (usuario) =>
        correoUsuario(usuario) === correoLimpio &&
        usuario.contrasena === contrasena
    );

    if (!encontrado) {
      setMensaje("Correo o contraseña incorrectos.");
      return;
    }

    const sesion = {
      id: idUsuario(encontrado) ?? `usuario-${Date.now()}`,
      nombre: encontrado.nombre,
      correo: correoUsuario(encontrado),
      email: correoUsuario(encontrado),
    };

    setUsuarioActual(sesion);
    localStorage.setItem("trueqify_usuario_actual", JSON.stringify(sesion));

    setCorreo("");
    setContrasena("");
    setPantalla("inicio");
    setMensaje(`¡Bienvenido/a, ${sesion.nombre}!`);
  }

  function cerrarSesion() {
    setUsuarioActual(null);
    localStorage.removeItem("trueqify_usuario_actual");
    setPantalla("inicio");
    setMensaje("Has cerrado sesión.");
  }

  function publicarProducto(evento) {
    evento.preventDefault();

    if (!usuarioActual) {
      setMensaje("Inicia sesión para publicar un objeto.");
      setPantalla("login");
      return;
    }

    if (!nombreProducto.trim() || !descripcionProducto.trim()) {
      setMensaje("Completa el nombre y la descripción.");
      return;
    }

    const correoDueno = correoUsuario(usuarioActual);
    const idDueno = idUsuario(usuarioActual);

    const nuevoProducto = {
      id: `producto-${Date.now()}`,
      nombre: nombreProducto.trim(),
      categoria: categoriaProducto,
      comunidad: comunidadProducto,
      descripcion: descripcionProducto.trim(),
      estado: "Disponible",

      // Guardamos los datos del propietario con varios nombres compatibles.
      ownerId: idDueno,
      propietarioId: idDueno,
      usuarioId: idDueno,
      ownerEmail: correoDueno,
      propietario: correoDueno,
      correoPropietario: correoDueno,
    };

    guardarProductos([nuevoProducto, ...productos]);

    setNombreProducto("");
    setDescripcionProducto("");
    setCategoriaProducto("Alimentos");
    setComunidadProducto("La Esperanza");

    setMensaje("Objeto publicado correctamente.");
    setPantalla("catalogo");
  }

  function solicitarIntercambio(producto) {
    if (!usuarioActual) {
      setMensaje("Inicia sesión para solicitar un intercambio.");
      setPantalla("login");
      return;
    }

    // Segunda comprobación: nunca permitir una solicitud al propio objeto.
    if (esDueno(producto, usuarioActual)) {
      setMensaje("No puedes solicitar tu propio objeto.");
      return;
    }

    if (producto.estado !== "Disponible") {
      setMensaje("Este objeto ya no está disponible.");
      return;
    }

    const actualizados = productos.map((item) =>
      item.id === producto.id
        ? { ...item, estado: "Solicitud enviada" }
        : item
    );

    guardarProductos(actualizados);
    setMensaje(`Solicitud enviada para: ${producto.nombre}.`);
  }

const productosFiltrados = productos.filter((producto) => {
  const coincideNombre = String(producto.nombre ?? "")
    .toLowerCase()
    .includes(busqueda.trim().toLowerCase());

  const coincideCategoria =
    filtroCategoria === "Todas" ||
    producto.categoria === filtroCategoria;

  const coincideComunidad =
    filtroComunidad === "Todas" ||
    producto.comunidad === filtroComunidad;

  return coincideNombre && coincideCategoria && coincideComunidad;
});

  return (
    <div className="app">
      <header className="encabezado">
        <button className="logo" type="button" onClick={() => irA("inicio")}>
          <span className="logo-icono">♻</span>
          Trueqify
        </button>

        <nav className="navegacion">
          <button className="enlace-nav" onClick={() => irA("inicio")}>
            Inicio
          </button>
          <button className="enlace-nav" onClick={() => irA("catalogo")}>
            Catálogo
          </button>

          {usuarioActual ? (
            <>
              <button
                className="enlace-nav"
                onClick={() => irA("publicar")}
              >
                Publicar objeto
              </button>
              <span className="saludo">
                Hola, {usuarioActual.nombre}
              </span>
              <Boton tipo="secundario" onClick={cerrarSesion}>
                Cerrar sesión
              </Boton>
            </>
          ) : (
            <>
              <button className="enlace-nav" onClick={() => irA("login")}>
                Iniciar sesión
              </button>
              <Boton onClick={() => irA("registro")}>
                Crear cuenta
              </Boton>
            </>
          )}
        </nav>
      </header>

      <main>
        {mensaje && (
          <div className="mensaje" role="status">
            <span>{mensaje}</span>
            <button onClick={() => setMensaje("")} aria-label="Cerrar">
              ×
            </button>
          </div>
        )}

        {pantalla === "inicio" && (
          <>
            <section className="hero">
              <div className="hero-texto">
                <span className="etiqueta">Trueque entre comunidades</span>
                <h1>
                  Compartimos más.
                  <br />
                  <span>Necesitamos menos.</span>
                </h1>
                <p>
                  Trueqify conecta comunidades rurales para intercambiar
                  objetos y productos, ayudándonos entre todos sin usar dinero.
                </p>
                <div className="hero-botones">
                  <Boton onClick={() => irA("catalogo")}>
                    Explorar catálogo
                  </Boton>
                  {usuarioActual ? (
                    <Boton tipo="secundario" onClick={() => irA("publicar")}>
                      Publicar un objeto
                    </Boton>
                  ) : (
                    <Boton tipo="secundario" onClick={() => irA("registro")}>
                      Crear una cuenta
                    </Boton>
                  )}
                </div>
              </div>

              <div className="hero-ilustracion">
                <span>🌿</span>
                <span>📦 🤝</span>
                <p>Un objeto puede ser justo lo que alguien necesita.</p>
              </div>
            </section>

            <section className="seccion">
              <div className="titulo-seccion">
                <span className="etiqueta">Empieza aquí</span>
                <h2>¿Cómo funciona?</h2>
                <p>Intercambiar es sencillo cuando nos ayudamos.</p>
              </div>
              <div className="pasos">
                <article className="tarjeta-paso">
                  <span className="paso-icono">👤</span>
                  <h3>1. Crea tu cuenta</h3>
                  <p>Regístrate para participar en tu comunidad.</p>
                </article>
                <article className="tarjeta-paso">
                  <span className="paso-icono">🧺</span>
                  <h3>2. Publica o explora</h3>
                  <p>Ofrece algo o busca lo que necesitas.</p>
                </article>
                <article className="tarjeta-paso">
                  <span className="paso-icono">🤝</span>
                  <h3>3. Haz un intercambio</h3>
                  <p>Envía una solicitud por un objeto disponible.</p>
                </article>
              </div>
            </section>
          </>
        )}

        {pantalla === "catalogo" && (
          <section className="seccion">
            <div className="titulo-seccion">
              <span className="etiqueta">Encuentra algo útil</span>
              <h1>Catálogo de objetos</h1>
              <p>Objetos compartidos por las comunidades.</p>
            </div>

            <div className="filtros">
              <input
                type="search"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="Todas">Todas las categorías</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Hogar">Hogar</option>
              </select>

              <select
  value={filtroComunidad}
  onChange={(e) => setFiltroComunidad(e.target.value)}
  aria-label="Filtrar por comunidad"
>
  <option value="Todas">Todas las comunidades</option>
  <option value="La Esperanza">La Esperanza</option>
  <option value="El Progreso">El Progreso</option>
</select>
            </div>
            {productosFiltrados.length ? (
              <div className="catalogo-grid">
                {productosFiltrados.map((producto) => (
                  <TarjetaProducto
                    key={producto.id}
                    producto={producto}
                    usuarioActual={usuarioActual}
                    alSolicitar={solicitarIntercambio}
                  />
                ))}
              </div>
            ) : (
              <div className="estado-vacio">
                <span>🔎</span>
                <h3>No encontramos objetos</h3>
                <p>Prueba con otro nombre o categoría.</p>
              </div>
            )}
          </section>
        )}

        {pantalla === "login" && (
          <section className="seccion formulario-seccion">
            <form className="formulario" onSubmit={iniciarSesion}>
              <span className="formulario-icono">🌱</span>
              <h1>Iniciar sesión</h1>
              <p>Entra a tu cuenta para continuar.</p>

              <label htmlFor="login-correo">Correo electrónico</label>
              <input
                id="login-correo"
                type="email"
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />

              <label htmlFor="login-clave">Contraseña</label>
              <input
                id="login-clave"
                type="password"
                autoComplete="current-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />

              <Boton submit>Entrar</Boton>

              <button
                type="button"
                className="enlace-formulario"
                onClick={() => irA("recuperar")}
              >
                ¿Olvidaste tu contraseña?
              </button>

              <p className="texto-formulario">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  className="enlace-formulario"
                  onClick={() => irA("registro")}
                >
                  Regístrate
                </button>
              </p>
            </form>
          </section>
        )}

        {pantalla === "registro" && (
          <section className="seccion formulario-seccion">
            <form className="formulario" onSubmit={registrarUsuario}>
              <span className="formulario-icono">🌱</span>
              <h1>Crear cuenta</h1>
              <p>Únete a una comunidad que comparte y reutiliza.</p>

              <label htmlFor="registro-nombre">Nombre completo</label>
              <input
                id="registro-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="name"
                required
              />

              <label htmlFor="registro-correo">Correo electrónico</label>
              <input
                id="registro-correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="email"
                required
              />

              <label htmlFor="registro-clave">Contraseña</label>
              <input
                id="registro-clave"
                type="password"
                minLength="4"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                autoComplete="new-password"
                required
              />

              <Boton submit>Crear mi cuenta</Boton>

              <p className="texto-formulario">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  className="enlace-formulario"
                  onClick={() => irA("login")}
                >
                  Inicia sesión
                </button>
              </p>
            </form>
          </section>
        )}

        {pantalla === "recuperar" && (
          <section className="seccion formulario-seccion">
            <div className="formulario">
              <span className="formulario-icono">🔑</span>
              <h1>Recuperar contraseña</h1>
              <p>
                Esta versión es una demostración y todavía no envía correos
                de recuperación.
              </p>
              <Boton onClick={() => irA("login")}>
                Volver a iniciar sesión
              </Boton>
            </div>
          </section>
        )}

        {pantalla === "publicar" && (
          <section className="seccion formulario-seccion">
            {usuarioActual ? (
              <form className="formulario" onSubmit={publicarProducto}>
                <span className="formulario-icono">🧺</span>
                <h1>Publicar un objeto</h1>
                <p>Comparte algo que pueda servirle a otra persona.</p>

                <label htmlFor="producto-nombre">Nombre del objeto</label>
                <input
                  id="producto-nombre"
                  value={nombreProducto}
                  onChange={(e) => setNombreProducto(e.target.value)}
                  required
                />

                <label htmlFor="producto-categoria">Categoría</label>
                <select
                  id="producto-categoria"
                  value={categoriaProducto}
                  onChange={(e) => setCategoriaProducto(e.target.value)}
                >
                  <option value="Alimentos">Alimentos</option>
                  <option value="Hogar">Hogar</option>
                </select>

                <label htmlFor="producto-comunidad">Comunidad</label>
                <select
                  id="producto-comunidad"
                  value={comunidadProducto}
                  onChange={(e) => setComunidadProducto(e.target.value)}
                >
                  <option value="La Esperanza">La Esperanza</option>
                  <option value="El Progreso">El Progreso</option>
                </select>

                <label htmlFor="producto-descripcion">Descripción</label>
                <textarea
                  id="producto-descripcion"
                  rows="4"
                  value={descripcionProducto}
                  onChange={(e) => setDescripcionProducto(e.target.value)}
                  required
                />

                <Boton submit>Publicar objeto</Boton>
              </form>
            ) : (
              <div className="formulario">
                <h1>Inicia sesión primero</h1>
                <p>Necesitas una cuenta para publicar.</p>
                <Boton onClick={() => irA("login")}>Iniciar sesión</Boton>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="pie-pagina">
        <div className="logo logo-pie">
          <span className="logo-icono">♻</span>
          Trueqify
        </div>
        <p>Intercambiamos objetos, fortalecemos comunidades.</p>
        <small>Proyecto académico SENA ADSO</small>
      </footer>
    </div>
  );
}