// common.js
// bk1
// ページ共通JS

// ===== 設定 =====
// スプレッドシートの設定
// 1. ファイル > 共有 > ウェブに公開
// 2. 形式：CSV
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3abh6WOEam-G81jfG6h_k6QhQKIjYaJP5e3vIRZkYLUbOS5Vgb3VZsFBBSeYl6sW6l9tBtDr1XzZz/pub?gid=1531015479&single=true&output=csv";

// ===== CSV取得 =====
export async function fetchCSV() {
    const res = await fetch(CSV_URL);

    if (!res.ok) {
        throw new Error(`CSV取得エラー: ${res.status}`);
    }

    const text = await res.text();

    return parseCSV(text);
}

// ===== CSVパース =====
export function parseCSV(text) {
    const rows = [];

    let row = [];
    let value = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"') {

            // エスケープされたダブルクォーテーション
            if (inQuotes && next === '"') {
                value += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }

        } else if (char === "," && !inQuotes) {

            row.push(value);
            value = "";

        } else if (
            (char === "\n" || char === "\r") &&
            !inQuotes
        ) {

            // CRLFにも対応
            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(value);
            rows.push(row);

            row = [];
            value = "";

        } else {

            value += char;

        }
    }

    // 最後の行
    if (value !== "" || row.length > 0) {
        row.push(value);
        rows.push(row);
    }

    if (rows.length === 0) return [];

    // ヘッダー取得
    const headers = rows[0].map(h => h.trim());

    // オブジェクト化
    return rows.slice(1)
        .filter(r => r.some(v => v.trim() !== ""))
        .map(r => {
            const obj = {};

            headers.forEach((header, i) => {
                obj[header] = (r[i] || "").trim();
            });

            return obj;
        });
}

// ===== 日付処理 =====
// 日付文字列をDateに変換
// YYYY/MM/DD、YYYY-MM-DDに対応

export function parseDate(date) {
    if (!date) return null;

    const normalized = date.trim().replace(/\//g, "-");

    const match = normalized.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const result = new Date(year, month - 1, day);

    // 存在しない日付を除外
    if (
        result.getFullYear() !== year ||
        result.getMonth() !== month - 1 ||
        result.getDate() !== day
    ) {
        return null;
    }

    return result;
}

// ===== 年の取得 =====
export function getYear(date) {
    const parsed = parseDate(date);

    return parsed ? parsed.getFullYear() : null;
}

// ===== 年月の取得 =====
export function getYearMonth(date) {
    const parsed = parseDate(date);

    if (!parsed) return null;

    return {
        year: parsed.getFullYear(),
        month: parsed.getMonth() + 1,
        label: `${parsed.getFullYear()}年${parsed.getMonth() + 1}月`
    };
}

// ===== 日付順ソート =====
// 古い日付 → 新しい日付
// 日付なしは最後

export function sortByDate(items) {
    return [...items].sort((a, b) => {
        const dateA = parseDate(a.date || a["終了日"]);
        const dateB = parseDate(b.date || b["終了日"]);

        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateA - dateB;
    });
}

// ===== 著者 → タイトル順ソート =====
export function sortByAuthorAndTitle(items) {
    return [...items].sort((a, b) => {

        const authorCompare =
            (a.author || a["著者"] || "")
                .localeCompare(
                    b.author || b["著者"] || "",
                    "ja"
                );

        if (authorCompare !== 0) {
            return authorCompare;
        }

        return (
            (a.title || a["タイトル"] || "")
                .localeCompare(
                    b.title || b["タイトル"] || "",
                    "ja"
                )
        );
    });
}
