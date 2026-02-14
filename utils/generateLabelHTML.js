const generateLabelHTML = (members) => {
  const LABELS_PER_PAGE = 12;
  let pagesHtml = "";

  for (let i = 0; i < members.length; i += LABELS_PER_PAGE) {
    const pageMembers = members.slice(i, i + LABELS_PER_PAGE);
console.log(pageMembers[0].labelCode)
    pagesHtml += `
      <div class="page">
        ${pageMembers
          .map(
            (m) => `
          <div class="label">
            <div class="code">${m.labelCode || ""}</div>
            <div class="line name">SRI ${m.name || ""}</div>
            <div class="line">${m.addressLine1 || ""}</div>
            <div class="line">${m.addressLine2 || ""}</div>
            <div class="line">${m.city || ""} - ${m.pincode || ""}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />

<style>
  @page {
    size: A4;
    margin: 0.6cm;                 /* ✅ FIX */
  }

  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    margin: 0;
    padding: 0;
  }

.page {
  display: grid;
  grid-template-columns: repeat(2, 10cm);
  grid-template-rows: repeat(6, 4.4cm);
  column-gap: 0.6cm;
  row-gap: 0.2cm;
  page-break-after: always;
}

.label {
  position: relative; 
  width: 10cm;
  height: 4.4cm;
  border: 0.4mm solid #000;
  border-radius: 1mm;
  padding: 0.3cm 0.4cm;
  box-sizing: border-box;
  overflow: hidden;
}

  .code {
    position: absolute;
    top: 2mm;
    right: 3mm;
    font-size: 11pt;
    font-weight: bold;
  }

  .line {
    line-height: 1.2;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .name {
    font-weight: bold;
  }
</style>
</head>

<body>
  ${pagesHtml}
</body>
</html>
`;
};

module.exports = generateLabelHTML;