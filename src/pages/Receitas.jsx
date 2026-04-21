import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";
import PremiumTable from "../components/PremiumTable";

export default function Receitas() {
  function handleSubmit(e) {
    e.preventDefault();
    console.log("Receita guardada");
  }

  // EXEMPLO DE DADOS (depois vais substituir pelos dados reais do Supabase)
  const receitasExemplo = [
    { descricao: "Venda de produto", valor: "120€", data: "2026-04-20" },
    { descricao: "Serviço prestado", valor: "80€", data: "2026-04-19" },
  ];

  const colunas = [
    { key: "descricao", label: "Descrição" },
    { key: "valor", label: "Valor" },
    { key: "data", label: "Data" },
  ];

  return (
    <div className="text-white flex flex-col gap-10">

      {/* FORMULÁRIO PREMIUM */}
      <PremiumForm title="Adicionar Receita" onSubmit={handleSubmit}>
        <PremiumInput label="Descrição" type="text" required />
        <PremiumInput label="Valor (€)" type="number" step="0.01" required />
        <PremiumInput label="Data" type="date" required />
      </PremiumForm>

      {/* TABELA PREMIUM */}
      <PremiumTable columns={colunas} data={receitasExemplo} />
    </div>
  );
}
