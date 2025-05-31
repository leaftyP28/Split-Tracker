const people = [];
const totals = {};
let historyLog = [];
let lastAction = null;

function addPerson() {
  const name = document.getElementById('nameInput').value.trim();
  if (name && !people.includes(name)) {
    people.push(name);
    totals[name] = 0;
    updatePeopleList();
    updateResults();
    document.getElementById('nameInput').value = '';
  }
}

function updatePeopleList() {
  const list = document.getElementById('peopleList');
  list.innerHTML = '<h3>Participants:</h3>';
  people.forEach(person => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" value="${person}"> ${person}`;
    list.appendChild(label);
  });
}

function toggleSelectAll() {
  const checked = document.getElementById('selectAll').checked;
  document.querySelectorAll('#peopleList input[type="checkbox"]').forEach(cb => cb.checked = checked);
}

function splitCost() {
  const amount = parseFloat(document.getElementById('amountInput').value);
  const description = document.getElementById('descInput').value.trim() || "No description";
  const checkboxes = document.querySelectorAll('#peopleList input[type="checkbox"]:checked');
  const selected = Array.from(checkboxes).map(cb => cb.value);
  if (isNaN(amount) || amount <= 0 || selected.length === 0) return;

  const split = amount / selected.length;
  const record = { description, amount, people: [...selected], split };

  selected.forEach(person => {
    totals[person] += split;
  });

  historyLog.push(record);
  lastAction = record;

  updateResults();
  updateHistory();
  document.getElementById('amountInput').value = '';
  document.getElementById('descInput').value = '';
  checkboxes.forEach(cb => cb.checked = false);
  document.getElementById('selectAll').checked = false;
}

function updateResults() {
  const results = document.getElementById('results');
  results.innerHTML = '<h3>Totals:</h3>';
  for (const [person, total] of Object.entries(totals)) {
    const p = document.createElement('p');
    p.textContent = `${person}: $${total.toFixed(2)}`;
    results.appendChild(p);
  }
}

function updateHistory() {
  const history = document.getElementById('history');
  history.innerHTML = '<h3>Expense History:</h3>';
  historyLog.forEach((entry, index) => {
    const p = document.createElement('p');
    p.textContent = `${index + 1}. ${entry.description} — $${entry.amount.toFixed(2)} split among ${entry.people.join(', ')}`;
    history.appendChild(p);
  });
}

function undoLast() {
  if (!lastAction) return;
  lastAction.people.forEach(person => {
    totals[person] -= lastAction.split;
  });
  historyLog.pop();
  lastAction = null;
  updateResults();
  updateHistory();
}

function resetAll() {
  people.forEach(p => totals[p] = 0);
  historyLog = [];
  lastAction = null;
  updateResults();
  updateHistory();
}

function exportData() {
  const data = { totals, history: historyLog };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'shared-spending-data.json');
}

function exportCSV() {
  let csv = 'Name,Total\n';
  for (const [person, total] of Object.entries(totals)) {
    csv += `${person},${total.toFixed(2)}\n`;
  }
  csv += '\nDescription,Amount,Participants\n';
  historyLog.forEach(h => {
    csv += `"${h.description}",${h.amount},${h.people.join(' & ')}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, 'shared-spending-data.csv');
}

function exportImage() {
  html2canvas(document.getElementById('tracker')).then(canvas => {
    canvas.toBlob(blob => downloadBlob(blob, 'shared-tracker.png'));
  });
}

function exportPDF() {
  html2canvas(document.getElementById('tracker')).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jspdf.jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save('shared-tracker.pdf');
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      Object.keys(data.totals).forEach(p => {
        if (!people.includes(p)) people.push(p);
        totals[p] = data.totals[p];
      });
      historyLog = data.history || [];
      updatePeopleList();
      updateResults();
      updateHistory();
    } catch (e) {
      alert('Invalid JSON file');
    }
  };
  reader.readAsText(file);
}

function shareViaEmail() {
  const emailBody = encodeURIComponent(`Hi,\n\nHere is our shared spending breakdown:\n\n` +
    Object.entries(totals).map(([name, amount]) => `${name}: $${amount.toFixed(2)}`).join('\n') +
    `\n\nExpense History:\n` +
    historyLog.map((h, i) => `${i + 1}. ${h.description} - $${h.amount} split among ${h.people.join(', ')}`).join('\n') +
    `\n\nGenerated by our Shared Spending Tracker!`);

  window.location.href = `mailto:?subject=Shared Expense Report&body=${emailBody}`;
}