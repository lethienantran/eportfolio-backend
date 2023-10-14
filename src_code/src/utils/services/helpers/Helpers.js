function CapitalizeFirstLetter(str) {
    /** Check if the input is not a string or is an empty string */
    if (typeof str !== "string" || str.length === 0) {
      // Return the input unchanged
      return str;
    }
  
    /** Split the string into an array of words */
    const words = str.split(" ");
  
    /** Capitalize the first letter of the first word if it's not a number */
    if (words[0] && isNaN(words[0])) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
  
    /** Capitalize the first letter of each word after a space */
    for (let i = 1; i < words.length; i++) {
      if (!isNaN(words[i])) {
        continue; // Skip numbers
      }
      words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
  
    /** Join the words back into a string */
    return words.join(" ");
  }

  /** Exports the functions */
module.exports = {
    CapitalizeFirstLetter,
}