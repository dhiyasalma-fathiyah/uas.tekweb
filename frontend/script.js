document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const searchButton = document.getElementById('searchButton');
    const weatherResultDisplay = document.getElementById('weatherResult'); // ID div utama untuk hasil cuaca
    const historyTableBody = document.querySelector('#historyTable tbody');

    // Elemen untuk ringkasan cuaca "Today"
    const todayTemp = document.getElementById('todayTemp');
    const todayIcon = document.getElementById('todayIcon');
    const todayCondition = document.getElementById('todayCondition');
    const todayDate = document.getElementById('todayDate');
    const todayRealfeel = document.getElementById('todayRealfeel');
    const todayHumidity = document.getElementById('todayHumidity');
    const todayUV = document.getElementById('todayUV');
    const todayCloudCover = document.getElementById('todayCloudCover');
    const todayVisibility = document.getElementById('todayVisibility');
    const todayWind = document.getElementById('todayWind');
    const currentLocationText = document.getElementById('currentLocationText'); // Untuk lokasi current di header

    const backendBaseUrl = 'http://localhost:3000';

    // Fungsi untuk memetakan kode ikon OpenWeatherMap ke kelas Font Awesome
    function getWeatherIconClass(iconCode) {
        switch (iconCode) {
            case '01d': return 'fas fa-sun'; // Clear sky day
            case '01n': return 'fas fa-moon'; // Clear sky night
            case '02d': return 'fas fa-cloud-sun'; // Few clouds day
            case '02n': return 'fas fa-cloud-moon'; // Few clouds night
            case '03d':
            case '03n': return 'fas fa-cloud'; // Scattered clouds
            case '04d':
            case '04n': return 'fas fa-cloud-meatball'; // Broken clouds (or fa-cloud-sun for more general)
            case '09d':
            case '09n': return 'fas fa-cloud-showers-heavy'; // Shower rain
            case '10d': return 'fas fa-cloud-sun-rain'; // Rain day
            case '10n': return 'fas fa-cloud-moon-rain'; // Rain night
            case '11d':
            case '11n': return 'fas fa-bolt'; // Thunderstorm
            case '13d':
            case '13n': return 'fas fa-snowflake'; // Snow
            case '50d':
            case '50n': return 'fas fa-smog'; // Mist/Fog/Haze
            default: return 'fas fa-cloud'; // Default
        }
    }

    // Fungsi untuk mengambil data cuaca
    async function fetchWeather(city) {
        weatherResultDisplay.innerHTML = '<p class="placeholder-text">Mencari cuaca...</p>';
        updateTodaySummaryPlaceholder(); // Reset Today summary saat mencari

        try {
            const response = await fetch(`${backendBaseUrl}/api/weather`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ city: city }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            displayWeather(data);
            displayTodaySummary(data); // Perbarui ringkasan "Today"
            fetchHistory(); // Perbarui riwayat
        } catch (error) {
            console.error('Error fetching weather:', error);
            weatherResultDisplay.innerHTML = `<p class="placeholder-text" style="color: red;">Gagal mengambil data cuaca: ${error.message}. Pastikan nama kota benar atau cek koneksi.</p>`;
            updateTodaySummaryPlaceholder(true); // Reset Today summary dengan pesan error
        }
    }

    // Fungsi untuk menampilkan data cuaca di panel kiri
    function displayWeather(data) {
        if (!data || !data.main || !data.weather || !data.name) {
            weatherResultDisplay.innerHTML = '<p class="placeholder-text" style="color: red;">Data cuaca tidak lengkap atau tidak ditemukan.</p>';
            return;
        }

        const temperature = data.main.temp;
        const condition = data.weather[0].description;
        const cityName = data.name;
        const iconCode = data.weather[0].icon;
        const iconClass = getWeatherIconClass(iconCode);

        // Update current location text in header
        currentLocationText.textContent = `Current Location: ${cityName}`;

        weatherResultDisplay.innerHTML = `
            <h3>${cityName}</h3>
            <p class="temperature-display">${Math.round(temperature)}°C</p>
            <p class="condition-display">${condition.charAt(0).toUpperCase() + condition.slice(1)} <i class="${iconClass}"></i></p>
            <div class="details-display">
                <p>Kelembaban: ${data.main.humidity}%</p>
                <p>Kecepatan Angin: ${data.wind.speed} m/s</p>
            </div>
        `;
    }

    // Fungsi untuk menampilkan ringkasan cuaca "Today" di panel kanan
    function displayTodaySummary(data) {
        if (!data || !data.main || !data.weather || !data.name) {
            updateTodaySummaryPlaceholder(true);
            return;
        }

        const temperature = data.main.temp;
        const feelsLike = data.main.feels_like;
        const description = data.weather[0].description;
        const iconCode = data.weather[0].icon;
        const iconClass = getWeatherIconClass(iconCode);

        todayTemp.textContent = `${Math.round(temperature)}°C`;
        // Hapus kelas ikon yang ada dan tambahkan yang baru
        todayIcon.className = ''; // Hapus semua kelas
        todayIcon.classList.add('weather-icon-today', ...iconClass.split(' ')); // Tambahkan kelas satu per satu

        todayCondition.textContent = description.charAt(0).toUpperCase() + description.slice(1);

        // Format tanggal: Monday, July 07
        const today = new Date();
        const options = { weekday: 'long', month: 'long', day: '2-digit' };
        todayDate.textContent = today.toLocaleDateString('en-US', options);

        todayRealfeel.textContent = `${Math.round(feelsLike)}°C`;
        todayHumidity.textContent = `${data.main.humidity}%`;
        todayWind.textContent = `${data.wind.speed} m/s`;

        // Untuk data yang mungkin tidak selalu tersedia dari API gratis atau perlu detail lain
        todayUV.textContent = data.uvi !== undefined ? data.uvi : '--'; // OpenWeatherMap free tier doesn't always provide UVI directly
        todayCloudCover.textContent = data.clouds && data.clouds.all !== undefined ? data.clouds.all + '%' : '--%';
        todayVisibility.textContent = data.visibility !== undefined ? (data.visibility / 1000).toFixed(1) + 'km' : '--km'; // Convert meters to km
    }

    // Fungsi untuk mengatur ulang ringkasan "Today" ke placeholder
    function updateTodaySummaryPlaceholder(isError = false) {
        todayTemp.textContent = '--°C';
        todayIcon.className = '';
        todayIcon.classList.add('weather-icon-today', 'fas', 'fa-cloud'); // Default generic cloud icon
        todayCondition.textContent = isError ? 'Error loading data' : 'Loading...';
        todayDate.textContent = '---, --- --';
        todayRealfeel.textContent = '--°C';
        todayHumidity.textContent = '--%';
        todayUV.textContent = '--';
        todayCloudCover.textContent = '--%';
        todayVisibility.textContent = '--km';
        todayWind.textContent = '-- m/s';
        currentLocationText.textContent = 'Current Location: Unknown';
    }

    // Fungsi untuk mengambil riwayat pencarian (colspan disesuaikan)
    async function fetchHistory() {
        historyTableBody.innerHTML = '<tr><td colspan="3">Memuat riwayat...</td></tr>'; // Sesuaikan colspan
        try {
            const response = await fetch(`${backendBaseUrl}/api/history`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            displayHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
            historyTableBody.innerHTML = `<tr><td colspan="4" style="color: red;">Gagal memuat riwayat: ${error.message}</td></tr>`; // Sesuaikan colspan
        }
    }

    // Fungsi untuk menampilkan riwayat pencarian (dengan tombol hapus)
    function displayHistory(history) {
        historyTableBody.innerHTML = '';
        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="3">Belum ada riwayat pencarian.</td></tr>'; // Sesuaikan colspan
            return;
        }

        history.forEach(item => {
            const row = historyTableBody.insertRow();
            row.insertCell(0).textContent = item.id;
            row.insertCell(1).textContent = item.nama_kota;
            row.insertCell(2).textContent = new Date(item.waktu_pencarian).toLocaleString('id-ID');
            // Kolom hapus dihilangkan
        });
    }

    // Fungsi handleDelete dihapus karena fitur hapus riwayat dihilangkan

    // Event Listener for Search Button
    searchButton.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        } else {
            alert('Silakan masukkan nama kota!');
        }
    });

    // Allow searching with Enter key
    cityInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });

    // Initial load: Fetch history and set initial placeholders for Today summary
    fetchHistory();
    updateTodaySummaryPlaceholder();
});