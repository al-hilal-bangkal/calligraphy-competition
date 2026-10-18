// ============================================================
// SCRIPT CEK RAPOR ONLINE
// ============================================================

// DOM Elements
const searchInput = document.getElementById('searchInput');
const btnCari = document.getElementById('btnCari');
const btnReset = document.getElementById('btnReset');
const resultContainer = document.getElementById('resultContainer');
const saranContainer = document.getElementById('saranContainer');

// ============================================================
// FUNGSI AUTOCOMPLETE / SARAN
// ============================================================

searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    if (query.length === 0) {
        saranContainer.style.display = 'none';
        return;
    }

    const results = dataSiswa.filter(s => 
        s.nis.toLowerCase().includes(query) || 
        s.nama.toLowerCase().includes(query)
    ).slice(0, 10); // maksimal 10 saran

    if (results.length === 0) {
        saranContainer.style.display = 'none';
        return;
    }

    let html = '';
    results.forEach(s => {
        html += `
            <div class="saran-item" data-nis="${s.nis}">
                <span class="nis">${s.nis}</span>
                <span class="nama">${s.nama}</span>
                <span class="kelas">${s.kelas}</span>
            </div>
        `;
    });
    saranContainer.innerHTML = html;
    saranContainer.style.display = 'block';

    // Event listener untuk klik saran
    saranContainer.querySelectorAll('.saran-item').forEach(item => {
        item.addEventListener('click', function() {
            const nis = this.dataset.nis;
            searchInput.value = nis;
            saranContainer.style.display = 'none';
            cariSiswa(nis);
        });
    });
});

// Sembunyikan saran saat klik di luar
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-box')) {
        saranContainer.style.display = 'none';
    }
});

// ============================================================
// FUNGSI CARI SISWA
// ============================================================

function cariSiswa(query) {
    if (!query || query.trim() === '') {
        resultContainer.style.display = 'none';
        return;
    }

    query = query.trim();
    let siswa = dataSiswa.find(s => 
        s.nis.toLowerCase() === query.toLowerCase() || 
        s.nama.toLowerCase() === query.toLowerCase()
    );

    if (!siswa) {
        // Coba cari sebagian (jika input bukan NIS atau nama lengkap)
        const results = dataSiswa.filter(s => 
            s.nis.toLowerCase().includes(query.toLowerCase()) || 
            s.nama.toLowerCase().includes(query.toLowerCase())
        );
        if (results.length === 1) {
            siswa = results[0];
        } else if (results.length > 1) {
            // Tampilkan daftar hasil
            let html = `<div class="alert alert-warning">Ditemukan ${results.length} siswa:</div>`;
            html += `<ul style="margin-left:20px;">`;
            results.forEach(s => {
                html += `<li><strong>${s.nis}</strong> - ${s.nama} (${s.kelas})</li>`;
            });
            html += `</ul><p>Silakan ketik NIS atau nama lengkap dengan lebih spesifik.</p>`;
            resultContainer.innerHTML = html;
            resultContainer.style.display = 'block';
            return;
        }
    }

    if (!siswa) {
        resultContainer.innerHTML = `<div class="alert alert-danger">❌ Siswa dengan NIS/Nama "${query}" tidak ditemukan.</div>`;
        resultContainer.style.display = 'block';
        return;
    }

    // Render rapor
    renderRapor(siswa);
}

// ============================================================
// FUNGSI RENDER RAPOR
// ============================================================

