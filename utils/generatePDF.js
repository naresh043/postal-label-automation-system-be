module.exports = async function generatePDF(members, onProgress) {
  const total = members.length;

  for (let i = 0; i < members.length; i++) {
    // render label...
    const percent = Math.round(((i + 1) / total) * 100);
    onProgress?.(percent);
  }

  return "/absolute/path/to/generated.pdf";
};

