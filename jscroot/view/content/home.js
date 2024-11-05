import {
  addCSSIn,
  setValue,
  setInner,
  addChild,
} from "https://cdn.jsdelivr.net/gh/jscroot/element@0.1.8/croot.js";
import { getCookie } from "https://cdn.jsdelivr.net/gh/jscroot/cookie@0.0.1/croot.js";
import {
  getJSON,
  putJSON,
  postJSON,
} from "https://cdn.jsdelivr.net/gh/jscroot/api@0.0.8/croot.js";
import { id, backend } from "../../url/config.js";
import * as Chart from "https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.js";

let tableTemplate = `
<td width="5%"><i class="fa fa-bell-o"></i></td>
<td>#TASKNAME#</td>
<td class="level-right">
<button class="button is-small is-primary" data-item="#TASKID#">#LABEL#</button>
</td>
`;

const token = getCookie("login");

// Contoh setelah memanggil getJSON dan mendapatkan data masing-masing kategori:
const todoCount = document.getElementById("bigtodo").textContent || 0;
const doingCount = document.getElementById("bigdoing").textContent || 0;
const doneCount = document.getElementById("bigdone").textContent || 0;
const poinCount = document.getElementById("bigpoin").textContent || 0;

initChart(todoCount, doingCount, doneCount, poinCount);

export async function main() {
  // Show loader and hide content initially
  document.getElementById("content").classList.add("hidden");
  document.querySelector(".loader-anim").classList.remove("hidden");

  // Fetch all required data
  try {
    await addCSSIn("assets/css/admin.css", id.content);
    await Promise.all([
      getJSON(backend.user.data, "login", getCookie("login"), getUserFunction),
      getJSON(backend.user.todo, "login", getCookie("login"), getUserTaskFunction),
      getJSON(backend.user.doing, "login", getCookie("login"), getUserDoingFunction),
      getJSON(backend.user.done, "login", getCookie("login"), getUserDoneFunction),
    ]);

    fetchFeedbackHistory();
    fetchCommitHistory();
    fetchProjectData(); // Fetch project data for the chart

    // Hide loader and show content after data is fetched
    document.getElementById("content").classList.remove("hidden");
    document.querySelector(".loader-anim").classList.add("hidden");
  } catch (error) {
    console.error("Data fetching failed:", error);
    // Optionally handle error
  }
}

function getUserFunction(result) {
  if (result.status !== 404) {
    const roundedPoin = Math.round(result.data.poin);
    
    // Ambil elemen dengan id "bigpoin" dan "poinIcon"
    const poinElement = document.getElementById("bigpoin");
    const poinIcon = document.getElementById("poinIcon");

    // Tampilkan ikon jika poin tersedia dan set poin text
    if (poinElement && poinIcon) {
      poinElement.textContent = ` ${roundedPoin}`; // Set nilai poin
      poinIcon.style.display = "inline"; // Tampilkan ikon
    }
  } else {
    redirect("/signup");
  }
}

function getUserTaskFunction(result) {
  setInner("list", ""); // Bersihkan daftar To Do
  const todoElement = document.getElementById("bigtodo");

  if (result.status === 200 && todoElement) {
    // Perbarui teks jumlah tugas
    todoElement.textContent = result.data.length.toString();

    // Isi daftar tugas
    result.data.forEach(isiTaskList);
  } else {
    // Jika tidak ada tugas, set ke 0
    todoElement.textContent = "0";
  }
}

function isiTaskList(value) {
  let content = tableTemplate
    .replace("#TASKNAME#", value.task)
    .replace("#TASKID#", value._id)
    .replace("#LABEL#", "Ambil");
  addChild("list", "tr", "", content);
  // Jalankan logika tambahan setelah addChild
  runAfterAddChild(value);
}

function runAfterAddChild(value) {
  // Temukan elemen tr yang baru saja ditambahkan
  const rows = document.getElementById("list").getElementsByTagName("tr");
  const lastRow = rows[rows.length - 1];

  // Contoh: Tambahkan event listener atau manipulasi DOM lainnya
  const button = lastRow.querySelector(".button");
  if (button) {
    button.addEventListener("click", () => {
      putJSON(
        backend.user.doing,
        "login",
        getCookie("login"),
        { _id: value._id },
        putTaskFunction
      );
    });
  }
}

function putTaskFunction(result) {
  if (result.status === 200) {
    getJSON(
      backend.user.todo,
      "login",
      getCookie("login"),
      getUserTaskFunction
    );
    getJSON(
      backend.user.doing,
      "login",
      getCookie("login"),
      getUserDoingFunction
    );
  }
}

