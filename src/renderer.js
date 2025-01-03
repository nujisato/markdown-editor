const editorContainer = document.getElementById('editor');
const outlineContainer = document.getElementById('outline');
const previewContainer = document.getElementById('preview');
let fileNameDisplay = document.getElementById('fileName');
const toggleModeButton = document.getElementById('toggleMode');
const toggleOutlineButton = document.getElementById('toggleOutline');
const togglePreviewButton = document.getElementById('togglePreview');
let currentFilePath = null; // 現在編集中のファイルパス

//CodeMirrorの設定
let editor = CodeMirror(editorContainer, {
  mode: 'markdown',
  inputStyle: 'contenteditable', //textareaにすると変換窓が入力と被る デフォルトはtextarea
  lineNumbers: true, //行数表示
  lineWrapping: true,// テキストの折返しを有効化
  foldGutter: true, //折り畳みを有効化
  allowAtxHeaderWithoutSpace: true,
  dragDrop:true,
  scrollbarStyle: 'overlay',
  extraKeys: {
"Ctrl-F": "findPersistent", // Ctrl+Fで検索窓を表示
},
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  styleActiveLine: true, //現在の行をハイライト
  theme: 'default'
});

//エディタが更新されたら反映
editor.on('change', () => {
  updatePreview();
  updateOutline();
});

