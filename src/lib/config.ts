export interface CountryConfig {
  code: string;        // Code ISO ex: "BJ"
  name: string;        // Nom ex: "Bénin"
  dialCode: string;    // Indicatif international avec "+" ex: "+229"
  flagEmoji: string;   // "🇧🇯"
  phoneLength: number; // 10 chiffres pour le plan ARCEP Bénin
  regex: string;       // Regex de validation
  isDefault: boolean;  // Pays par défaut (Bénin)
  isActive: boolean;   // Ouvert à l'inscription
}

/**
 * SOURCE UNIQUE DE VÉRITÉ : PAYS AUTORISÉS
 */
export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: "BJ",
    name: "Bénin",
    dialCode: "+229",
    flagEmoji: "🇧🇯",
    phoneLength: 10,
    regex: "^\\+229(01)?[0-9]{8}$",
    isDefault: true,
    isActive: true,
  },
  {
    code: "TG",
    name: "Togo",
    dialCode: "+228",
    flagEmoji: "🇹🇬",
    phoneLength: 8,
    regex: "^\\+228[0-9]{8}$",
    isDefault: false,
    isActive: true,
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    dialCode: "+225",
    flagEmoji: "🇨🇮",
    phoneLength: 10,
    regex: "^\\+225[0-9]{10}$",
    isDefault: false,
    isActive: false,
  },
  {
    code: "NE",
    name: "Niger",
    dialCode: "+227",
    flagEmoji: "🇳🇪",
    phoneLength: 8,
    regex: "^\\+227[0-9]{8}$",
    isDefault: false,
    isActive: false,
  },
];

/**
 * Normalise et valide un numéro de téléphone au format strict E.164 (+229...)
 * Prend en compte le passage au plan à 10 chiffres au Bénin (préfixe 01).
 */
export function normalizePhoneNumber(rawPhone: string, defaultDialCode: string = "+229"): string {
  if (!rawPhone) {
    throw new Error("Le numéro de téléphone est obligatoire");
  }

  // Nettoyage des espaces, tirets, points et parenthèses
  let cleaned = rawPhone.replace(/[\s\-\.\(\)]/g, "");

  // Remplacement du 00 initial par +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.substring(2);
  }

  // Cas spécifique Bénin (+229)
  if (defaultDialCode === "+229") {
    // Si l'utilisateur saisit sans indicatif international (ex: "0197123456" ou "97123456")
    if (!cleaned.startsWith("+")) {
      if (cleaned.startsWith("229")) {
        cleaned = "+" + cleaned;
      } else {
        // Si ancien format 8 chiffres (ex: 97123456), on ajoute le préfixe ARCEP "01"
        if (cleaned.length === 8) {
          cleaned = "01" + cleaned;
        }
        cleaned = `+229${cleaned}`;
      }
    } else if (cleaned.startsWith("+229")) {
      // Si l'utilisateur a tapé +229 avec l'ancien format 8 chiffres (ex: +22997123456)
      const nationalPart = cleaned.substring(4);
      if (nationalPart.length === 8) {
        cleaned = `+22901${nationalPart}`;
      }
    }
  } else {
    if (!cleaned.startsWith("+")) {
      cleaned = `${defaultDialCode}${cleaned.replace(/^0+/, "")}`;
    }
  }

  // Validation par rapport au pays actif
  const matchedCountry = SUPPORTED_COUNTRIES.find(
    (c) => c.isActive && cleaned.startsWith(c.dialCode)
  );

  if (!matchedCountry) {
    throw new Error(`Indicatif pays non supporté ou fermé à l'inscription pour le numéro ${cleaned}`);
  }

  const phoneRegex = new RegExp(matchedCountry.regex);
  if (!phoneRegex.test(cleaned)) {
    throw new Error(
      `Format de numéro invalide pour ${matchedCountry.name}. Exemple attendu : ${matchedCountry.dialCode} 01 XX XX XX XX`
    );
  }

  return cleaned;
}
