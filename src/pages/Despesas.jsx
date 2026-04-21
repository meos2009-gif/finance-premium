import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";

export default function Despesas() {
  function handleSubmit(e) {
    e.preventDefault();
    console.log("Despesa guardada");
  }

  return (
    <div className="text-white">
      <PremiumForm title="Adicionar Despesa" onSubmit={handleSubmit}>
        <PremiumInput label="Descrição" type="text" required />
        <PremiumInput label="Valor (€)" type="number" step="0.01" required />
        <PremiumInput label="Data" type="date" required />
      </PremiumForm>
    </div>
  );
}