function getUserDoingFunction(result) {
  setInner("doing", ""); // Bersihkan daftar Doing
  const doingElement = document.getElementById("bigdoing");

  if (result.status === 200 && doingElement) {
    // Perbarui teks status Doing
    doingElement.textContent = "OTW"; // Atau bisa juga menggunakan result.data.length.toString() jika ingin menunjukkan jumlah

    // Jika ada data tugas, tambahkan ke daftar Doing
    if (result.data && result.data.task) {
      let content = tableTemplate
        .replace("#TASKNAME#", result.data.task)
        .replace("#TASKID#", result.data._id)
        .replace("#LABEL#", "Beres");
      addChild("doing", "tr", "", content);
      // Jalankan logika tambahan setelah addChild
      runAfterAddChildDoing(result.data);
    }
  } else {
    // Jika tidak ada tugas, set ke 0
    doingElement.textContent = "0"; // Mengatur ulang jika tidak ada tugas
  }
}

function runAfterAddChildDoing(value) {
  // Temukan elemen tr yang baru saja ditambahkan
  const rows = document.getElementById("doing").getElementsByTagName("tr");
  const lastRow = rows[rows.length - 1];

  // Contoh: Tambahkan event listener atau manipulasi DOM lainnya
  const button = lastRow.querySelector(".button");
  if (button) {
    button.addEventListener("click", () => {
      postJSON(
        backend.user.done,
        "login",
        getCookie("login"),
        { _id: value._id },
        postTaskFunction
      );
    });
  }
}

function postTaskFunction(result) {
  if (result.status === 200) {
    getJSON(
      backend.user.done,
      "login",
      getCookie("login"),
      getUserDoneFunction
    );
    getJSON(
      backend.user.doing,
      "login",
      getCookie("login"),
      getUserDoingFunction
    );
  }
}

function getUserDoneFunction(result) {
  setInner("done", ""); // Bersihkan daftar Done
  const doneElement = document.getElementById("bigdone");

  if (result.status === 200 && doneElement) {
    // Perbarui teks status Done
    doneElement.textContent = "OK"; // Atau jika ingin menunjukkan jumlah tugas yang sudah selesai, gunakan result.data.length.toString()

    // Jika ada data tugas, tambahkan ke daftar Done
    if (result.data && result.data.task) {
      let content = tableTemplate
        .replace("#TASKNAME#", result.data.task)
        .replace("#TASKID#", result.data._id)
        .replace("#LABEL#", "Arsip");
      addChild("done", "tr", "", content);
    }
  } else {
    // Jika tidak ada tugas, set ke 0
    doneElement.textContent = "0"; // Mengatur ulang jika tidak ada tugas
  }
}

function fetchFeedbackHistory() {
  fetch(backend.ux.getReportData, {
    method: 'GET',
    headers: {
      'login': `${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    displayFeedbackHistory(data);
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });
}

// Function to display feedback history in the table
function displayFeedbackHistory(data) {
  const uxHistoryTable = document.getElementById('uxhistory');

  // Clear existing rows
  uxHistoryTable.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');

    // Solution column
    const solutionCell = document.createElement('td');
    solutionCell.textContent = item.solusi || 'No Solution Provided';
    row.appendChild(solutionCell);

    // Project Name column
    const projectNameCell = document.createElement('td');
    projectNameCell.textContent = item.projectName || 'No Project Name';
    row.appendChild(projectNameCell);

    // Username column
    const usernameCell = document.createElement('td');
    usernameCell.textContent = item.username || 'Anonymous';
    row.appendChild(usernameCell);

    // Add row to table
    uxHistoryTable.appendChild(row);
  });
}

// Fetch project data for the chart
async function fetchProjectData() {
  try {
    const response = await fetch('https://extapi.buxxed.me/stat/commit', {
      method: 'GET',
      headers: {
        'login': `${token}`, // Include token if necessary
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data); // Log the data to inspect its structure

    // Ensure that data.projects is an array
    if (Array.isArray(data.projects)) {
      initChart(data.projects); // Pass the projects data to the chart function
    } else {
      console.error('Expected data.projects to be an array, but got:', data.projects);
    }

  } catch (error) {
    console.error('Error fetching project data:', error);
  }
}



function initChart(projectData) {
  const ctx = document.getElementById("statusChart").getContext("2d");

  // Ensure projectData is an array
  if (!Array.isArray(projectData)) {
    console.error('projectData is not an array:', projectData);
    return; // Exit the function if the data is not valid
  }

  // Prepare data for the chart
  const labels = projectData.map(project => project.projectid || 'Unknown Project'); // Handle missing projectid
  const dataValues = projectData.map(project => project.count || 0); // Handle missing count

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Project Task Count",
        data: dataValues,
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(153, 102, 255, 0.6)"
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(153, 102, 255, 1)"
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Call this function in your main or where appropriate
main();
