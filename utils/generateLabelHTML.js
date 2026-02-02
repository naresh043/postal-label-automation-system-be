const generateLabelHTML = (members) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />

<style>
  @page {
    size: A4;
    margin: 10mm;
  }

  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
  }

  .container {
    display: grid;
    grid-template-columns: repeat(2, 90mm);
    column-gap: 10mm;
    row-gap: 6mm; /* reduced */
  }

  .label {
    border: 0.4mm solid #000;
    border-radius: 1mm;
    padding: 3mm 5mm 2mm 5mm; /* bottom padding reduced */
    height: 27mm;            /* 🔴 KEY FIX */
    box-sizing: border-box;
    position: relative;

    display: flex;           /* 🔴 KEY FIX */
    flex-direction: column;
    justify-content: flex-start;

    break-inside: avoid;
    page-break-inside: avoid;
  }

  .code {
    position: absolute;
    top: 3mm;
    right: 5mm;
    font-size: 9.5pt;
  }

  .line {
    margin: 0;
    padding: 0;
    line-height: 1.1;        /* 🔴 tighter line spacing */
  }
</style>
</head>

<body>

<div class="container">
${members
  .map(
    (m) => `
  <div class="label">
    <div class="code">${m.labelCode}</div>

    <div class="line">SRI ${m.name}</div>
    <div class="line">${m.addressLine1 || ""}</div>
    <div class="line">${m.addressLine2 || ""}</div>
    <div class="line">${m.city || ""}-${m.pincode || ""}.</div>
  </div>
`,
  )
  .join("")}
</div>

</body>
</html>
`;
};

module.exports = generateLabelHTML;
