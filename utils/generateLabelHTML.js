const generateLabelHTML = (members) => {
  const LABELS_PER_PAGE = 12;
  let pagesHtml = "";

  for (let i = 0; i < members.length; i += LABELS_PER_PAGE) {
    const pageMembers = members.slice(i, i + LABELS_PER_PAGE);

    // Pad empty labels to always make 12
    while (pageMembers.length < LABELS_PER_PAGE) {
      pageMembers.push({});
    }

    let rows = "";

    for (let r = 0; r < 6; r++) {
      const left = pageMembers[r * 2];
      const right = pageMembers[r * 2 + 1];

      rows += `
        <tr>
          ${labelCell(left)}
          ${labelCell(right)}
        </tr>
      `;
    }

    pagesHtml += `
      <table class="page">
        ${rows}
      </table>
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
  margin: 0.6cm;
}

body {
  margin: 0;
  padding: 0;
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
}

/* ✅ ONE TABLE = ONE PAGE */
table.page {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0.6cm 0.15cm;
  page-break-before: always;
}

table.page:first-child {
  page-break-before: auto;
}

/* ✅ FIXED ROW HEIGHT */
table.page tr {
  height: 4.3cm;
}

/* ✅ CELL */
td.label-cell {
  width: 10cm;
  vertical-align: top;
}

/* ✅ LABEL */
.label {
  position: relative;
  width: 10cm;
  height: 4.3cm;
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

function labelCell(m = {}) {
  if (!m.name && !m.addressLine1 && !m.city) {
    return `<td class="label-cell"></td>`;
  }

  return `
    <td class="label-cell">
      <div class="label">
        <div class="code">${m.labelCode || ""}</div>
        <div class="line name">SRI ${m.name || ""}</div>
        <div class="line">${m.addressLine1 || ""}</div>
        <div class="line">${m.addressLine2 || ""}</div>
        <div class="line">${m.city || ""}${m.pincode ? " - " + m.pincode : ""}</div>
      </div>
    </td>
  `;
}

module.exports = generateLabelHTML;
