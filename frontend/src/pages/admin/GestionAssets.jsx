import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/common/Button";
import { Upload, Grid, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { subirGrilla } from "../../api/gameBuilder";

const CATEGORIAS = [
  "animales","frutas","transporte","ropa","hogar",
  "emociones","fondos","palabras","colores","numeros","otros",
];

const BACKEND_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:3001/api").replace("/api", "");

const GestionAssets = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [paso, setPaso] = useState(1);

  // Paso 1
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categoria, setCategoria] = useState("animales");
  const [filas, setFilas] = useState(5);
  const [columnas, setColumnas] = useState(5);
  const [bordeExterior, setBordeExterior] = useState(0);
  const [separacion, setSeparacion] = useState(0);

  // Paso 2
  const [nombres, setNombres] = useState([]);

  // Paso 3
  const [resultado, setResultado] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setArchivo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSiguiente = () => {
    if (!archivo) return;
    const total = filas * columnas;
    setNombres(Array.from({ length: total }, (_, i) => nombres[i] || ""));
    setPaso(2);
  };

  const handleSubir = async () => {
    setSubiendo(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("archivo", archivo);
      fd.append("filas", filas);
      fd.append("columnas", columnas);
      fd.append("bordeExterior", bordeExterior);
      fd.append("separacion", separacion);
      fd.append("categoria", categoria);
      fd.append("nombres", JSON.stringify(nombres));
      const res = await subirGrilla(fd);
      setResultado(res.data);
      setPaso(3);
    } catch (err) {
      setError(err.response?.data?.error || "Error al procesar la grilla");
    } finally {
      setSubiendo(false);
    }
  };

  const handleReset = () => {
    setPaso(1);
    setArchivo(null);
    setPreview(null);
    setNombres([]);
    setResultado(null);
    setError(null);
  };

  const pasos = [
    { n: 1, label: "Configurar" },
    { n: 2, label: "Nombrar celdas" },
    { n: 3, label: "Resultado" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subir Grilla de Assets</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Sube una imagen en grilla y divídela automáticamente en assets individuales
        </p>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center gap-3 mb-8">
        {pasos.map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                paso > n
                  ? "bg-green-500 text-white"
                  : paso === n
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {paso > n ? <CheckCircle className="h-4 w-4" /> : n}
            </div>
            <span
              className={`text-sm font-medium ${
                paso >= n ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {label}
            </span>
            {i < pasos.length - 1 && (
              <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
            )}
          </div>
        ))}
      </div>

      {/* ── Paso 1: Configurar ── */}
      {paso === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Izquierda: controles */}
          <div className="space-y-4">
            {/* Upload */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                archivo
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-700/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); handleFileChange(e.dataTransfer.files[0]); }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              {archivo ? (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{archivo.name}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Haz clic o arrastra la imagen de grilla
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, WEBP — máx. 20 MB</p>
                </>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filas / Columnas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filas</label>
                <input
                  type="number" min="1" max="20"
                  value={filas}
                  onChange={(e) => setFilas(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Columnas</label>
                <input
                  type="number" min="1" max="20"
                  value={columnas}
                  onChange={(e) => setColumnas(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Borde exterior / Separación */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Borde exterior (px)
                </label>
                <input
                  type="number" min="0" max="500"
                  value={bordeExterior}
                  onChange={(e) => setBordeExterior(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Margen exterior uniforme</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Separación entre celdas (px)
                </label>
                <input
                  type="number" min="0" max="200"
                  value={separacion}
                  onChange={(e) => setSeparacion(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Gap entre filas y columnas</p>
              </div>
            </div>
          </div>

          {/* Derecha: preview con overlay */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vista previa ({filas} × {columnas} = {filas * columnas} celdas)
            </p>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                <img src={preview} alt="preview" className="w-full object-contain block" />
                {/* Overlay CSS grid */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columnas}, 1fr)`,
                    gridTemplateRows: `repeat(${filas}, 1fr)`,
                  }}
                >
                  {Array.from({ length: filas * columnas }).map((_, i) => (
                    <div
                      key={i}
                      className="border border-blue-400"
                      style={{ backgroundColor: "rgba(59,130,246,0.08)" }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <Grid className="h-12 w-12 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Sube una imagen para ver la vista previa
                  </p>
                </div>
              </div>
            )}
            {preview && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                El overlay es aproximado — los cortes reales usan las medidas exactas en píxeles
              </p>
            )}
          </div>

          <div className="lg:col-span-2 flex justify-end">
            <Button variant="primary" onClick={handleSiguiente} disabled={!archivo}>
              Siguiente: Nombrar celdas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Paso 2: Nombrar celdas ── */}
      {paso === 2 && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Asigna un nombre a cada celda. Se usará como nombre del archivo PNG generado.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
            Vacío → se genera automáticamente como <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">item_N</code>
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div
            className="grid gap-2 mb-6"
            style={{ gridTemplateColumns: `repeat(${Math.min(columnas, 10)}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: filas * columnas }).map((_, idx) => {
              const r = Math.floor(idx / columnas);
              const c = idx % columnas;
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-none">
                    F{r + 1} C{c + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`item_${idx + 1}`}
                    value={nombres[idx] || ""}
                    onChange={(e) => {
                      const nuevo = [...nombres];
                      nuevo[idx] = e.target.value;
                      setNombres(nuevo);
                    }}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-center"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => { setError(null); setPaso(1); }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Atrás
            </Button>
            <Button variant="primary" onClick={handleSubir} disabled={subiendo}>
              {subiendo ? "Procesando…" : "Subir y dividir"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Paso 3: Resultado ── */}
      {paso === 3 && resultado && (
        <div>
          <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 dark:text-green-400 font-medium">
              {resultado.total} assets creados en categoría{" "}
              <span className="font-bold">{resultado.categoria}</span>
            </p>
          </div>

          <div
            className="grid gap-4 mb-6"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}
          >
            {resultado.assets.map((asset) => (
              <div
                key={asset.idx}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
              >
                <img
                  src={BACKEND_URL + asset.url}
                  alt={asset.nombre}
                  className="w-full aspect-square object-contain bg-gray-50 dark:bg-gray-700 p-1"
                />
                <div className="px-2 py-1.5 text-center">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {asset.nombre}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    F{asset.fila + 1} C{asset.columna + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="primary" onClick={handleReset}>
              Subir otra grilla
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/game-builder")}>
              Ir al Game Builder
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GestionAssets;
