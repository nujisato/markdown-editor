document.addEventListener('DOMContentLoaded', () => {
    const outlineList = document.getElementById('outline-list');

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

        // 折り畳みアイコンを追加（FontAwesomeを使用）
        const toggleIcon = document.createElement('i');
        toggleIcon.className = 'fas fa-minus'; // 初期状態は展開状態（FontAwesomeアイコン）
        toggleIcon.style.cursor = 'pointer';
        toggleIcon.style.marginRight = '10px';

// 子要素リスト
const childUl = document.createElement('ul');
childUl.style.marginLeft = '10px';
childUl.style.paddingLeft = '10px';


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
            toggleIcon.className = isHidden ? 'fas fa-minus' : 'fas fa-plus'; // アイコンを切り替え
        });

        // H1見出しのクリックで該当行に移動
        const headingText = document.createElement('span');
        headingText.textContent = item.text;
        headingText.style.cursor = 'pointer';
        headingText.style.fontWeight = 'bold';

        headingText.addEventListener('click', () => {
            editor.gotoLine(item.index + 1);
        });

        // 要素を組み立てて追加
        parentLi.appendChild(toggleIcon);
        parentLi.appendChild(headingText);
        parentLi.appendChild(childUl);

        // 初期状態は展開
        childUl.style.display = 'block';

        outlineList.appendChild(parentLi);
    });
}
    // エディタ変更時の更新
    editor.session.on('change', updateOutline);
})