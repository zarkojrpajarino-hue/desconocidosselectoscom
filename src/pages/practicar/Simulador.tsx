const Simulador = () => {
  return (
    <div className="w-full h-[calc(100vh-280px)] min-h-[600px]">
      <iframe
        src="/html/simulador.html"
        className="w-full h-full border-0 rounded-lg"
        title="Simulador de Ventas"
      />
    </div>
  );
};

export default Simulador;
