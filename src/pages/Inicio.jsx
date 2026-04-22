export default function Inicio() {
  return (
    <div className="flex flex-col items-center justify-center text-white h-full text-center px-6">

      <h1 className="text-3xl font-bold text-[#facc15] mb-6">
        Bem-vindo ao Finance Clean
      </h1>

      <p className="text-gray-300 text-lg max-w-md mb-10">
        A tua aplicação premium para gerir receitas, despesas e relatórios de forma simples e elegante.
      </p>

      <a
        href="/dashboard"
        className="bg-[#facc15] text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition active:scale-95"
      >
        Entrar no Dashboard
      </a>
    </div>
  );
}
