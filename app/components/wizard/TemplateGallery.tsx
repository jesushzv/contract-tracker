import { CONTRACT_TEMPLATES } from "@/lib/mockData";
import { TemplateType } from "@/app/hooks/useContractWizard";

interface TemplateGalleryProps {
  selectedTemplate: TemplateType;
  onSelectTemplate: (template: TemplateType) => void;
}

export function TemplateGallery({ selectedTemplate, onSelectTemplate }: TemplateGalleryProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Selecciona una Plantilla de Servicio (Carga cláusulas predeterminadas)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(CONTRACT_TEMPLATES) as Array<keyof typeof CONTRACT_TEMPLATES>).map((key) => {
          const item = CONTRACT_TEMPLATES[key as TemplateType];
          const isSelected = selectedTemplate === key;
          return (
            <div
              key={key}
              onClick={() => onSelectTemplate(key as TemplateType)}
              className={`glass p-4 rounded-xl cursor-pointer transition-all text-left flex flex-col justify-between min-h-36 md:min-h-32 py-4 border-2! ${ isSelected ? "border-indigo-500! bg-indigo-500/5! shadow-md shadow-indigo-500/5 ring-2! ring-indigo-500/10!" : "border-slate-200! hover:border-slate-300 bg-white/40 " }`}
            >
              <h3 className="font-bold text-sm text-slate-800">{item.name}</h3>
              <p className="text-2xs text-slate-400 leading-normal mt-1">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
