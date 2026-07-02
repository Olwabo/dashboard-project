let countryCode = "ZAF";

const countries = [
    { name: "South Africa", code: "ZAF" },
    { name: "United States", code: "USA" },
    { name: "Brazil", code: "BRA" },
    { name: "India", code: "IND" },
    { name: "Canada", code: "CAN" },
    { name: "Argentina", code: "ARG" },
    { name: "Australia", code: "AUS" },
    { name: "Belgium", code: "BEL" },
    { name: "Botswana", code: "BWA" },
    { name: "Cameroon", code: "CMR" },
    { name: "China", code: "CHN" },
    { name: "Denmark", code: "DNK" },
    { name: "Egypt", code: "EGY" },
    { name: "France", code: "FRA" },
    { name: "Germany", code: "DEU" },
    { name: "Ghana", code: "GHA" }
];

const letterSelect = document.getElementById("letterSelect");
const countrySelect = document.getElementById("countrySelect");

letterSelect.addEventListener("change", () => {
    const letter = letterSelect.value;

    // reset dropdown
    countrySelect.innerHTML = '<option value="">-- Select Country --</option>';

    if (!letter) return;

    const filtered = countries.filter(c =>
        c.name.startsWith(letter)
    );

    filtered.forEach(country => {
        const option = document.createElement("option");
        option.value = country.code;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
});

const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const chartsContainer = document.getElementById("charts");

// World Bank API endpoints
const indicators = {
    gdp: "NY.GDP.MKTP.CD",
    population: "SP.POP.TOTL",
    lifeExpectancy: "SP.DYN.LE00.IN"
};

// Fetch data from World Bank API
async function fetchData(indicator) {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&per_page=50`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Network error");
    }

    const data = await response.json();

    return data[1];
}

function formatData(apiData) {
    const years = [];
    const values = [];

    apiData.forEach(item => {
        if (item.value !== null) {
            years.push(item.date);
            values.push(item.value);
        }
    });

    return { years, values };
}

// Store chart instances to destroy them before creating new ones
let chartInstances = {};

async function createCharts() {
    try {
        loadingEl.style.display = "block";
        errorEl.hidden = true;
        chartsContainer.style.display = "grid";

        // Fetch all data
        const [gdpRaw, popRaw, lifeRaw] = await Promise.all([
            fetchData(indicators.gdp),
            fetchData(indicators.population),
            fetchData(indicators.lifeExpectancy)
        ]);

        // Format data
        const gdp = formatData(gdpRaw);
        const pop = formatData(popRaw);
        const life = formatData(lifeRaw);

        loadingEl.style.display = "none";

        // Destroy existing charts if they exist
        if (chartInstances.gdp) {
            chartInstances.gdp.destroy();
        }
        if (chartInstances.population) {
            chartInstances.population.destroy();
        }
        if (chartInstances.life) {
            chartInstances.life.destroy();
        }

        // GDP Chart
        chartInstances.gdp = new Chart(document.getElementById("gdpChart"), {
            type: "line",
            data: {
                labels: gdp.years,
                datasets: [{
                    label: "GDP (Current USD)",
                    data: gdp.values,
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59,130,246,0.1)",
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                                if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                                return value;
                            }
                        }
                    }
                }
            }
        });

        // Population Chart
        chartInstances.population = new Chart(document.getElementById("populationChart"), {
            type: "bar",
            data: {
                labels: pop.years,
                datasets: [{
                    label: "Population",
                    data: pop.values,
                    backgroundColor: "#10b981",
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                                if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                                return value;
                            }
                        }
                    }
                }
            }
        });

        // Life Expectancy Chart
        chartInstances.life = new Chart(document.getElementById("lifeChart"), {
            type: "line",
            data: {
                labels: life.years,
                datasets: [{
                    label: "Life Expectancy (Years)",
                    data: life.values,
                    borderColor: "#f59e0b",
                    backgroundColor: "rgba(245,158,11,0.1)",
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: "#f59e0b"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + ' years';
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error(error);
        loadingEl.style.display = "none";
        errorEl.hidden = false;
        chartsContainer.style.display = "none";
    }
}

document.getElementById("countrySelect").addEventListener("change", (e) => {
    countryCode = e.target.value;
    createCharts();
});

document.addEventListener("DOMContentLoaded", () => {
    createCharts();
});