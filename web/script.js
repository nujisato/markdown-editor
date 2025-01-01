document.addEventListener('DOMContentLoaded', () => {
    const preview = document.getElementById('preview');
    const outlineList = document.getElementById('outline-list');
    const fileInput = document.getElementById('file-input');
    const saveFile = document.getElementById('save-file');
    const openFile = document.getElementById('open-file');

    // Aceエディタの初期化
    const editor = ace.edit('editor');
    editor.setTheme('ace/theme/dreamweaver');
    editor.session.setMode('ace/mode/markdown');
    editor.session.setUseWrapMode(true);
    editor.setFontSize(14);
    editor.session.mergeUndoDeltas = true; 

    // markedの設定
    marked.setOptions({breaks : true});

    // アウトライン生成
    function updateOutline() {
        const lines = editor.getValue().split('\n');
        const outline = [];
        let currentParent = null;

        lines.forEach((line, index) => {
            if (line.startsWith('#')) {
                const level = line.match(/^#+/)[0].length;
                const text = line.replace(/^#+\s*/, '');

                const item = { level, text, index };

                if (level === 1) {
                    // H1レベルの場合、新しい親要素として扱う
                    currentParent = { ...item, children: [] };
                    outline.push(currentParent);
                } else if (currentParent) {
                    // H1の配下に追加
                    currentParent.children.push(item);
                }
            }
        });

        renderOutline(outline);
    }

// アウトライン描画
function renderOutline(outline) {
    outlineList.innerHTML = '';

    outline.forEach(item => {
        const parentLi = document.createElement('li');
        parentLi.style.listStyle = 'none';
        parentLi.style.marginBottom = '5px';

        // 折り畳みアイコンを追加
        const toggleIcon = document.createElement('span');
        toggleIcon.textContent = '➖'; // 初期状態は展開
        toggleIcon.style.cursor = 'pointer';
        toggleIcon.style.marginRight = '5px';

        // 子要素リスト
        const childUl = document.createElement('ul');
        childUl.style.marginLeft = '20px';
        childUl.style.paddingLeft = '10px';
        childUl.style.borderLeft = '1px solid #ccc';

        // 子要素を描画
        function renderChildItems(children, parentUl) {
            children.forEach(child => {
                const childLi = document.createElement('li');
                childLi.textContent = child.text;
                childLi.style.marginTop = '3px';
                childLi.style.cursor = 'pointer';
                childLi.style.marginLeft = `${(child.level - 2) * 10}px`; // 階層に応じてインデントを調整

                // 子要素クリックで該当行へ移動
                childLi.addEventListener('click', () => {
                    editor.gotoLine(child.index + 1);
                });

                parentUl.appendChild(childLi);
            });
        }

        // H2以下を描画
        renderChildItems(item.children, childUl);

        // 折り畳みアイコンのクリックイベント
        toggleIcon.addEventListener('click', () => {
            const isHidden = childUl.style.display === 'none';
            childUl.style.display = isHidden ? 'block' : 'none';
            toggleIcon.textContent = isHidden ? '➖' : '➕'; // アイコンを切り替え
        });

        // H1見出しのクリックで該当行に移動
        const headingText = document.createElement('span');
        headingText.textContent = item.text;
        headingText.style.cursor = 'pointer';
        headingText.style.fontWeight = 'bold';

        headingText.addEventListener('click', () => {
            editor.gotoLine(item.index + 1);
        });

        parentLi.appendChild(toggleIcon);
        parentLi.appendChild(headingText);
        parentLi.appendChild(childUl);

        // 初期状態は展開
        childUl.style.display = 'block';

        outlineList.appendChild(parentLi);
    });
}

    // プレビューを更新
    function updatePreview() {
        preview.innerHTML = marked.parse(editor.getValue());
    }

    // エディタ変更時の更新
    editor.session.on('change', updateOutline);
    editor.session.on('change', updatePreview);

    // 初期化時にプレビュー更新
    updatePreview();

    // ファイルを開く
    openFile.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                editor.setValue(reader.result, -1);
                updateOutline();
                updatePreview();
            };
            reader.readAsText(file);
        }
    });

// ファイルを保存（名前を付けて保存）
saveFile.addEventListener('click', () => {
    const defaultFileName = 'document.md';
    const fileName = prompt('ファイル名を入力してください:', defaultFileName);
    if (fileName) {
        const blob = new Blob([editor.getValue()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    }
});

    // ドラッグ＆ドロップでファイルを読み込み
    const editorDiv = document.getElementById('editor');
    editorDiv.addEventListener('dragover', e => e.preventDefault());
    editorDiv.addEventListener('drop', e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                editor.setValue(reader.result, -1);
                updateOutline();
                updatePreview();
            };
            reader.readAsText(file);
        }
    });
});

