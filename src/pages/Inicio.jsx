export default function Inicio() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center px-6 relative">

      {/* FUNDO PREMIUM */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-black to-[#1a1a1a] opacity-90" />

      {/* CONTEÚDO */}
      <div className="relative z-10 flex flex-col items-center">

        <h1 className="text-4xl font-bold text-[#facc15] mb-4 drop-shadow-lg">
          Finance Clean
        </h1>

        <p className="text-gray-400 text-lg max-w-md leading-relaxed">
          Bem-vindo à tua área financeira premium.
        </p>

      </div>
    </div>
  );
}
