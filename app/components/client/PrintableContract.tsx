import React from 'react';
import { Contract, Profile } from "@/lib/types";
import { MOCK_CLAUSES } from "@/lib/mockData";

interface PrintableContractProps {
  contract: Contract;
  profile: Profile | null;
}

export function PrintableContract({ contract, profile }: PrintableContractProps) {
  const formatMoney = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const renderedClauses = contract.selectedClauses && contract.selectedClauses.length > 0
    ? MOCK_CLAUSES.filter(c => contract.selectedClauses?.includes(c.id))
    : MOCK_CLAUSES;

  return (
    <div className="hidden print:block font-serif text-black max-w-4xl mx-auto leading-relaxed text-sm">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">Contrato de Prestación de Servicios</h1>
        <p className="text-xs text-gray-500 font-mono">ID de Referencia: {contract.id}</p>
      </div>

      <div className="mb-10 text-justify">
        <p className="mb-4">
          Conste por el presente documento, el contrato de prestación de servicios profesionales que celebran, 
          por una parte <strong>{contract.beneficiaryName || "_______________________"}</strong>, 
          a quien en lo sucesivo se le denominará &quot;EL PRESTADOR&quot;, y por la otra parte 
          <strong> {contract.clientName}</strong>, a quien en lo sucesivo se le denominará &quot;EL CLIENTE&quot;, 
          al tenor de las siguientes declaraciones y cláusulas:
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4 border-b border-black pb-1">I. Declaraciones</h2>
        
        <div className="mb-4 text-justify">
          <p className="mb-2 font-bold">1. Declara EL PRESTADOR:</p>
          <ul className="list-disc pl-8 mb-4">
            {contract.freelancerRfc && (
              <li>Estar inscrito en el Registro Federal de Contribuyentes bajo el número: <strong>{contract.freelancerRfc}</strong>.</li>
            )}
            {contract.freelancerRegimen && (
              <li>Tributar bajo el régimen fiscal: {contract.freelancerRegimen}.</li>
            )}
            {contract.freelancerPostal && (
              <li>Tener su domicilio fiscal registrado con el código postal: {contract.freelancerPostal}.</li>
            )}
            <li>Contar con la capacidad técnica y económica para la realización de los servicios objeto de este contrato.</li>
          </ul>

          <p className="mb-2 font-bold">2. Declara EL CLIENTE:</p>
          <ul className="list-disc pl-8">
            <li>Llamarse como ha quedado plasmado en el proemio de este documento, y contar con el correo electrónico {contract.clientEmail} para oír y recibir notificaciones.</li>
            {contract.clientRfc && (
              <li>Estar inscrito en el Registro Federal de Contribuyentes bajo el número: <strong>{contract.clientRfc}</strong>.</li>
            )}
            {contract.clientRegimen && (
              <li>Tributar bajo el régimen fiscal: {contract.clientRegimen}.</li>
            )}
            {contract.clientPostal && (
              <li>Tener su domicilio fiscal registrado con el código postal: {contract.clientPostal}.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4 border-b border-black pb-1">II. Objeto y Alcance del Proyecto</h2>
        <div className="text-justify whitespace-pre-wrap pl-4 border-l-2 border-gray-300">
          {contract.scopeDescription}
        </div>
        <div className="mt-6">
          <p>
            <strong>Monto Total Acordado: </strong> 
            {formatMoney(contract.totalAmount, contract.currency)} {contract.currency}
          </p>
        </div>
      </div>

      <div className="mb-10 page-break-before-auto">
        <h2 className="text-lg font-bold mb-4 border-b border-black pb-1">III. Cláusulas Generales</h2>
        <div className="text-justify">
          {renderedClauses.map((clause, idx) => (
            <div key={clause.id} className="mb-4">
              <span className="font-bold mr-2">{idx + 1}. {clause.title}:</span>
              <span>{clause.content}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10 break-inside-avoid">
        <h2 className="text-lg font-bold mb-4 border-b border-black pb-1">IV. Sellos de Conformidad e Integridad</h2>
        
        {contract.contractHash && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200">
            <p className="font-bold text-sm mb-1">Sello de Integridad Criptográfica (SHA-256)</p>
            <p className="font-mono text-xs text-gray-600 break-all">{contract.contractHash}</p>
            <p className="text-xs text-gray-500 mt-2">
              Este código garantiza la inmutabilidad absoluta del acuerdo presente y las firmas recabadas. 
              Cualquier modificación posterior romperá la validez del hash.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-16 mt-16 text-center">
          <div>
            <div className="h-16 flex items-end justify-center mb-2">
              {contract.freelancerAcceptedAt ? (
                profile?.signatureUrl ? (
                  <img src={profile.signatureUrl} alt="Firma Freelancer" className="max-h-16 object-contain" />
                ) : (
                  <div className="text-xs font-mono text-gray-600">
                    [VALIDADO DIGITALMENTE]<br/>
                    {new Date(contract.freelancerAcceptedAt).toLocaleString('es-MX')}
                  </div>
                )
              ) : (
                <div className="text-gray-300 italic text-sm">Pendiente de firma</div>
              )}
            </div>
            <div className="border-t border-black pt-2">
              <p className="font-bold">{contract.beneficiaryName || "EL PRESTADOR"}</p>
              {contract.freelancerRfc && <p className="text-xs text-gray-600">RFC: {contract.freelancerRfc}</p>}
              <p className="text-xs">Prestador de Servicios</p>
              {contract.freelancerAcceptedIp && <p className="text-[10px] text-gray-500 mt-1">IP: {contract.freelancerAcceptedIp}</p>}
            </div>
          </div>

          <div>
            <div className="h-16 flex items-end justify-center mb-2">
              {contract.acceptedAt ? (
                <div className="text-xs font-mono text-gray-600">
                  [FIRMADO ELECTRÓNICAMENTE]<br/>
                  {new Date(contract.acceptedAt).toLocaleString('es-MX')}
                </div>
              ) : (
                <div className="text-gray-300 italic text-sm">Pendiente de firma</div>
              )}
            </div>
            <div className="border-t border-black pt-2">
              <p className="font-bold">{contract.acceptedByName || contract.clientName}</p>
              {contract.clientRfc && <p className="text-xs text-gray-600">RFC: {contract.clientRfc}</p>}
              <p className="text-xs">El Cliente</p>
              {contract.acceptedIp && <p className="text-[10px] text-gray-500 mt-1">IP: {contract.acceptedIp}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
