import React, { useState, useEffect } from "react";

const FLAG_COUNT = 15;
const KEYWORD = "flag";

const genCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
};

export default function Game3({ onComplete }) {
  const [codes] = useState(() => Array.from({ length: FLAG_COUNT }, genCode));
  const [foundIndices, setFoundIndices] = useState([]);
  const [visibleIndex, setVisibleIndex] = useState(null);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [searchWarning, setSearchWarning] = useState(false);

  // Block CTRL+F and browser search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchWarning(true);
        setTimeout(() => setSearchWarning(false), 3000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extended text with exactly 15 instances of the keyword
  const baseText = `
    The history of flags dates back to ancient civilizations where they were used as symbols. 
    The word flag originates from Old English referring to a piece of cloth. 
    In modern times, flags serve various purposes including national representation. 

    The study of flags examines their history, symbolism, and usage. 
    Every country has its own unique flag representing its culture. 
    The oldest national flag is that of Denmark from the 13th century. 

    Flags are typically rectangular but can come in various shapes. 
    The colors and patterns on flags often carry deep meanings. 
    For example, the flag of Japan features a red circle. 

    In maritime tradition, flags are crucial for communication. 
    The International Code assigns meanings to flag combinations. 
    During naval warfare, flags were vital for identification. 

    The largest flag was created in Romania measuring 349 meters. 
    The smallest flag was nanoscale, created in Switzerland. 
    Flags have been planted on the Moon during Apollo missions. 

    In computer science, flag refers to a signaling variable. 
    Digital flags indicate states or trigger events in code. 
    The concept derives from physical signaling systems. 

    Flags feature prominently in sports and competitions. 
    The Olympic Games feature a parade of nations' flags. 
    In racing, different colored flags convey messages. 

    The art of flag design follows specific principles. 
    A good flag should be simple yet meaningful. 
    Many cities and organizations have distinctive flags. 

    Some animals use flag-like displays for communication. 
    Deer raise tails as warning flags to others. 
    Some birds use feathers as visual signals. 

    The psychology examines flags' emotional impact. 
    Flags can inspire patriotism or controversy. 
    Flag desecration carries political statements. 

    In mathematics, flag varieties are geometric objects. 
    The term appears in various technical contexts. 
    This shows the concept's versatility. 

    Flags continue evolving with new technologies. 
    Digital flags appear in virtual spaces. 
    The fundamental purpose remains unchanged. 

    Collecting flags is a popular hobby worldwide. 
    Enthusiasts study flags from different eras. 
    Some historical flags are valuable items. 

    New flag forms may emerge in space exploration. 
    As we reach other planets, new designs will come. 
    Visual communication principles will endure. 

    Throughout history, the flag has been powerful. 
    From ancient standards to digital indicators, 
    the concept adapts while keeping core functions. 
    The appreciation of flags crosses all cultures.

    A nation's flag often becomes its most recognizable symbol. 

    The fluttering fabric squares hoisted atop poles during ceremonial events serve as more than just decorative textiles. These patterned cloth rectangles, when attached to vertical mounts, become powerful visual shorthand for collective identity. During international sporting competitions, you'll notice competitors gazing reverently at their nation's chosen color arrangement as it ascends the championship stand's upright support beam. Maritime vessels communicate through a complex system of patterned textile signals, each unique combination conveying specific navigational warnings. Even in the digital realm, these symbolic standards persist - tiny graphical representations of territorial allegiance appear next to usernames in online forums. The semiotic power of these rectangular emblems cannot be overstated, despite their simple construction from dyed fabric panels.
  `;

  // Insert exactly 15 flags in natural positions
  const words = baseText.split(/\s+/);
  const flagPositions = [];
  
  // First find natural occurrences
  words.forEach((word, index) => {
    if (word.toLowerCase() === KEYWORD.toLowerCase() && flagPositions.length < FLAG_COUNT) {
      flagPositions.push(index);
    }
  });
  
  // Ensure we have exactly FLAG_COUNT flags
  while (flagPositions.length < FLAG_COUNT) {
    // Find positions where we can naturally insert the keyword
    const insertPos = words.findIndex((word, index) => 
      !flagPositions.includes(index) && 
      word.toLowerCase().endsWith('s') && // Prefer plural words
      index > flagPositions[flagPositions.length-1] // Keep them spread out
    );
    
    if (insertPos !== -1) {
      flagPositions.push(insertPos);
    } else {
      // As last resort, add at the end
      flagPositions.push(words.length - 1);
    }
  }

  const onFlagClick = (index) => {
    if (foundIndices.includes(index)) return;
    setVisibleIndex((prev) => (prev === index ? null : index));
    setMessage("");
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Code copied to clipboard — paste it in the box on the right.");
    } catch (e) {
      setMessage("Could not copy automatically — select and copy the code manually.");
    }
  };

  const handleSubmit = () => {
    const c = input.trim().toUpperCase();
    if (!c) return setMessage("Enter a code first.");
    const index = codes.findIndex((cc) => cc === c);
    if (index === -1) {
      setMessage("❌ Invalid code.");
    } else if (foundIndices.includes(index)) {
      setMessage("⚠️ Code already submitted.");
    } else {
      setFoundIndices((prev) => [...prev, index]);
      setVisibleIndex(null);
      setMessage("✅ Code accepted!");
      if (foundIndices.length + 1 === FLAG_COUNT && typeof onComplete === "function") {
        setTimeout(() => onComplete(), 500);
      }
    }
    setInput("");
  };

  const isFound = (i) => foundIndices.includes(i);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans relative select-none">
      {/* Search warning */}
      {searchWarning && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-5 py-2 rounded-md z-50 shadow-lg">
          Search function disabled for this challenge!
        </div>
      )}
      
      {/* Left panel - text content */}
      <div className="w-3/4 p-10 overflow-y-auto max-h-screen">
        <h2 className="text-2xl font-bold mb-5">Historical Flags Encyclopedia</h2>
        <p className="text-gray-700 mb-6">
          This encyclopedia contains {FLAG_COUNT} hidden codes. Find all instances of the word 
          "<strong className="font-semibold">{KEYWORD}</strong>" in the text and click them to reveal codes. 
          The word appears exactly {FLAG_COUNT} times. Submit all codes to complete the challenge.
          <br /><br />
        </p>
        
        <div className="columns-2 gap-8">
          {words.map((word, wordIndex) => {
            const isFlag = flagPositions.includes(wordIndex);
            const flagIndex = isFlag ? flagPositions.indexOf(wordIndex) : null;
            const found = isFlag && isFound(flagIndex);
            
            return (
              <span key={`word-${wordIndex}`} className="whitespace-pre-wrap">
                {isFlag ? (
                  <span className="relative inline-block">
                    <span
                      onClick={() => onFlagClick(flagIndex)}
                      className={`inline cursor-default ${found ? 'text-green-600' : ''}`}
                    >
                      {word}
                      {found && " ✓"}
                    </span>
                    {visibleIndex === flagIndex && !found && (
                      <div className="absolute top-full left-0 z-10 bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap shadow-md">
                        {codes[flagIndex]}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyCode(codes[flagIndex]);
                          }}
                          className="ml-2 bg-transparent border border-gray-400 text-white px-2 py-0.5 rounded text-xs"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </span>
                ) : (
                  word
                )}{" "}
              </span>
            );
          })}
        </div>
      </div>

      {/* Right panel - code submission */}
      <div className="w-1/4 border-l border-gray-200 flex flex-col p-8 bg-white">
        <div className="w-full max-w-xs mt-15">
          <h3 className="text-xl font-semibold mb-5">Code Submission</h3>
          
          <input
            placeholder="Enter 6-character code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
            maxLength={6}
          />
          
          <button 
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded mb-4 transition-colors"
          >
            Submit Code
          </button>
          
          <div className="min-h-10 mb-4 text-sm">
            {message}
          </div>
          
          <div className="font-medium mb-4">
            Progress: {foundIndices.length}/{FLAG_COUNT} codes found
          </div>
          
          <div className="border border-gray-200 rounded p-3 max-h-72 overflow-y-auto">
            <h4 className="font-semibold mb-3">Found Codes:</h4>
            {foundIndices.length === 0 ? (
              <div className="text-gray-500">No codes submitted yet</div>
            ) : (
              foundIndices.map((idx) => (
                <div key={`found-${idx}`} className="py-2 border-b border-gray-100 last:border-0">
                  <div className="font-mono font-medium">{codes[idx]}</div>
                  <div className="text-xs text-gray-500">Code {idx + 1}</div>
                </div>
              ))
            )}
          </div>
          
          {foundIndices.length === FLAG_COUNT && (
            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded text-center">
              🎉 All codes found! Challenge complete!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}