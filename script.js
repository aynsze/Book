// Book/script.js
// bk2


// スプレッドシートの設定
// 1. ファイル > 共有 > ウェブに公開
// 2. 形式：CSV

// =============================
// 設定
// =============================
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3abh6WOEam-G81jfG6h_k6QhQKIjYaJP5e3vIRZkYLUbOS5Vgb3VZsFBBSeYl6sW6l9tBtDr1XzZz/pub?gid=1531015479&single=true&output=csv"; // ←後で差し替え

const STATUS_ORDER = ["読みたい", "積読", "読書中", "読了", "中断"];

// =============================
// CSV取得
// =============================
async function fetchCSV() {
    const res = await fetch(CSV_URL);
    const text = await res.text();
    return parseCSV(text);
}

// =============================
// CSVパース
// =============================
function parseCSV(text) {
    const rows = text.trim().split("\n").map(r => r.split(","));

    return rows.slice(1).map(row => ({
        cover: row[0],
        title: row[1],
        author: row[2],
        status: row[3],
        date: row[4],
        rating: row[5],
    }));
}

// =============================
// 並び替え（著者 → タイトル）
// =============================
function sortByAuthorAndTitle(items) {
    return items.sort((a, b) => {
        const authorCompare = (a.author || "").localeCompare(b.author || "", "ja");
        if (authorCompare !== 0) return authorCompare;

        return (a.title || "").localeCompare(b.title || "", "ja");
    });
}

// =============================
// ステータス分類
// =============================
function groupByStatus(data) {
    const map = {};
    STATUS_ORDER.forEach(s => map[s] = []);

    data.forEach(item => {
        if (!map[item.status]) {
            map[item.status] = [];
        }
        map[item.status].push(item);
    });

    return map;
}

// =============================
// 年別分類（読了用）
// =============================
function groupByYear(data) {
    const map = {};

    data.forEach(item => {
        if (!item.date) return;

        const [year] = item.date.split("/");

        if (!map[year]) {
            map[year] = [];
        }

        map[year].push(item);
    });

    return Object.keys(map)
        .sort((a, b) => b - a) // 新しい年が上
        .map(year => {
            const items = map[year];

            // 日付昇順（1月 → 12月）
            items.sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(a.date) - new Date(b.date);
            });

            return {
                year,
                items
            };
        });
}

// =============================
// グリッド生成
// =============================
function createGrid(items) {
    const grid = document.createElement("div");
    grid.className = "book-grid";

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "book-grid__item";

        div.innerHTML = `
            <img src="${item.cover}" alt="${item.title}" title="${item.title}">
        `;

        grid.appendChild(div);
    });

    return grid;
}

// =============================
// 日付順に並び替え
// =============================
function sortByDate(items) {
    return items.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date) - new Date(b.date);
    });
}

// =============================
// 描画
// =============================
function render(data) {
    const app = document.getElementById("app");
    const grouped = groupByStatus(data);

    STATUS_ORDER.forEach(status => {
        let items = grouped[status];
        if (!items || items.length === 0) return;

        // ★ 「読みたい」と「積読」のみ著者昇順 → 同著者内でタイトル昇順
        if (status === "読みたい" || status === "積読") {
            items = sortByAuthorAndTitle(items);
        } else if (status === "中断") {
            items = sortByDate(items);
        }

        const block = document.createElement("div");
        block.className = "status-block";

        // ===== ステータスヘッダー =====
        const header = document.createElement("p");
        header.className = "status-block__header";

        header.innerHTML = `
            ${status}
            <span class="status-block__count">${items.length}</span>
        `;

        block.appendChild(header);

        // ===== 読了 → 年別表示 =====
        if (status === "読了") {
            const years = groupByYear(items);

            years.forEach(y => {
                const yearBlock = document.createElement("div");
                yearBlock.className = "year-block";

                const yearHeader = document.createElement("p");
                yearHeader.className = "year-block__header";

                yearHeader.innerHTML = `
                    ${y.year}
                    <span class="status-block__count">${y.items.length}</span>
                `;

                const grid = createGrid(y.items);

                yearBlock.appendChild(yearHeader);
                yearBlock.appendChild(grid);

                block.appendChild(yearBlock);
            });

        } else {
            // 「中断」もここに入るため、
            // 読了以外のステータスと同じ通常グリッド表示になる
            const grid = createGrid(items);
            block.appendChild(grid);
        }

        app.appendChild(block);
    });
}

// =============================
// 初期処理
// =============================
async function init() {
    const data = await fetchCSV();
    render(data);
}

init();
