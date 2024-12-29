// テキストエディターの設定
const editor = ace.edit("inputArea");
  editor.setTheme('ace/theme/textmate'); //テーマ
  editor.session.setMode('ace/mode/markdown'); //Markdownモード
  editor.session.setUseWrapMode(true); //右端で折り返す
  editor.setFontSize(15); // フォントサイズ
  editor.getSession().setTabSize(2); //タブ幅2
  editor.setOptions({
    fontFamily:"biz UDGothic"}); 
/* フッター領域 */
const footerArea = document.querySelector("#footer");

// 「読み込む」ボタンの制御
document.querySelector("#btnOpen").addEventListener("click", () => {
  openFile();
});

// 「保存する」ボタンの制御
document.querySelector("#btnSave").addEventListener("click", () => {
  saveFile();
});

// ファイルパスのステート
let currentPath = null;

/**
 * ファイルを開きます。
 */
async function openFile() {
  // レンダラープロセスから、preload.jsを経由し、メインプロセスを呼び出し、結果を得る
  const result = await window.myApp.openFile();

  if (result) {
    const { filePath, textData } = result;

    // フッター部分に読み込み先のパスを設定する
    footerArea.textContent = currentPath = filePath;

    // テキスト入力エリアに設定する
    editor.setValue(textData, -1);
  }
}

/**
 * ファイルを保存します。
 */
async function saveFile() {
  // レンダラープロセスから、preload.jsを経由し、メインプロセスを呼び出し、結果を得る
  const result = await window.myApp.saveFile(currentPath, editor.getValue());

  if (result) {
    // フッター部分に読み込み先のパスを設定する
    footerArea.textContent = currentPath = result.filePath;
  }
}

// ---------------------------------------
// ドラッグ&ドロップ関連処理（任意実装）
// ---------------------------------------

// dropはdragoverイベントを登録していてはじめて発火するため指定
document.addEventListener("dragover", (event) => {
  event.preventDefault();
});
// ドロップされたらそのファイルを読み込む
document.addEventListener("drop", (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];

  // FileReader 機能を使って読み込み。
  const reader = new FileReader();
  reader.onload = function () {
    const textData = reader.result;

    // フッター部分に読み込み先のパスを設定する
    footerArea.textContent = currentPath = file.path;
    // テキスト入力エリアに設定する
    editor.setValue(textData, -1);
  };
  reader.readAsText(file); // テキストとして読み込み
});

// ---------------------------------------
// プレビュー機能
// ---------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleButton");
  const previewDiv = document.querySelector(".preview");
  const icon = toggleButton.querySelector("i");

  // ボタンのクリックイベント
  toggleButton.addEventListener("click", () => {
    if (previewDiv.style.display === "none" || previewDiv.style.display === "") {
      previewDiv.style.display = "block"; // プレビューを表示
      icon.className = "fa-brands fa-snapchat"; // アイコンを非表示用に変更
    } else {
      previewDiv.style.display = "none"; // プレビューを非表示
      icon.className = "fa-solid fa-ghost"; // アイコンを表示用に変更
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const preview = document.getElementById("preview");
// markedの設定
marked.setOptions({breaks : true});
})
  // プレビューを更新
  function updatePreview() {
    preview.innerHTML = marked.parse(editor.getValue());
}
  // エディタ変更時の更新
  editor.session.on('change', updatePreview);
  // 初期化時にプレビュー更新
  updatePreview();

// ---------------------------------------
// 設定ウィンドウ
// ---------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const settingButton = document.getElementById("SettingButton");
  const settingDiv = document.querySelector(".setting");
  const icon = settingButton.querySelector("i");
});

    // 幅を指定してdivの幅を変更する
    function changeWidth(width) {
      const targetDiv = document.getElementById("preview"); //幅を変更する対象のID
      targetDiv.style.width = width + "px";
    }

    // 入力値を取得して幅を設定
    function setCustomWidth() {
      const input = document.getElementById("customWidth");
      const width = parseInt(input.value, 10);
      
      if (isNaN(width) || width <= 0) {
        alert("正しい数値を入力してください。");
        return;
      }

      changeWidth(width);
    }