//markedの設定
//markedでプレビュー生成
const updatePreview = () => {
  marked.setOptions({
    breaks: true, // 改行を有効化するか
  });
  previewContainer.innerHTML = marked.parse(editor.getValue()); 

  // プレビュー内のリンクにクリックイベントを追加
  const links = previewContainer.querySelectorAll('a');
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault(); // デフォルトの遷移を防止
      const url = link.href;
      if (url) {
        window.open(url, '_blank'); // 新しいタブでリンクを開く
      }
    });
  });
}
//アウトライン生成
const updateOutline = () => {
  const content = editor.getValue();
  const headings = content.match(/^#{1,6} .+/gm) || [];
  outlineContainer.innerHTML = headings.map((h, i) => {
     const level = h.match(/^#+/)[0].length;
     const text = h.replace(/^#+\s*/, '');
     //h.replace(/^#+\s*/, '');
    const colorClass = `outline-level-${level}`;
    const hashes = '#'.repeat(level); // Match the number of #
    return `<div class="outline-item ${colorClass}" data-index="${i}">${hashes} ${text}</div>`;
  }).join('');

  Array.from(outlineContainer.children).forEach((child, index) => {
    child.addEventListener('click', () => {
      const cursor = editor.getSearchCursor(headings[index]);
      if (cursor.findNext()) {
        editor.scrollIntoView(cursor.from(), 100);
        editor.setCursor(cursor.from());
      }
    });
  });
};

//メニュー左側
///エディタを初期化して新しいファイル
document.getElementById('newFile').addEventListener('click', () => {
  if (isUnsaved) {
    const shouldProceed = confirm('保存されていない変更があります。続行しますか？');
    if (!shouldProceed) return;
  }

  editor.setValue('');
  document.getElementById("fileName").textContent = 'New File';
  outlineContainer.innerHTML = '';
  currentFilePath = null; //カレントパスをリセット
  resetUnsavedFlag(); // フラグをリセット
  document.activeElement.blur();//フォーカスを外す
});

//ファイル名をフッターに反映
function updateFileName(filePath) {
  if (filePath) {
    const fileName = filePath.split(/[/\\]/).pop(); // ファイルパスからファイル名を取得
    document.getElementById("fileName").textContent = filePath;
  } else {
    document.getElementById("fileName").textContent = 'No File';
  }
}

///開くボタン
document.getElementById('openFile').addEventListener('click', async () => {
  document.activeElement.blur();//フォーカスを外す
  if (isUnsaved) {
    const shouldProceed = confirm('保存されていない変更があります。続行しますか？');
    if (!shouldProceed) return;
  }
  const result = await window.electronAPI.openFile();
  if (result) {
    const { content, filePath } = result;
    editor.setValue(content);
    currentFilePath = filePath; // ファイルパスを更新
    updateFileName(filePath);   // ファイル名を更新
    updateOutline(content);
  }
  resetUnsavedFlag(); // フラグをリセット
});

///上書き保存ボタン
document.getElementById('saveFile').addEventListener('click', async () => {
  document.activeElement.blur();//フォーカスを外す
  if (currentFilePath) {
    const content = editor.getValue();
    await window.electronAPI.saveFile(currentFilePath, content); // ファイルパスを指定して保存
    resetUnsavedFlag(); // フラグをリセット
    createToast("上書き保存しました");
  } else {
    // 上書き保存ができない場合、別名保存を促す
    document.getElementById('saveAsFile').click();
  }
});

///別名で保存ボタン
document.getElementById('saveAsFile').addEventListener('click', async () => {
  document.activeElement.blur();//フォーカスを外す
  const content = editor.getValue();
  const filePath = await window.electronAPI.saveAsFile(content);
  if (filePath) {
    currentFilePath = filePath; // 新しいファイルパスを保存
    resetUnsavedFlag(); // フラグをリセット
    createToast("名前をつけて保存しました");
    updateFileName(filePath);   // ファイル名を更新
  }
});

//エディタ用ツール
// https://codemirror.net/1/manual.html Methodsの項目を参照
document.getElementById('undo').addEventListener('click', () => {
  editor.undo()
  document.activeElement.blur();//フォーカスを外す
});
document.getElementById('redo').addEventListener('click', () => {
  editor.redo()
  document.activeElement.blur();//フォーカスを外す
});

//メニュー右側
///ローカルストレージから設定をロード
document.addEventListener('DOMContentLoaded', function () { 
  let LthemeSelector = localStorage.getItem('LthemeSelector') || 'default'; //ライトモードテーマ
  let DthemeSelector = localStorage.getItem('DthemeSelector') || 'dracula'; //ダークモードテーマ
  let Mode = localStorage.getItem('Mode-set') || null; //モード
  let HeadSelector = localStorage.getItem('Headline') || null; //見出しの大きさを反映するか

  console.log('ロードしました。:', LthemeSelector, DthemeSelector, Mode, HeadSelector);
  
  // 初期設定
  previewContainer.classList.add('hidden'); // デフォルトでプレビューを非表示
  const codeMirrorWrapper = editor.getWrapperElement(); //エディタ本体のスタイル指定

  //ロードした設定を反映
    if (Mode == "dark-mode") {
      const body = document.body;
      document.body.classList.toggle('dark-mode'); // モード切替
      editor.setOption('theme', DthemeSelector); //モードに合わせてテーマ適用
  } else {
      editor.setOption('theme', LthemeSelector); //モードに合わせてテーマ適用
  }

 //見出しの大きさ:trueならcssを反映
 const headlineStylesheet = document.getElementById("Headline");
  if (HeadSelector == "true") { 
    const headlineLink = document.getElementById('Headline');
    headlineStylesheet.disabled = false; 
  } else  {
    const headlineLink = document.getElementById('Headline');
    headlineStylesheet.disabled = true; 
  }
 
  // 値をフォームに適用
  document.getElementById('L-theme').value = LthemeSelector;
  document.getElementById('D-theme').value = DthemeSelector;
  const checkbox = document.getElementById("set_headline");
  if (HeadSelector) {
    checkbox.checked = true;
  }else{
    checkbox.checked = false;
  }

  // 表示をアップデート
  updatePreview();
  updateOutline();

  // モード切替ボタンの処理
  toggleModeButton.addEventListener('click', () => {
    const body = document.body;
    document.body.classList.toggle('dark-mode'); // モード切替

    if (body.classList.contains('dark-mode')) {
        // ダークテーマに変更
        editor.setOption('theme', DthemeSelector);
        localStorage.setItem('Mode-set', "dark-mode"); //ローカルストレージに保存
        console.log('ダークテーマに変更:', DthemeSelector);
        console.log('現在のモード:', "dark-mode");
    } else {
        // ライトテーマに変更
        editor.setOption('theme', LthemeSelector);
        localStorage.setItem('Mode-set', "null");//ローカルストレージに保存
        console.log('ライトテーマに変更:', LthemeSelector);
        console.log('現在のモード:', "null");
    }
  document.activeElement.blur();//フォーカスを外す
  });

  // Setting Saveボタンをクリックしたときの処理
  const okButton = document.getElementById('setting_save');
  okButton.addEventListener('click', function () {
    // 入力値を取得
    LthemeSelector = document.getElementById('L-theme').value;
    DthemeSelector = document.getElementById('D-theme').value;
    if (set_headline.checked){
      HeadSelector = "true"
    } else {
      HeadSelector = "false"
    }

    // ローカルストレージに保存
    localStorage.setItem('LthemeSelector', LthemeSelector);
    localStorage.setItem('DthemeSelector', DthemeSelector);
    localStorage.setItem('Headline', HeadSelector);

    // 設定確認
    console.log('ライトテーマ:', LthemeSelector);
    console.log('ダークテーマ:', DthemeSelector);

    // 現在のモードに基づいてテーマを適用
      if (document.body.classList.contains('dark-mode')) {
        editor.setOption('theme', DthemeSelector);
        localStorage.setItem('Mode-set', "dark-mode");//ローカルストレージに保存
    } else {
        editor.setOption('theme', LthemeSelector);
        localStorage.setItem('Mode-set', null);//ローカルストレージに保存
    }

    //見出しの大きさ:trueならcssを反映
    const headlineStylesheet = document.getElementById("Headline");
    if (HeadSelector == "true") { 
      const headlineLink = document.getElementById('Headline');
      headlineStylesheet.disabled = false; // 有効化
    } else  {
      const headlineLink = document.getElementById('Headline');
      headlineStylesheet.disabled = true; // 無効化
    }
    const messageDiv = '設定を保存しました。';
    location.href = '#modals';
    createToast(messageDiv);
  });

  // リセットボタンの処理
  const resetButton = document.getElementById('reset-button');
  resetButton.addEventListener('click', () => {
      // ローカルストレージをクリア
      localStorage.clear();

      // フォームの値をデフォルトに戻す
      document.getElementById('L-theme').value = 'default';
      document.getElementById('D-theme').value = 'dracula';

      // メモリ上の変数もリセット
      LthemeSelector = 'default';
      DthemeSelector = 'dracula';

      // 設定確認
      console.log('ライトテーマ:', LthemeSelector);
      console.log('ダークテーマ:', DthemeSelector);
      const messageDiv = 'LocalStorageのデータを削除しました。';
      location.href = '#modals';
      createToast(messageDiv);


    // 現在のモードに基づいてテーマを適用
      if (document.body.classList.contains('dark-mode')) {
        editor.setOption('theme', DthemeSelector);
    } else {
        editor.setOption('theme', LthemeSelector);
    }

  });
});

//左カラムの開閉
toggleOutlineButton.addEventListener('click', () => {
  outlineContainer.classList.toggle('hidden'); 
  updateGuttersVisibility();
  document.activeElement.blur();//フォーカスを外す
});
//右カラムの開閉
togglePreviewButton.addEventListener('click', () => {
  previewContainer.classList.toggle('hidden'); 
  updateGuttersVisibility();
  document.activeElement.blur();//フォーカスを外す
});

// トーストの表示
function createToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast show';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}

//ウィンドウの分割
Split(['#outline', '#editor', '#preview'], {
  sizes: [20, 40, 40],
  minSize: 0,
  gutterSize: 3,
  cursor: 'col-resize'
});

// 関連するgutterの表示/非表示を更新する
function updateGuttersVisibility() {
  const outlineHidden = outlineContainer.classList.contains('hidden');
  const previewHidden = previewContainer.classList.contains('hidden');
  const gutters = document.querySelectorAll('.gutter');
  if (gutters[0]) {// outlineが非表示の場合、左側のgutterを非表示
    gutters[0].style.display = outlineHidden ? 'none' : 'block';
  }
  if (gutters[1]) {// previewが非表示の場合、右側のgutterを非表示
    gutters[1].style.display = previewHidden ? 'none' : 'block';
  }
}

// 初期状態のgutterの表示を設定
updateGuttersVisibility();


// 未保存の処理
let isUnsaved = false; //未保存フラグ
editor.on('change', () => {
  isUnsaved = true;
});

function resetUnsavedFlag() {// 保存成功時に未保存フラグをリセット
  isUnsaved = false;
}
