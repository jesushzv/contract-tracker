import { ClauseTemplate } from './types';

export const MOCK_CLAUSES: ClauseTemplate[] = [
  {
    id: 'mx-lft-independencia',
    category: 'general',
    title: 'Independencia Laboral (No Subordinación)',
    content: 'Las partes declaran expresamente que el Prestador de Servicios actuará con absoluta independencia técnica y organizativa. El presente acuerdo es de naturaleza estrictamente civil bajo el régimen de prestación de servicios profesionales independientes, por lo que no constituye una relación laboral, subordinación laboral, ni genera derechos laborales, de seguridad social (IMSS, INFONAVIT) o de reparto de utilidades (PTU) entre el Cliente y el Prestador de Servicios o sus colaboradores, conforme a la Ley Federal del Trabajo en México.'
  },
  {
    id: 'mx-intellectual-property',
    category: 'general',
    title: 'Propiedad Intelectual (Transferencia Tras Pago Total)',
    content: 'Los derechos patrimoniales de propiedad intelectual e industrial sobre los entregables y creaciones objeto de este contrato se transferirán de manera exclusiva al Cliente únicamente en el momento en que éste haya liquidado el 100% del monto total acordado. El Prestador de Servicios conservará los derechos morales correspondientes y la facultad de utilizar los entregables como parte de su portafolio profesional y promocional, salvo acuerdo de confidencialidad en contrario.'
  },
  {
    id: 'mx-payment-terms',
    category: 'general',
    title: 'Condiciones de Pago y Transferencia SPEI',
    content: 'El Cliente se compromete a liquidar cada hito/anticipo en los plazos fijados. Los pagos deberán realizarse mediante transferencia electrónica de fondos a la cuenta CLABE proporcionada por el Prestador de Servicios. Cualquier retraso en los pagos pactados devengará un interés moratorio del 5% mensual sobre la cantidad insoluta, y facultará al Prestador de Servicios a suspender de inmediato los trabajos hasta que la situación de pago se regularice.'
  },
  {
    id: 'mx-cancellation',
    category: 'general',
    title: 'Vigencia y Penalización por Cancelación',
    content: 'En caso de que el Cliente decida cancelar o dar por terminado el proyecto de forma anticipada y sin causa imputable al Prestador de Servicios, no habrá devolución de ningún anticipo (payment/milestone) previamente pagado. Adicionalmente, el Cliente vendrá obligado a cubrir el valor de los trabajos realizados hasta la fecha de notificación de cancelación, calculados de manera proporcional o de acuerdo con el hito en progreso.'
  },
  {
    id: 'dev-source-code',
    category: 'development',
    title: 'Acceso a Repositorios y Código Fuente',
    content: 'El Prestador de Servicios entregará y otorgará acceso completo al código fuente, bases de datos y configuraciones finales tras el recibo del pago total correspondiente al hito de entrega de producción. Durante el desarrollo, los repositorios de trabajo podrán ser propiedad y estar bajo control exclusivo del desarrollador.'
  },
  {
    id: 'design-revisions',
    category: 'design',
    title: 'Límite de Rondas de Retroalimentación/Revisiones',
    content: 'El costo del proyecto incluye un máximo de 2 (dos) rondas completas de revisiones y ajustes menores sobre los diseños presentados por cada hito. Rondas de revisiones adicionales, cambios estructurales fuera del alcance inicial o solicitudes extemporáneas se cotizarán por separado como tarifas adicionales de diseño por hora.'
  },
  {
    id: 'consulting-schedule',
    category: 'consulting',
    title: 'Disponibilidad y Agendamiento de Sesiones',
    content: 'Las sesiones de consultoría y asesoría serán agendadas con al menos 48 horas de anticipación. Las cancelaciones o reprogramaciones por parte del Cliente deberán notificarse con al menos 24 horas de antelación; de lo contrario, la sesión se considerará como impartida y descontada de la bolsa de horas acordada.'
  },
  {
    id: 'mx-electronic-signature',
    category: 'general',
    title: 'Consentimiento y Firma Electrónica (Código de Comercio)',
    content: 'Las partes acuerdan expresamente que la aceptación de este contrato mediante contraseña de un solo uso (OTP), casilla de confirmación electrónica, y la generación del sello criptográfico (hash SHA-256) en esta plataforma tienen la misma validez legal, eficacia y fuerza probatoria que una firma autógrafa, de conformidad con el Artículo 89 y demás relativos del Código de Comercio y el Código Civil Federal aplicable.'
  }
];

export const CONTRACT_TEMPLATES = {
  general: {
    name: 'Servicios Generales / Freelance',
    description: 'Ideal para proyectos freelance estándar de cualquier sector en México.',
    defaultClauses: ['mx-lft-independencia', 'mx-intellectual-property', 'mx-payment-terms', 'mx-cancellation', 'mx-electronic-signature']
  },
  design: {
    name: 'Diseño y Creativos',
    description: 'Especializado para diseñadores, ilustradores y creadores de contenido.',
    defaultClauses: ['mx-lft-independencia', 'mx-intellectual-property', 'mx-payment-terms', 'design-revisions', 'mx-cancellation', 'mx-electronic-signature']
  },
  development: {
    name: 'Desarrollo de Software / Devs',
    description: 'Para programadores, agencias web y desarrollo de productos digitales.',
    defaultClauses: ['mx-lft-independencia', 'mx-intellectual-property', 'dev-source-code', 'mx-payment-terms', 'mx-cancellation', 'mx-electronic-signature']
  },
  consulting: {
    name: 'Consultoría y Mentorías',
    description: 'Para consultores, asesores profesionales y coaches de negocios.',
    defaultClauses: ['mx-lft-independencia', 'mx-payment-terms', 'consulting-schedule', 'mx-cancellation', 'mx-electronic-signature']
  }
};
