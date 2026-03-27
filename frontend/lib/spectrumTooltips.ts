/**
 * spectrumTooltips.ts — Per-candidate political spectrum classification explanations.
 *
 * Displayed as a tooltip on the SpectrumBar component when the user hovers
 * (desktop) or taps (mobile) the spectrum indicator.
 */

export interface SpectrumTooltip {
  name: string;
  text: string;
}

export const SPECTRUM_TOOLTIPS: Readonly<Record<string, SpectrumTooltip>> = {
  "ivan-cepeda": {
    name: "Iván Cepeda",
    text: "Clasificado como izquierda por su defensa del Estado interventor, la reforma agraria redistributiva, la negociación con grupos armados y su oposición histórica al modelo de seguridad democrática.",
  },
  "abelardo-de-la-espriella": {
    name: "Abelardo de la Espriella",
    text: "Clasificado como derecha radical por su apoyo explícito a políticas de mano dura, rechazo total a negociaciones con la guerrilla, defensa del modelo económico liberal sin intervención estatal y retórica de confrontación directa con el petrismo.",
  },
  "sergio-fajardo": {
    name: "Sergio Fajardo",
    text: "Clasificado como centro por su historial de gestión pública técnica y apartidista, apoyo a la inversión privada con énfasis social, rechazo tanto al uribismo como al petrismo, y posición moderada en seguridad y economía.",
  },
  "paloma-valencia": {
    name: "Paloma Valencia",
    text: "Clasificada como centro-derecha por su pertenencia al Centro Democrático, defensa de la seguridad democrática, oposición a las reformas del gobierno Petro y apoyo a la inversión privada, aunque con un discurso más institucional que radical.",
  },
  "roy-barreras": {
    name: "Roy Barreras",
    text: "Clasificado como centro-izquierda por su apoyo a reformas sociales progresistas, participación en la mesa de paz con las FARC y alineación con causas sociales, manteniendo al mismo tiempo vínculos con sectores moderados y empresariales.",
  },
  "claudia-lopez": {
    name: "Claudia López",
    text: "Clasificada como centro por su independencia de los bloques tradicionales, defensa de reformas anticorrupción y ambientales, postura crítica tanto hacia Petro como hacia el uribismo, y gestión pragmática como alcaldesa de Bogotá.",
  },
};
