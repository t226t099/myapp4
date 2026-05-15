// 状態管理
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let streak = JSON.parse(localStorage.getItem('streak')) || { count: 0, lastDate: null };

// DOM要素
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const streakCount = document.getElementById('streak-count');
const aiMessage = document.getElementById('ai-message');

// 褒め言葉リスト
const praiseMessages = {
    generic: [
        "素晴らしい！その調子です。",
        "着実に進んでいますね。自分を褒めてあげてください！",
        "ナイス！タスクが一つ片付きました。",
        "完璧です。あなたの集中力、尊敬します。",
        "一歩ずつ、確実に目標に近づいていますよ。"
    ],
    milestones: {
        1: "まずは一歩、素晴らしいスタートです！今日から新しい習慣が始まります。",
        3: "三日坊主を卒業！習慣化の波に乗っていますね。最高です！",
        7: "1週間継続！あなたはもうタスク管理の達人です。誇りに思ってください！",
        10: "10日連続！信じられない持続力です。あなたの努力は必ず報われます。",
        30: "1ヶ月継続達成！！もはやこれは才能です。あなたは最強の実行者です！"
    }
};

// 初期化
function init() {
    checkStreakReset();
    renderTodos();
    updateStreakDisplay();
}

// 起動時にストリークが途切れているか確認
function checkStreakReset() {
    if (!streak.lastDate) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 今日でも昨日でもない場合、ストリークは途切れている
    if (streak.lastDate !== today && streak.lastDate !== yesterdayStr) {
        streak.count = 0;
        localStorage.setItem('streak', JSON.stringify(streak));
    }
}

// ストリークの更新ロジック
function handleStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = streak.lastDate;

    if (lastDate === today) {
        // 今日すでに完了済みならカウントはそのまま
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
        streak.count++;
    } else {
        streak.count = 1;
    }

    streak.lastDate = today;
    localStorage.setItem('streak', JSON.stringify(streak));
    updateStreakDisplay();
}

// 表示更新
function updateStreakDisplay() {
    streakCount.textContent = streak.count;
}

function showPraise() {
    let message = "";
    if (praiseMessages.milestones[streak.count]) {
        message = praiseMessages.milestones[streak.count];
    } else {
        const randomIndex = Math.floor(Math.random() * praiseMessages.generic.length);
        message = praiseMessages.generic[randomIndex];
    }
    aiMessage.textContent = message;
    
    // アニメーション効果（簡易的）
    aiMessage.style.transform = "scale(1.05)";
    setTimeout(() => {
        aiMessage.style.transform = "scale(1)";
    }, 200);
}

// タスクの描画
function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${todo.text}</span>
            <button class="delete-btn">&times;</button>
        `;

        // 完了イベント
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => toggleTodo(index));

        // 削除イベント
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTodo(index));

        todoList.appendChild(li);
    });
}

// タスク追加
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (text) {
        todos.push({ text, completed: false });
        todoInput.value = '';
        saveAndRender();
    }
});

// タスク完了切り替え
function toggleTodo(index) {
    const wasCompleted = todos[index].completed;
    todos[index].completed = !todos[index].completed;
    
    // 未完了から完了になった時だけ褒める
    if (!wasCompleted && todos[index].completed) {
        handleStreak();
        showPraise();
    }
    
    saveAndRender();
}

// タスク削除
function deleteTodo(index) {
    todos.splice(index, 1);
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
}

init();
