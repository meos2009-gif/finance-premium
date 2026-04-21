import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";

export default function Categorias() {
  function handleSubmit(e) {
    e.preventDefault();
    console.log("Categoria guardada");
  }

  return (
    <div className="text-white">
      <PremiumForm title="Adicionar Categoria" onSubmit={handleSubmit}>
        <PremiumInput label="Nome da Categoria" type="text" required />
      </PremiumForm>
    </div>
  );
}
