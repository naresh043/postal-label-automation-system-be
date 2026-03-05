const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "all_contacts_extracted (1).json"
);

const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

const labelMap = new Map();
const duplicates = [];
const missingLabelCode = [];

data.forEach((item, index) => {
  let raw = item.type;

  // normalize labelCode
  let labelCode =
    typeof raw === "string"
      ? raw.trim()
      : null;

  // treat invalid values as missing
  if (
    !labelCode ||
    labelCode.toLowerCase() === "null" ||
    labelCode.toLowerCase() === "undefined"
  ) {
    missingLabelCode.push({ index });
    return;
  }

  if (labelMap.has(labelCode)) {
    duplicates.push({
      labelCode,
      firstIndex: labelMap.get(labelCode),
      duplicateIndex: index,
    });
  } else {
    labelMap.set(labelCode, index);
  }
});

console.log("🔴 Missing labelCode:", missingLabelCode.length);
console.table(missingLabelCode.slice(0, 10));

console.log("🟠 Duplicate labelCode:", duplicates.length);
console.table(duplicates.slice(0, 10));

console.log(
  "🟢 Unique valid labelCodes:",
  labelMap.size
);