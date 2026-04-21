export default function Dashboard() {
  return (
    <div className="text-white">

      {/* TÍTULO PREMIUM */}
      <h1 className="text-3xl font-semibold mb-8 tracking-wide">
        Dashboard
      </h1>

      {/* GRID DE CARDS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CARD 1 */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#222] shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
          <p className="text-gray-400 text-sm">Total de Receitas</p>
          <h2 className="text-3xl font-bold mt-2">€ 0,00</h2>
        </div>

        {/* CARD 2 */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#222] shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
          <p className="text-gray-400 text-sm">Total de Despesas</p>
          <h2 className="text-3xl font-bold mt-2">€ 0,00</h2>
        </div>

        {/* CARD 3 */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#222] shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
          <p className="text-gray-400 text-sm">Saldo Atual</p>
          <h2 className="text-3xl font-bold mt-2">€ 0,00</h2>
        </div>

      </div>
    </div>
  );
}
