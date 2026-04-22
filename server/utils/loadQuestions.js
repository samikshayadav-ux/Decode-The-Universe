import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load questions for a specific round from JSON file
 * @param {number} roundNumber - The round number (0, 1, 2, 3)
 * @returns {Array} Array of questions
 */
export const loadQuestions = (roundNumber) => {
  try {
    const dataDir = join(__dirname, '../data');
    let filePath;

    switch (roundNumber) {
      case 1:
        // filePath = join(dataDir, 'round0_questions.json');
        break;
      case 2:
        filePath = join(dataDir, 'round1_questions.json');
        break;
      case 3:
        filePath = join(dataDir, 'round3_clues.json');
        break;
      default:
        throw new Error(`No JSON data available for round ${roundNumber}`);
    }

    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    console.log(`[Utils] Loaded ${data.length} items for round ${roundNumber} from ${filePath}`);

    return data;
  } catch (error) {
    console.error(`[Utils] Error loading questions for round ${roundNumber}:`, error.message);
    throw new Error(`Failed to load questions for round ${roundNumber}: ${error.message}`);
  }
};

/**
 * Load clues for the final round (round 3)
 * @returns {Array} Array of clues
 */
export const loadClues = () => {
  return loadQuestions(3);
};

export default loadQuestions;