function renderRapor(s) {
    // Cari Kepala Madrasah dari data guru
    const kepala = dataGuru.find(g => g.jabatan && g.jabatan.toLowerCase() === 'kepala madrasah');
    const namaKepala = kepala ? kepala.nama : '_________________';

    // Cari Wali Kelas
    const wali = dataGuru.find(g => 
        g.jabatan && g.jabatan.toLowerCase() === 'wali kelas' && 
        g.kelas && g.kelas.toLowerCase() === s.kelas.toLowerCase()
    );
    const namaWali = wali ? wali.nama : '_________________';

    // ---- HITUNG PERINGKAT (Semester 1 & 2) ----
    // Ambil semua siswa sekelas dan setahun ajaran
    const siswaSekelas = dataSiswa.filter(sis => 
        sis.kelas === s.kelas && sis.tahunAjaran === s.tahunAjaran
    );

    // Fungsi hitung total nilai per semester
    function hitungTotalNilai(siswa, semester) {
        const sem = semester === 1 ? 'semester1' : 'semester2';
        const nilai = siswa.nilai?.[sem] || {};
        let total = 0;
        MAPEL_LIST.forEach(mapel => {
            const val = parseFloat(nilai[mapel]);
            if (!isNaN(val) && val !== '') total += val;
        });
        return total;
    }

    // Hitung peringkat semester 1
    let rank1 = '-';
    let rank2 = '-';
    let totalSiswa = siswaSekelas.length;

    if (totalSiswa > 0) {
        // Semester 1
        const sorted1 = [...siswaSekelas].sort((a, b) => {
            const totalA = hitungTotalNilai(a, 1);
            const totalB = hitungTotalNilai(b, 1);
            return totalB - totalA;
        });
        const posisi1 = sorted1.findIndex(sis => sis.nis === s.nis) + 1;
        rank1 = posisi1 > 0 ? posisi1 : '-';

        // Semester 2
        const sorted2 = [...siswaSekelas].sort((a, b) => {
            const totalA = hitungTotalNilai(a, 2);
            const totalB = hitungTotalNilai(b, 2);
            return totalB - totalA;
        });
        const posisi2 = sorted2.findIndex(sis => sis.nis === s.nis) + 1;
        rank2 = posisi2 > 0 ? posisi2 : '-';
    }

    // ---- FOTO SISWA ----
    const fotoSiswa = s.berkas?.fotoSiswa || '';
    const fotoHTML = fotoSiswa 
        ? `<img src="${fotoSiswa}" alt="Foto ${s.nama}" />`
        : `<div class="placeholder">Foto<br>Belum Ada</div>`;

    // ---- FOTO SISWA ----
/*    const fotoSiswa = s.berkas?.fotoSiswa || '';
    const fotoHTML = fotoSiswa 
        ? `<img src="${fotoSiswa}" style="width:120px; height:150px; object-fit:cover; border:2px solid #1abc9c; border-radius:8px; flex-shrink:0;" alt="Foto" />`
        : `<div style="width:120px; height:150px; border:2px dashed #ccc; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#999; font-size:12px; flex-shrink:0;">Foto<br>Belum Ada</div>`;
*/
    // ---- Tabel Nilai dengan Peringkat ----
    let nilaiRows = '';
    let totalNilaiS1 = 0;
    let totalNilaiS2 = 0;

    MAPEL_LIST.forEach((mapel, idx) => {
        const n1 = (s.nilai && s.nilai.semester1 && s.nilai.semester1[mapel] !== undefined && s.nilai.semester1[mapel] !== '') 
            ? s.nilai.semester1[mapel] 
            : '-';
        const n2 = (s.nilai && s.nilai.semester2 && s.nilai.semester2[mapel] !== undefined && s.nilai.semester2[mapel] !== '') 
            ? s.nilai.semester2[mapel] 
            : '-';
        
        if (!isNaN(parseFloat(n1))) totalNilaiS1 += parseFloat(n1);
        if (!isNaN(parseFloat(n2))) totalNilaiS2 += parseFloat(n2);
        
        nilaiRows += `
            <tr>
                <td>${idx + 1}</td>
                <td class="text-left">${mapel}</td>
                <td>${n1}</td>
                <td>${n2}</td>
            </tr>
        `;
    });

    // Baris Total + Peringkat
    nilaiRows += `
        <tr style="background:#f1f9f7; font-weight:bold;">
            <td colspan="2" style="text-align:right;">Jumlah Total</td>
            <td>${totalNilaiS1}</td>
            <td>${totalNilaiS2}</td>
        </tr>
        <tr style="background:#eaf2f8; font-weight:bold;">
            <td colspan="2" style="text-align:right;">Peringkat (dari ${totalSiswa} siswa)</td>
            <td>${rank1}</td>
            <td>${rank2}</td>
        </tr>
    `;

    // ---- Kehadiran ----
    const k1 = (s.kehadiran && s.kehadiran.semester1) ? s.kehadiran.semester1 : { hadir:0, sakit:0, izin:0, alpa:0 };
    const k2 = (s.kehadiran && s.kehadiran.semester2) ? s.kehadiran.semester2 : { hadir:0, sakit:0, izin:0, alpa:0 };

    // ---- Kepribadian ----
    const kep1 = (s.kepribadian && s.kepribadian.semester1) ? s.kepribadian.semester1 : { kelakuan:'', kerajinan:'', kebersihan:'' };
    const kep2 = (s.kepribadian && s.kepribadian.semester2) ? s.kepribadian.semester2 : { kelakuan:'', kerajinan:'', kebersihan:'' };

    // ---- Iuran ----
    const allIuran = loadIuranFromData(s.nis);
    let iuranRows = '';
    let totalIuran = 0;
    let totalLunas = 0;
    let totalBelum = 0;

    allIuran.forEach(item => {
        const statusClass = item.keterangan === 'Lunas' ? 'status-lunas' : 'status-belum';
        totalIuran += item.nominal;
        if (item.keterangan === 'Lunas') totalLunas += item.nominal;
        else totalBelum += item.nominal;
        iuranRows += `
            <tr>
                <td>${item.bulan}</td>
                <td>${item.namaIuran}</td>
                <td>Rp ${item.nominal.toLocaleString('id-ID')}</td>
                <td class="${statusClass}">${item.keterangan}</td>
            </tr>
        `;
    });

    if (iuranRows === '') {
        iuranRows = `<tr><td colspan="4" style="text-align:center; color:#999;">Belum ada data iuran.</td></tr>`;
    }

    // ---- HTML RAPOR ----
    const html = `
        <div class="rapor-header">
            <h1>RAPOR SANTRI</h1>
            <p>${dataMadrasah.nama || 'Madrasah Diniyah'}</p>
            <p>${dataMadrasah.alamat || ''}</p>
        </div>

        <!-- IDENTITAS + FOTO (Responsif) -->
        <div class="identitas-foto-wrapper">
            <table class="identitas">
                <tr>
                    <td class="label">NIS</td>
                    <td>${s.nis}</td>
                    <td class="label">Nama</td>
                    <td>${s.nama}</td>
                </tr>
                <tr>
                    <td class="label">Kelas</td>
                    <td>${s.kelas}</td>
                    <td class="label">Status</td>
                    <td>${s.status}</td>
                </tr>
                <tr>
                    <td class="label">Tahun Ajaran</td>
                    <td colspan="3">${s.tahunAjaran || '-'}</td>
                </tr>
                <tr>
                    <td class="label">Alamat</td>
                    <td colspan="3">${s.biodata?.alamat || '-'}</td>
                </tr>
            </table>
            <div class="foto-box">${fotoHTML}</div>
        </div>

    // ---- HTML RAPOR ----

        <!-- ORANG TUA -->
        <div class="table-wrapper-scroll">
        <div class="sub-judul">👪 Orang Tua</div>
        <table class="identitas">
            <tr>
                <td class="label">Ayah</td>
                <td>${s.ortu?.ayah || '-'}</td>
                <td class="label">Pekerjaan</td>
                <td>${s.ortu?.pekerjaanAyah || '-'}</td>
            </tr>
            <tr>
                <td class="label">Ibu</td>
                <td>${s.ortu?.ibu || '-'}</td>
                <td class="label">Pekerjaan</td>
                <td>${s.ortu?.pekerjaanIbu || '-'}</td>
            </tr>
            <tr>
                <td class="label">HP Ayah</td>
                <td>${s.ortu?.hpAyah || '-'}</td>
                <td class="label">HP Ibu</td>
                <td>${s.ortu?.hpIbu || '-'}</td>
            </tr>
            <tr>
                <td class="label">Alamat</td>
                <td colspan="3">${s.ortu?.alamat || '-'}</td>
            </tr>
        </table>
        </div>

        <!-- NILAI (dengan Peringkat) -->
        <div class="sub-judul">📝 Nilai Mata Pelajaran</div>
        <table class="table-rapor">
            <thead>
                <tr>
                    <th style="width:8%;">No</th>
                    <th style="width:52%;">Mata Pelajaran</th>
                    <th style="width:20%;">Semester 1</th>
                    <th style="width:20%;">Semester 2</th>
                </tr>
            </thead>
            <tbody>
                ${nilaiRows}
            </tbody>
        </table>

        <!-- KEHADIRAN -->
        <div class="sub-judul">📊 Kehadiran</div>
        <table class="table-rapor">
            <thead>
                <tr>
                    <th style="width:20%;">Keterangan</th>
                    <th style="width:40%;">Semester 1</th>
                    <th style="width:40%;">Semester 2</th>
                </tr>
            </thead>
            <tbody>
                <tr><td><strong>Hadir</strong></td><td>${k1.hadir} Hari</td><td>${k2.hadir} Hari</td></tr>
                <tr><td><strong>Sakit</strong></td><td>${k1.sakit} Hari</td><td>${k2.sakit} Hari</td></tr>
                <tr><td><strong>Izin</strong></td><td>${k1.izin} Hari</td><td>${k2.izin} Hari</td></tr>
                <tr><td><strong>Alpa</strong></td><td>${k1.alpa} Hari</td><td>${k2.alpa} Hari</td></tr>
            </tbody>
        </table>

        <!-- KEPRIBADIAN -->
        <div class="sub-judul">📌 Kepribadian</div>
        <table class="table-rapor">
            <thead>
                <tr>
                    <th style="width:20%;">Aspek</th>
                    <th style="width:40%;">Semester 1</th>
                    <th style="width:40%;">Semester 2</th>
                </tr>
            </thead>
            <tbody>
                <tr><td><strong>Kelakuan</strong></td><td>${kep1.kelakuan || '-'}</td><td>${kep2.kelakuan || '-'}</td></tr>
                <tr><td><strong>Kerajinan</strong></td><td>${kep1.kerajinan || '-'}</td><td>${kep2.kerajinan || '-'}</td></tr>
                <tr><td><strong>Kebersihan</strong></td><td>${kep1.kebersihan || '-'}</td><td>${kep2.kebersihan || '-'}</td></tr>
            </tbody>
        </table>

        <!-- IURAN -->
        <div class="sub-judul">💰 Riwayat Iuran</div>
        <table class="table-rapor">
            <thead>
                <tr>
                    <th style="width:25%;">Bulan</th>
                    <th style="width:35%;">Nama Iuran</th>
                    <th style="width:20%;">Nominal</th>
                    <th style="width:20%;">Keterangan</th>
                </tr>
            </thead>
            <tbody>
                ${iuranRows}
                ${allIuran.length > 0 ? `
                <tr style="background:#f1f9f7; font-weight:bold;">
                    <td colspan="2" style="text-align:right;">TOTAL</td>
                    <td>Rp ${totalIuran.toLocaleString('id-ID')}</td>
                    <td></td>
                </tr>
                <tr style="background:#d4edda; font-weight:bold; color:#27ae60;">
                    <td colspan="2" style="text-align:right;">TOTAL LUNAS</td>
                    <td>Rp ${totalLunas.toLocaleString('id-ID')}</td>
                    <td></td>
                </tr>
                <tr style="background:#f8d7da; font-weight:bold; color:#e74c3c;">
                    <td colspan="2" style="text-align:right;">TOTAL BELUM</td>
                    <td>Rp ${totalBelum.toLocaleString('id-ID')}</td>
                    <td></td>
                </tr>
                ` : ''}
            </tbody>
        </table>

        <!-- CATATAN -->
        <div class="sub-judul">📌 Catatan Khusus</div>
        <p style="padding:10px; border:1px solid #000; min-height:40px; margin-top:5px;">${s.catatan || '-'}</p>

        <!-- MUTASI -->
        <div class="sub-judul">🔄 Mutasi</div>
        <table class="identitas">
            <tr>
                <td class="label">Status</td>
                <td>${s.mutasi?.status || '-'}</td>
                <td class="label">Tanggal</td>
                <td>${s.mutasi?.tgl || '-'}</td>
            </tr>
            <tr>
                <td class="label">Keterangan</td>
                <td colspan="3">${s.mutasi?.keterangan || '-'}</td>
            </tr>
        </table>

        <!-- TANDA TANGAN -->
        <div class="ttd">
            <div class="box">
                <p>Orang Tua/Wali</p>
                <div class="garis"></div>
                <p>(.........................)</p>
            </div>
            <div class="box">
                <p>Wali Kelas</p>
                <div class="garis"></div>
                <p>(${namaWali})</p>
            </div>
            <div class="box">
                <p>Kepala Madrasah</p>
                <div class="garis"></div>
                <p>(${namaKepala})</p>
            </div>
        </div>
    `;

    resultContainer.innerHTML = html;
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// FUNGSI LOAD IURAN DARI DATA (tanpa localStorage)
// ============================================================

function loadIuranFromData(nis) {
    // Karena di file JSON tidak ada data iuran terpisah, kita perlu baca dari data santri
    // Tapi di struktur JSON export, iuran disimpan terpisah di key 'iuran'
    // Kita perlu akses data iuran dari variabel global yang belum ada.
    // Kita modifikasi: baca dari data yang sudah di-load.
    // Untuk saat ini, kita akan coba baca dari data santri (jika ada)
    // Atau kita load ulang dari file iuran jika ada.
    
    // Karena data iuran ada di file JSON sebagai key terpisah, kita perlu akses dari variabel global.
    // Kita tambahkan variabel global untuk iuran
    // Untuk sementara, kita kembalikan array kosong jika tidak ada data.
    // Nanti akan di-update saat load data iuran dari file JSON.
    
    // Coba cari di data santri (jika ada)
    const iuranList = [];
    // Karena iuran tidak ada di data santri, kita akan ambil dari data iuran terpisah.
    // Untuk sekarang, kita kembalikan array kosong.
    // Ini akan di-update ketika kita load data iuran dari file JSON.
    
    // Kita coba akses data iuran dari file JSON jika ada
    if (window.dataIuran) {
        Object.keys(window.dataIuran).forEach(key => {
            const data = window.dataIuran[key];
            if (data && data[nis]) {
                const entry = data[nis];
                if (entry.nominal > 0) {
                    const parts = key.split('_');
                    if (parts.length >= 4) {
                        const bulan = parseInt(parts[2]);
                        const namaIuran = parts.slice(3).join('_');
                        const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][bulan - 1] || bulan;
                        iuranList.push({
                            bulan: bulanNama,
                            namaIuran: namaIuran,
                            nominal: entry.nominal,
                            keterangan: entry.keterangan || 'Belum'
                        });
                    }
                }
            }
        });
        // Urutkan berdasarkan bulan
        iuranList.sort((a, b) => {
            const bulanOrder = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            return bulanOrder.indexOf(a.bulan) - bulanOrder.indexOf(b.bulan);
        });
    }
    
    return iuranList;
}

// ============================================================
// DAFTAR MAPEL (harus sama dengan di aplikasi utama)
// ============================================================

const MAPEL_LIST = [
    'Tauhid', 'Al-Qur\'an', 'Hadist', 'Akhlak', 'Fiqih',
    'Bahasa Arab', 'Sejarah', 'Tajwid', 'Nahwu', 'Shorrof',
    'B. Al-Qur\'an', 'TBA', 'Al-Khot', 'P. Ibadah', 'Muhafadzah'
];

// ============================================================
// EVENT LISTENERS
// ============================================================

btnCari.addEventListener('click', function() {
    const query = searchInput.value.trim();
    if (query) {
        saranContainer.style.display = 'none';
        cariSiswa(query);
    } else {
        alert('Masukkan NIS atau Nama siswa terlebih dahulu.');
    }
});

btnReset.addEventListener('click', function() {
    searchInput.value = '';
    resultContainer.style.display = 'none';
    saranContainer.style.display = 'none';
    searchInput.focus();
});

// Enter key
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnCari.click();
    }
});