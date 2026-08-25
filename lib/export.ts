/**
 * Utilitaires pour l'exportation de données
 */

/**
 * Convertit un tableau d'objets en fichier CSV et déclenche le téléchargement.
 * @param data Le tableau d'objets à exporter
 * @param filename Le nom du fichier cible (ex: "rapport.csv")
 * @param columns (Optionnel) Un mapping des clés vers des noms de colonnes lisibles
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: Record<keyof T, string>
) {
  if (!data || data.length === 0) {
    alert("Aucune donnée à exporter.");
    return;
  }

  // Extraire les clés
  const keys = Object.keys(data[0]) as Array<keyof T>;
  
  // Générer la ligne d'en-tête
  const headerRow = keys.map(key => {
    const header = columns && columns[key] ? columns[key] : (key as string);
    // Échapper les guillemets et entourer de guillemets
    return `"${String(header).replace(/"/g, '""')}"`;
  }).join(",");

  // Générer les lignes de données
  const dataRows = data.map(row => {
    return keys.map(key => {
      let value: any = row[key];
      if (value === null || value === undefined) {
        value = "";
      }
      // Échapper les guillemets et entourer de guillemets
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",");
  });

  const csvContent = [headerRow, ...dataRows].join("\n");
  
  // Ajouter le BOM pour forcer Excel à lire en UTF-8
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
