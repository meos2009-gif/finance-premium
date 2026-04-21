export default function PremiumInput({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-300">{label}</label>
      <input
        {...props}
        className="bg-[#111] border border-[#333] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition"
      />
    </div>
  );
}
