export default function PremiumForm({ title, children, onSubmit }) {
  return (
    <div className="max-w-xl mx-auto text-white">

      {/* TÍTULO PREMIUM */}
      <h1 className="text-2xl font-semibold mb-6 tracking-wide">
        {title}
      </h1>

      {/* FORMULÁRIO PREMIUM */}
      <form
        onSubmit={onSubmit}
        className="bg-[#1a1a1a] p-6 rounded-xl border border-[#222] shadow-lg flex flex-col gap-5"
      >
        {children}

        {/* BOTÃO PREMIUM */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 transition text-white font-semibold py-3 rounded-lg mt-2"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
